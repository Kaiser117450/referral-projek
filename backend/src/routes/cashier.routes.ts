import { Router } from 'express';
import { CashierController } from '@/controllers/cashier.controller';

const router = Router();
const cashierController = new CashierController();

// POST /api/cashier/verify - Verify reward code
router.post('/verify', cashierController.verifyCode.bind(cashierController));

// POST /api/cashier/redeem - Mark reward as redeemed
router.post('/redeem', cashierController.redeemReward.bind(cashierController));

// GET /api/cashier/health - Health check
router.get('/health', cashierController.healthCheck.bind(cashierController));

export default router;
