import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'SELLER_APPLICATION_APPROVED'
  | 'SELLER_APPLICATION_REJECTED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'COUPON_AVAILABLE'
  | 'REVIEW_REQUEST'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  deepLink?: string; // e.g., /orders/123
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_OUT_FOR_DELIVERY',
        'ORDER_DELIVERED', 'ORDER_CANCELLED', 'REFUND_INITIATED', 'REFUND_COMPLETED',
        'SELLER_APPLICATION_APPROVED', 'SELLER_APPLICATION_REJECTED',
        'PRODUCT_APPROVED', 'PRODUCT_REJECTED', 'COUPON_AVAILABLE',
        'REVIEW_REQUEST', 'SYSTEM',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    deepLink: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
