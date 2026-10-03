import mongoose, { Document, Schema } from 'mongoose';

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
export type RefundReason =
  | 'CUSTOMER_CANCEL'
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_DAMAGED'
  | 'WRONG_ITEM'
  | 'QUALITY_ISSUE'
  | 'SELLER_CANCEL'
  | 'ADMIN_ADJUSTMENT';

export interface IRefund extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  amount: number;
  reason: RefundReason;
  description?: string;
  status: RefundStatus;
  statusHistory: {
    status: RefundStatus;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
  }[];
  images?: string[];
  razorpayRefundId?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ['CUSTOMER_CANCEL', 'ITEM_NOT_RECEIVED', 'ITEM_DAMAGED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'SELLER_CANCEL', 'ADMIN_ADJUSTMENT'],
      required: true,
    },
    description: { type: String },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'],
      default: 'REQUESTED',
    },
    statusHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      note: { type: String },
    }],
    images: [{ type: String }],
    razorpayRefundId: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    rejectionReason: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

refundSchema.index({ orderId: 1 });
refundSchema.index({ userId: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ idempotencyKey: 1 }, { unique: true });

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
