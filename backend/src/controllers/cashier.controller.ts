import { Request, Response } from 'express';
import { referralService } from '@/services/referral.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/helpers';

export class CashierController {
  /**
   * POST /api/cashier/verify
   * Verify reward code for cashier
   */
  async verifyCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      
      if (!code) {
        res.status(400).json(createErrorResponse('MISSING_CODE', 'Reward code is required'));
        return;
      }

      const verificationResult = await referralService.verifyRewardCode(code);
      
      if (!verificationResult) {
        res.status(404).json(createErrorResponse('CODE_NOT_FOUND', 'Reward code not found'));
        return;
      }

      res.json(createSuccessResponse(verificationResult));
    } catch (error) {
      console.error('Error in verifyCode:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }

  /**
   * POST /api/cashier/redeem
   * Mark reward as redeemed
   */
  async redeemReward(req: Request, res: Response): Promise<void> {
    try {
      const { code, cashierId, storeId, notes } = req.body;
      
      if (!code || !cashierId || !storeId) {
        res.status(400).json(createErrorResponse('MISSING_FIELDS', 'Code, cashier ID, and store ID are required'));
        return;
      }

      const success = await referralService.redeemReward(code, cashierId, storeId, notes);
      
      if (success) {
        res.json(createSuccessResponse({
          message: 'Reward redeemed successfully',
          code,
          redeemedAt: new Date().toISOString()
        }));
      } else {
        res.status(400).json(createErrorResponse('REDEMPTION_FAILED', 'Failed to redeem reward'));
      }
    } catch (error) {
      console.error('Error in redeemReward:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }

  /**
   * GET /api/cashier/health
   * Health check for cashier service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.json(createSuccessResponse({
        message: 'Cashier service is healthy',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error in healthCheck:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'));
    }
  }
}


