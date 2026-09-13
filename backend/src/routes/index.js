import { Router } from 'express';
import authRoute from './auth.js';
import usersRoute from './users.js';
import adminRoute from './admin.js';
import paymentsRoute from './payments.js';

const router = Router();

router.use('/auth', authRoute);
router.use('/users', usersRoute);
router.use('/admin', adminRoute);
router.use('/payments', paymentsRoute);

export default router;
