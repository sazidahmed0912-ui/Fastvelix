import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType =
  | 'REFERRAL_REWARD'
  | 'ORDER_WALLET_DEBIT'
  | 'REFUND_CREDIT'
  | 'WALLET_REVERSAL'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT'
  | 'WALLET_TOPUP'
  | 'CASHBACK_REWARD';

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  orderId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'REFERRAL_REWARD',
        'ORDER_WALLET_DEBIT',
        'REFUND_CREDIT',
        'WALLET_REVERSAL',
        'ADMIN_CREDIT',
        'ADMIN_DEBIT',
        'WALLET_TOPUP',
        'CASHBACK_REWARD',
      ],
      required: true,
    },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  pendingCashback: number;
  referralEarnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    pendingCashback: { type: Number, default: 0, min: 0 },
    referralEarnings: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema);
export const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
