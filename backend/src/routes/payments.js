import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createConnectOnboardingLink,
  getConnectAccountStatus,
  handleStripeWebhook,
  createSubscriptionCheckout,
  createTipCheckout,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/webhook', handleStripeWebhook);
router.use(authenticate);
router.post('/checkout/subscription', createSubscriptionCheckout);
router.post('/checkout/tip', createTipCheckout);
router.post('/connect/onboarding-link', createConnectOnboardingLink);
router.get('/connect/account-status', getConnectAccountStatus);

export default router;
