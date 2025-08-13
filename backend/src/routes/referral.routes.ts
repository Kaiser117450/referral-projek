import { Router } from 'express';
import { ReferralController } from '@/controllers/referral.controller';

const router = Router();
const referralController = new ReferralController();

// GET /api/referral/demo/rewards - Get available rewards (demo endpoint expected by frontend)
router.get('/demo/rewards', referralController.getAvailableRewards.bind(referralController));

// GET /api/referral/:code - Get referral details by code
router.get('/:code', referralController.getReferralByCode.bind(referralController));

// GET /api/referral/:code/rewards - Get available rewards for referral
router.get('/:code/rewards', referralController.getAvailableRewards.bind(referralController));

// POST /api/claim - Claim reward for referral
router.post('/claim', referralController.claimReward.bind(referralController));

// POST /api/referral/generate-link - Generate link
router.post('/generate-link', referralController.generateLink.bind(referralController));

// GET /api/referral/points/:inviterId - Get inviter points
router.get('/points/:inviterId', referralController.getPoints.bind(referralController));

// GET /api/referral/stats/demo - Get demo referral statistics
router.get('/stats/demo', referralController.getDemoStats.bind(referralController));

export default router;


