import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import voucherRoutes from './voucher.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/users', userRoutes);

export { healthRoutes };
export default router;
