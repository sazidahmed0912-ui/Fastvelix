import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliverySlot extends Document {
  slotTime: string; // e.g. "10:00 AM – 12:00 PM", "12:00 PM – 02:00 PM"
  cutoffHours: number; // minimum lead time before slot opens
  maxOrdersPerSlot: number;
  isActive: boolean;
  sortOrder: number;
}

export interface IBlockedDate extends Document {
  date: string; // "YYYY-MM-DD"
  reason?: string;
  sellerId?: mongoose.Types.ObjectId;
}

const deliverySlotSchema = new Schema<IDeliverySlot>({
  slotTime: { type: String, required: true, unique: true },
  cutoffHours: { type: Number, default: 4 },
  maxOrdersPerSlot: { type: Number, default: 15 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const blockedDateSchema = new Schema<IBlockedDate>({
  date: { type: String, required: true },
  reason: { type: String },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
});

blockedDateSchema.index({ date: 1, sellerId: 1 }, { unique: true });

export const DeliverySlot = mongoose.model<IDeliverySlot>('DeliverySlot', deliverySlotSchema);
export const BlockedDate = mongoose.model<IBlockedDate>('BlockedDate', blockedDateSchema);
