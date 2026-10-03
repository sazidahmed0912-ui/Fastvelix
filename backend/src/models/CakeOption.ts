import mongoose, { Document, Schema } from 'mongoose';

export interface ICakeSize extends Document {
  name: string; // e.g. "0.5 kg", "1 kg", "1.5 kg", "2 kg", "3 kg"
  weightKg: number;
  servings: string; // e.g. "4-6 People"
  extraPrice: number; // e.g. 0 for 0.5kg, 400 for 1kg
  sortOrder: number;
  isActive: boolean;
}

export interface ICakeFlavour extends Document {
  name: string; // e.g. "Belgian Chocolate", "Red Velvet Velvet", "Vanilla Bean"
  description?: string;
  image?: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ICakeStyle extends Document {
  name: string; // e.g. "Minimalist Pastel", "Floral Dream", "Royal Gold", "Comic Cartoon"
  category: string; // "BIRTHDAY", "WEDDING", "ANNIVERSARY", "KIDS", "LUXURY"
  image?: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ICakeTopper extends Document {
  name: string; // e.g. "Happy Birthday (Gold Acrylic)", "Happy Anniversary (Wooden)", "Custom Name"
  extraPrice: number;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ICakeDecoration extends Document {
  name: string; // e.g. "Edible Gold Foil", "Fresh Macarons", "Sparkler Candles"
  extraPrice: number;
  isActive: boolean;
  sortOrder: number;
}

const cakeSizeSchema = new Schema<ICakeSize>({
  name: { type: String, required: true, unique: true },
  weightKg: { type: Number, required: true },
  servings: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const cakeFlavourSchema = new Schema<ICakeFlavour>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  extraPrice: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const cakeStyleSchema = new Schema<ICakeStyle>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  extraPrice: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const cakeTopperSchema = new Schema<ICakeTopper>({
  name: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const cakeDecorationSchema = new Schema<ICakeDecoration>({
  name: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

export const CakeSize = mongoose.model<ICakeSize>('CakeSize', cakeSizeSchema);
export const CakeFlavour = mongoose.model<ICakeFlavour>('CakeFlavour', cakeFlavourSchema);
export const CakeStyle = mongoose.model<ICakeStyle>('CakeStyle', cakeStyleSchema);
export const CakeTopper = mongoose.model<ICakeTopper>('CakeTopper', cakeTopperSchema);
export const CakeDecoration = mongoose.model<ICakeDecoration>('CakeDecoration', cakeDecorationSchema);
