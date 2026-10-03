import mongoose, { Document, Schema } from 'mongoose';

export interface ICakeConfiguration {
  size?: string;
  flavour?: string;
  style?: string;
  colour?: string;
  message?: string;
  photoUrl?: string;
  topper?: string;
  decoration?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  additionalNotes?: string;
  customPrice?: number;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string;
  thumbnail: string;
  topLevelCategory: 'FASHION' | 'CAKES_AND_BAKES';
  sku: string;
  // Fashion
  size?: string;
  color?: string;
  // Cakes & Bakes
  flavour?: string;
  weight?: string;
  isEggless?: boolean;
  cakeConfiguration?: ICakeConfiguration;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  grandTotal: number;
  lastValidatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cakeConfigurationSchema = new Schema<ICakeConfiguration>({
  size: { type: String },
  flavour: { type: String },
  style: { type: String },
  colour: { type: String },
  message: { type: String },
  photoUrl: { type: String },
  topper: { type: String },
  decoration: { type: String },
  deliveryDate: { type: String },
  deliverySlot: { type: String },
  additionalNotes: { type: String },
  customPrice: { type: Number },
}, { _id: false });

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  thumbnail: { type: String },
  topLevelCategory: { type: String, enum: ['FASHION', 'CAKES_AND_BAKES'], required: true },
  sku: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  flavour: { type: String },
  weight: { type: String },
  isEggless: { type: Boolean, default: false },
  cakeConfiguration: cakeConfigurationSchema,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    lastValidatedAt: { type: Date },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
