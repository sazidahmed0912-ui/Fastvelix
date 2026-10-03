import { Router, Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon';

const router = Router();

// GET /api/coupons/public ─── List all active, non-expired public coupons
router.get('/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    })
      .select('code discountType discountValue minOrderValue maxDiscount description terms expiresAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      coupons,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
