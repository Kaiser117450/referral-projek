import { Request, Response } from 'express';
import { referralService } from '@/services/referral.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/helpers';

export class ReferralController {
  /**
   * GET /api/referral/:code
   * Get referral details by code
   */
  async getReferralByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      
      if (!code) {
        res.status(400).json(createErrorResponse('INVALID_CODE', 'Referral code is required'));
        return;
      }

      const referral = await referralService.getReferralByCode(code);
      
      if (!referral) {
        res.status(404).json(createErrorResponse('REFERRAL_NOT_FOUND', 'Referral code not found'));
        return;
      }

      res.json(createSuccessResponse(referral));
    } catch (error) {
      console.error('Error in getReferralByCode:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }

  /**
   * GET /api/referral/:code/rewards
   * Get available rewards for referral
   */
  async getAvailableRewards(req: Request, res: Response): Promise<void> {
    try {
      const rewards = await referralService.getAvailableRewards();
      res.json(createSuccessResponse(rewards));
    } catch (error) {
      console.error('Error in getAvailableRewards:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }

  /**
   * POST /api/claim
   * Claim reward for referral
   */
  async claimReward(req: Request, res: Response): Promise<void> {
    try {
      const { referralCode, rewardId } = req.body;
      
      if (!referralCode || !rewardId) {
        res.status(400).json(createErrorResponse('MISSING_FIELDS', 'Referral code and reward ID are required'));
        return;
      }

      const claimResult = await referralService.createReferralAndReward(referralCode, rewardId);
      res.json(createSuccessResponse(claimResult));
    } catch (error) {
      console.error('Error in claimReward:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }

  /**
   * GET /api/referral/stats/demo
   * Get demo referral statistics (for Initial Build)
   */
  async getDemoStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await referralService.getDemoReferralStats();
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('Error in getDemoStats:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }
}


