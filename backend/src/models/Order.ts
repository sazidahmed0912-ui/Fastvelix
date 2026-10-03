import mongoose, { Document, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ICakeConfiguration } from './Cart';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type BakeryPreparationStatus =
  | 'ORDER_CONFIRMED'
  | 'BAKING'
  | 'DECORATION'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

// Valid state transitions (enforced server-side)
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  CANCELLED: [],
  RETURN_REQUESTED: ['RETURNED', 'CONFIRMED'], // CONFIRMED = return rejected
  RETURNED: ['REFUND_PENDING'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
};

// Immutable snapshot of what was in the cart at time of order
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string; // snapshot
  thumbnail: string; // snapshot
  brand?: string;
  topLevelCategory: 'FASHION' | 'CAKES_AND_BAKES';
  sku: string;
  size?: string;
  color?: string;
  flavour?: string;
  weight?: string;
  isEggless?: boolean;
  cakeConfiguration?: ICakeConfiguration;
  quantity: number;
  unitPrice: number; // snapshot — never recalculate from live product
  totalPrice: number;
  tax: number;
  discount: number;
  isReturnable: boolean;
  returnWindow: number;
}

export interface IStatusHistory {
  from?: OrderStatus;
  to: OrderStatus;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  actorRole?: string;
  note?: string;
}

export interface IDeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress; // snapshot
  status: OrderStatus;
  bakeryStatus?: BakeryPreparationStatus;
  statusHistory: IStatusHistory[];
  paymentId?: mongoose.Types.ObjectId;
  paymentMethod: 'RAZORPAY' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  taxTotal: number;
  shippingFee: number;
  grandTotal: number;
  deliveryDate?: string;
  deliverySlot?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  internalNote?: string;
  idempotencyKey: string;
  // Real-Time Tracking Fields (from Fzokart)
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
    updatedAt?: Date;
  };
  deliveryAgent?: {
    name?: string;
    phone?: string;
    vehicle?: string;
  };
  deliveryText?: string; // Custom expected arrival text shown to customer
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

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  thumbnail: { type: String },
  brand: { type: String },
  topLevelCategory: { type: String, enum: ['FASHION', 'CAKES_AND_BAKES'], required: true },
  sku: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  flavour: { type: String },
  weight: { type: String },
  isEggless: { type: Boolean, default: false },
  cakeConfiguration: cakeConfigurationSchema,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  isReturnable: { type: Boolean, default: false },
  returnWindow: { type: Number, default: 0 },
});

const deliveryAddressSchema = new Schema<IDeliveryAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
});

const statusHistorySchema = new Schema<IStatusHistory>({
  from: { type: String },
  to: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  note: { type: String },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    status: {
      type: String,
      enum: Object.keys(VALID_ORDER_TRANSITIONS),
      default: 'PENDING',
    },
    bakeryStatus: {
      type: String,
      enum: ['ORDER_CONFIRMED', 'BAKING', 'DECORATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'],
      default: 'ORDER_CONFIRMED',
    },
    statusHistory: [statusHistorySchema],
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentMethod: { type: String, enum: ['RAZORPAY', 'COD'], required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    deliveryDate: { type: String },
    deliverySlot: { type: String },
    trackingNumber: { type: String },
    shippingCarrier: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    internalNote: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
    // Real-Time Tracking Fields (from Fzokart)
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      updatedAt: { type: Date },
    },
    deliveryAgent: {
      name: { type: String },
      phone: { type: String },
      vehicle: { type: String },
    },
    deliveryText: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.sellerId': 1, status: 1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true });
orderSchema.index({ createdAt: -1 });

orderSchema.plugin(mongoosePaginate);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
