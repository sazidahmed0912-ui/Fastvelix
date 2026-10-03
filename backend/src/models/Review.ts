import mongoose, { Document, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN' | 'FLAGGED' | 'REMOVED';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  orderItemSku: string;
  rating: number; // 1–5
  title?: string;
  body: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  moderationNote?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderItemSku: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'HIDDEN', 'FLAGGED', 'REMOVED'],
      default: 'PENDING',
    },
    moderationNote: { type: String },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    helpfulVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per order item per user
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });

reviewSchema.plugin(mongoosePaginate);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
