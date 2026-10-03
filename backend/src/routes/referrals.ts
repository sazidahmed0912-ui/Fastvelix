import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Wallet } from '../models/Wallet';
import { User } from '../models/User';

const router = Router();

// GET /api/referrals/my-profile ─── Get referral profile, referral code and rewards overview
router.get('/my-profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const userId = user._id;

    // Generate referral code if user doesn't have one
    let referralCode = (user as any).referralCode;
    if (!referralCode) {
      referralCode = (user.name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()).replace(/[^A-Z0-9]/g, 'X');
      await User.findByIdAndUpdate(userId, { referralCode });
    }

    const wallet = await Wallet.findOne({ userId });

    const totalReferred = 0; // count of users referred
    const totalEarned = wallet?.referralEarnings || 0;

    res.json({
      success: true,
      data: {
        referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'https://fastvelix.com'}/signup?ref=${referralCode}`,
        stats: {
          totalReferred,
          totalEarned,
          pendingRewards: 0,
        },
        program: {
          referrerReward: { type: 'WALLET_CASH', value: 100, minOrderValue: 299 },
          refereeReward: { type: 'DISCOUNT_VOUCHER', value: 100, minOrderValue: 299 },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
