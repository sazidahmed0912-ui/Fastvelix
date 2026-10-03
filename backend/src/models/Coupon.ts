import mongoose, { Document, Schema } from 'mongoose';

export type CouponType =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'FREE_SHIPPING'
  | 'BOGO'
  | 'BUY_X_GET_Y'
  | 'CATEGORY_SPECIFIC'
  | 'PRODUCT_SPECIFIC'
  | 'MIN_CART_VALUE';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  type: CouponType;
  value: number; // percentage or fixed amount
  minOrderValue: number;
  maxDiscount?: number; // cap for percentage coupons
  startDate: Date;
  endDate: Date;
  usageLimit?: number; // total uses allowed
  perUserLimit: number;
  totalUsed: number;
  isActive: boolean;
  // Restrictions
  applicableCategories: ('FASHION' | 'CAKES_AND_BAKES')[];
  applicableSellers: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  // Advanced conditions (from Fzokart coupon engine)
  conditions?: {
    allowedCategories?: string[];
    excludedCategories?: string[];
    allowedProducts?: string[];
    paymentRestriction?: string; // 'COD' | 'ONLINE'
    firstOrderOnly?: boolean;
    buyX?: number; // for BUY_X_GET_Y
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  discountAmount: number;
  usedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'Coupon code must be 3-20 alphanumeric characters'],
    },
    description: { type: String },
    type: {
      type: String,
      enum: [
        'PERCENTAGE',
        'FIXED',
        'FREE_SHIPPING',
        'BOGO',
        'BUY_X_GET_Y',
        'CATEGORY_SPECIFIC',
        'PRODUCT_SPECIFIC',
        'MIN_CART_VALUE',
      ],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    totalUsed: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: String, enum: ['FASHION', 'CAKES_AND_BAKES'] }],
    applicableSellers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    // Advanced conditions object (from Fzokart coupon engine)
    conditions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const couponUsageSchema = new Schema<ICouponUsage>({
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  discountAmount: { type: Number, required: true },
  usedAt: { type: Date, default: Date.now },
});

couponSchema.index({ endDate: 1, isActive: 1 });
couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ orderId: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
export const CouponUsage = mongoose.model<ICouponUsage>('CouponUsage', couponUsageSchema);
