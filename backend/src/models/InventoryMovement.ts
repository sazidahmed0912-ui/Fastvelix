import mongoose, { Document, Schema } from 'mongoose';

export type MovementType = 'SOLD' | 'RESERVED' | 'RELEASED' | 'RESTOCKED' | 'ADJUSTED' | 'RETURNED';

export interface IInventoryMovement extends Document {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  sku: string;
  type: MovementType;
  quantity: number;
  orderId?: mongoose.Types.ObjectId;
  note?: string;
  performedBy?: mongoose.Types.ObjectId;
  stockBefore: number;
  stockAfter: number;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sku: { type: String, required: true },
    type: {
      type: String,
      enum: ['SOLD', 'RESERVED', 'RELEASED', 'RESTOCKED', 'ADJUSTED', 'RETURNED'],
      required: true,
    },
    quantity: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventoryMovementSchema.index({ productId: 1, sku: 1, createdAt: -1 });
inventoryMovementSchema.index({ orderId: 1 });
inventoryMovementSchema.index({ sellerId: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model<IInventoryMovement>(
  'InventoryMovement',
  inventoryMovementSchema
);
