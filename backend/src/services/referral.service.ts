import { PrismaClient } from '@prisma/client';
import { generateReferralCode, generateRewardCode, calculateExpirationTime } from '@/utils/helpers';
import { redisService } from './redis.service';
import { 
  ReferralData, 
  RewardData, 
  RewardCodeData, 
  ClaimRewardResponse,
  VerifyCodeResponse,
  PointsResponse 
} from '@/types';
import QRCode from 'qrcode';
import { s3Service } from './s3.service';

const prisma = new PrismaClient();

export class ReferralService {
  /**
   * Get referral details by code
   */
  async getReferralByCode(code: string): Promise<ReferralData | null> {
    try {
      const referral = await prisma.referral.findUnique({
        where: { referralCode: code },
        include: {
          rewardCodeRef: {
            include: {
              reward: true
            }
          }
        }
      });

      if (!referral) {
        return null;
      }

      return {
        id: referral.id,
        referralCode: referral.referralCode,
        inviteePhone: referral.inviteePhone || undefined,
        status: referral.status,
        rewardCode: referral.rewardCode,
        claimedAt: referral.claimedAt?.toISOString(),
        redeemedAt: referral.redeemedAt?.toISOString(),
        createdAt: referral.createdAt.toISOString(),
        updatedAt: referral.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting referral by code:', error);
      throw error;
    }
  }

  /**
   * Get available rewards for referral
   */
  async getAvailableRewards(): Promise<RewardData[]> {
    try {
      const rewards = await prisma.reward.findMany({
        where: {
          isActive: true,
          stockQuantity: { gt: 0 }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        category: reward.category,
        isActive: reward.isActive,
        stockQuantity: reward.stockQuantity,
        createdAt: reward.createdAt.toISOString(),
        updatedAt: reward.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting available rewards:', error);
      throw error;
    }
  }

  /**
   * Create new referral and reward code
   */
  async createReferralAndReward(referralCode: string, rewardId: string): Promise<ClaimRewardResponse> {
    try {
      // Create referral
      const referral = await prisma.referral.create({
        data: {
          referralCode,
          inviterId: referralCode, // track inviter by referral code for initial phase
          status: 'PENDING'
        }
      });

      // Generate unique reward code
      let rewardCode: string;
      let isUnique = false;
      
      while (!isUnique) {
        rewardCode = generateRewardCode();
        const existing = await prisma.rewardCode.findUnique({
          where: { code: rewardCode }
        });
        if (!existing) {
          isUnique = true;
        }
      }

      // Calculate expiration time (5 minutes)
      const expiresAt = calculateExpirationTime(5);

      // Create reward code
      const newRewardCode = await prisma.rewardCode.create({
        data: {
          code: rewardCode!,
          rewardId,
          referralId: referral.id,
          expiresAt
        },
        include: {
          reward: true
        }
      });

      // Generate QR and upload to S3 (optional if bucket set)
      let qrUrl: string | undefined;
      try {
        const qrPng = await QRCode.toBuffer(rewardCode!, { scale: 6 });
        const key = `qr/${rewardCode}.png`;
        qrUrl = await s3Service.uploadBuffer(key, qrPng, 'image/png');
      } catch (_) {
        // ignore if S3 not configured
      }

      // Store timer data in Redis
      await redisService.storeTimer(rewardCode!, {
        code: rewardCode!,
        expiresAt: Math.floor(expiresAt.getTime() / 1000),
        referralId: referral.id,
        rewardId
      }, 300); // 5 minutes

      // Update referral with reward code
      await prisma.referral.update({
        where: { id: referral.id },
        data: { 
          rewardCode: rewardCode!,
          status: 'CLAIMED',
          claimedAt: new Date()
        }
      });

      return {
        claimId: referral.id,
        rewardCode: rewardCode!,
        reward: {
          id: newRewardCode.reward.id,
          name: newRewardCode.reward.name,
          description: newRewardCode.reward.description,
          pointsRequired: newRewardCode.reward.pointsRequired,
          category: newRewardCode.reward.category,
          isActive: newRewardCode.reward.isActive,
          stockQuantity: newRewardCode.reward.stockQuantity,
          createdAt: newRewardCode.reward.createdAt.toISOString(),
          updatedAt: newRewardCode.reward.updatedAt.toISOString()
        },
        expiresAt: expiresAt.toISOString(),
        timerMinutes: 5,
        qrUrl
      };
    } catch (error) {
      console.error('Error creating referral and reward:', error);
      throw error;
    }
  }

  /**
   * Verify reward code for cashier
   */
  async verifyRewardCode(code: string): Promise<VerifyCodeResponse | null> {
    try {
      // Check Redis first for timer data
      const timerData = await redisService.getTimer(code);
      
      if (!timerData) {
        return null;
      }

      // Get reward code from database
      const rewardCode = await prisma.rewardCode.findUnique({
        where: { code },
        include: {
          reward: true,
          referral: true
        }
      });

      if (!rewardCode) {
        return null;
      }

      // Check if code is expired
      const isExpired = rewardCode.expiresAt < new Date();
      const remainingTime = await redisService.getRemainingTime(code);

      // Determine status
      let status: 'VALID' | 'INVALID' | 'EXPIRED' | 'USED';
      if (rewardCode.status === 'USED') {
        status = 'USED';
      } else if (isExpired || remainingTime <= 0) {
        status = 'EXPIRED';
        // Rule: expired codes should be removed to avoid reuse
        try {
          await prisma.rewardCode.delete({ where: { code } });
          await prisma.referral.updateMany({
            where: { rewardCode: code },
            data: { status: 'EXPIRED' }
          });
          await redisService.deleteTimer(code);
        } catch (e) {
          // swallow if already deleted by another process
        }
      } else {
        status = 'VALID';
      }

      return {
        code: rewardCode.code,
        reward: {
          id: rewardCode.reward.id,
          name: rewardCode.reward.name,
          description: rewardCode.reward.description,
          pointsRequired: rewardCode.reward.pointsRequired,
          category: rewardCode.reward.category,
          isActive: rewardCode.reward.isActive,
          stockQuantity: rewardCode.reward.stockQuantity,
          createdAt: rewardCode.reward.createdAt.toISOString(),
          updatedAt: rewardCode.reward.updatedAt.toISOString()
        },
        status,
        remainingTime: status === 'VALID' ? remainingTime : undefined,
        claimedAt: rewardCode.referral.claimedAt?.toISOString() || new Date().toISOString(),
        expiresAt: rewardCode.expiresAt.toISOString()
      };
    } catch (error) {
      console.error('Error verifying reward code:', error);
      throw error;
    }
  }

  /**
   * Mark reward as redeemed
   */
  async redeemReward(code: string, cashierId: string, storeId: string, notes?: string): Promise<boolean> {
    try {
      // Update reward code status
      await prisma.rewardCode.update({
        where: { code },
        data: {
          status: 'USED',
          usedAt: new Date()
        }
      });

      // Update referral status
      await prisma.referral.updateMany({
        where: { rewardCode: code },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date()
        }
      });

      // Create claimed reward record
      const rewardCode = await prisma.rewardCode.findUnique({
        where: { code },
        include: { reward: true }
      });

      if (rewardCode) {
        await prisma.claimedReward.create({
          data: {
            rewardCode: code,
            rewardName: rewardCode.reward.name,
            redeemedAt: new Date(),
            cashierId,
            storeId,
            notes
          }
        });
      }

      // Award 1 point to inviter if exists
      try {
        const referral = await prisma.referral.findFirst({ where: { rewardCode: code } });
        if (referral?.inviterId) {
          await prisma.userPoint.upsert({
            where: { inviterId: referral.inviterId },
            update: { points: { increment: 1 } },
            create: { inviterId: referral.inviterId, points: 1 }
          });
        }
      } catch (_) {
        // points system optional; ignore errors
      }

      // Remove timer from Redis
      await redisService.deleteTimer(code);

      return true;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  async getPoints(inviterId: string): Promise<PointsResponse> {
    const up = await prisma.userPoint.findUnique({ where: { inviterId } });
    const points = up?.points ?? 0;
    const milestones = [10, 25, 50, 100];
    const nextMilestone = milestones.find(m => m > points);
    return {
      inviterId,
      points,
      nextMilestone,
      pointsToNext: nextMilestone ? nextMilestone - points : 0
    };
  }

  /**
   * Get demo referral statistics (for Initial Build)
   */
  async getDemoReferralStats(): Promise<any> {
    try {
      const totalReferrals = await prisma.referral.count();
      const successfulReferrals = await prisma.referral.count({
        where: { status: 'REDEEMED' }
      });
      const pendingReferrals = await prisma.referral.count({
        where: { status: 'CLAIMED' }
      });

      return {
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        totalPoints: successfulReferrals * 50, // Demo: 50 points per successful referral
        pointsThisMonth: Math.floor(successfulReferrals * 50 * 0.3), // Demo: 30% of total
        conversionRate: totalReferrals > 0 ? Math.round((successfulReferrals / totalReferrals) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting demo referral stats:', error);
      throw error;
    }
  }
}

export const referralService = new ReferralService();


