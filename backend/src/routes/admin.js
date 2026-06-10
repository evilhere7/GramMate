import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAnalytics, listAuditLogs, getSettings, updateSetting, listSupportTickets } from '../controllers/adminController.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'));

router.get('/analytics', getAnalytics);
router.get('/audit-logs', listAuditLogs);
router.get('/support-tickets', listSupportTickets);
router.get('/settings', getSettings);
router.patch('/settings', updateSetting);

export default router;
