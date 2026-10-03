import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      addedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
