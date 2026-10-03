import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Wallet, WalletTransaction } from '../models/Wallet';
import { AppError } from '../utils/AppError';

const router = Router();

// GET /api/wallet/me ─── Get current user's wallet
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, pendingCashback: 0, referralEarnings: 0 });
    }

    res.json({
      success: true,
      wallet,
      balance: wallet.balance,
      pendingCashback: wallet.pendingCashback,
      referralEarnings: wallet.referralEarnings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallet/transactions ─── Get user's wallet transactions
router.get('/transactions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const type = req.query.type as string;

    const filter: Record<string, any> = { userId };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/wallet/topup ─── Top-up wallet credit (simulated/testing)
router.post('/topup', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0 || amount > 100000) {
      return next(new AppError('Please specify a valid amount between ₹1 and ₹1,00,000.', 400, 'INVALID_AMOUNT'));
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;
    wallet.balance = balanceAfter;
    await wallet.save();

    const tx = await WalletTransaction.create({
      walletId: wallet._id,
      userId,
      type: 'WALLET_TOPUP',
      direction: 'CREDIT',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Wallet recharge of ₹${amount}`,
    });

    res.json({
      success: true,
      message: `₹${amount} successfully added to your wallet!`,
      wallet,
      transaction: tx,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
