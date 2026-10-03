import mongoose, { Document, Schema } from 'mongoose';

export type SellerStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface ISeller extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  businessType: 'INDIVIDUAL' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'LLP' | 'PROPRIETORSHIP';
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  logo?: string;
  banner?: string;
  pickupAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch?: string;
  };
  categoryPermissions: ('FASHION' | 'CAKES_AND_BAKES')[];
  status: SellerStatus;
  statusHistory: {
    status: SellerStatus;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
  }[];
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    rating: number;
  };
  suspensionReason?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerApplication extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  businessType: string;
  gstin?: string;
  pan?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  requestedCategories: ('FASHION' | 'CAKES_AND_BAKES')[];
  documents: { type: string; url: string }[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<ISeller>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      enum: ['INDIVIDUAL', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'LLP', 'PROPRIETORSHIP'],
      required: true,
    },
    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    website: { type: String },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    pickupAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    bankDetails: {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String, uppercase: true },
      bankName: { type: String },
      branch: { type: String },
    },
    categoryPermissions: [{
      type: String,
      enum: ['FASHION', 'CAKES_AND_BAKES'],
    }],
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'SUBMITTED',
    },
    statusHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      note: { type: String },
    }],
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
    },
    suspensionReason: { type: String },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

const sellerApplicationSchema = new Schema<ISellerApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true },
    gstin: { type: String, trim: true },
    pan: { type: String, trim: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: { type: String, required: true },
    businessAddress: {
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    requestedCategories: [{
      type: String,
      enum: ['FASHION', 'CAKES_AND_BAKES'],
    }],
    documents: [{
      type: { type: String },
      url: { type: String },
    }],
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'SUBMITTED',
    },
    reviewNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

sellerSchema.index({ userId: 1 }, { unique: true });
sellerSchema.index({ status: 1 });
sellerApplicationSchema.index({ userId: 1 });
sellerApplicationSchema.index({ status: 1 });

export const Seller = mongoose.model<ISeller>('Seller', sellerSchema);
export const SellerApplication = mongoose.model<ISellerApplication>(
  'SellerApplication',
  sellerApplicationSchema
);
