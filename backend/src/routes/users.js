import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMe, updateMe, listUsers, getUser, updateUserRole, deleteUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);
router.get('/me', getMe);
router.patch('/me', updateMe);

router.get('/', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), listUsers);
router.get('/:userId', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), getUser);
router.patch('/:userId/role', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), updateUserRole);
router.delete('/:userId', authorize('ADMIN', 'MODERATOR', 'SUPER_ADMIN'), deleteUser);

export default router;
