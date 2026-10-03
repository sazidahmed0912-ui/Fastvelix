import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  isBilling: boolean;
  isShipping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      enum: ['HOME', 'WORK', 'OTHER'],
      default: 'HOME',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
    isBilling: { type: Boolean, default: true },
    isShipping: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure only one default address per user
addressSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await (this.constructor as typeof mongoose.Model).updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

export const Address = mongoose.model<IAddress>('Address', addressSchema);
