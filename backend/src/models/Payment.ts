import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: 'RAZORPAY' | 'COD';
  status: PaymentStatus;
  amount: number; // in INR
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundedAmount: number;
  refunds: {
    razorpayRefundId: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
  webhookEvents: {
    event: string;
    payload: Record<string, unknown>;
    processedAt: Date;
  }[];
  failureReason?: string;
  paidAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['RAZORPAY', 'COD'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    refundedAmount: { type: Number, default: 0 },
    refunds: [{
      razorpayRefundId: { type: String },
      amount: { type: Number },
      status: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],
    webhookEvents: [{
      event: { type: String },
      payload: { type: Schema.Types.Mixed },
      processedAt: { type: Date, default: Date.now },
    }],
    failureReason: { type: String },
    paidAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
