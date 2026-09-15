import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createConnectOnboardingLink,
  getConnectAccountStatus,
  handleStripeWebhook,
  createSubscriptionCheckout,
  createTipCheckout,
  recordQualifiedViewEvent,
  runCreatorSettlementJob,
  processPayout,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/webhook', handleStripeWebhook);
router.use(authenticate);
router.post('/checkout/subscription', createSubscriptionCheckout);
router.post('/checkout/tip', createTipCheckout);
router.post('/engagement/qualified-view', recordQualifiedViewEvent);
router.post('/settlements/creator', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), runCreatorSettlementJob);
router.post('/payouts/process', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), processPayout);
router.post('/connect/onboarding-link', createConnectOnboardingLink);
router.get('/connect/account-status', getConnectAccountStatus);

export default router;
