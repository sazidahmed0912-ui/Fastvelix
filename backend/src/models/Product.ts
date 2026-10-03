import mongoose, { Document, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { TopLevelCategory } from './Category';

// Product status lifecycle
export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';

export type ProductType = 'STANDARD_CAKE' | 'CUSTOM_CAKE' | 'STANDARD_BAKERY' | 'COMBO' | 'GIFT_BOX';

// Fashion-specific variant
export interface IFashionVariant {
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  reservedStock: number;
  price?: number; // override base price if needed
  images?: string[];
}

// Bakery-specific variant (Cakes & Bakes)
export interface IBakeryVariant {
  sku: string;
  weight?: string; // e.g. "0.5kg", "1kg", "6-pack"
  size?: string; // "Small", "Medium", "Large", "0.5 kg", "1 kg"
  flavour?: string;
  isEggless?: boolean;
  unit: string;
  stock: number;
  reservedStock: number;
  price: number;
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  topLevelCategory: TopLevelCategory;
  categoryId: mongoose.Types.ObjectId;
  subcategorySlug: string;
  brand?: string;
  images: string[];
  thumbnail: string;
  tags: string[];
  basePrice: number;
  salePrice: number;
  discount: number; // percentage
  tax: { rate: number; inclusive: boolean };
  status: ProductStatus;
  totalStock: number; // denormalized sum
  ratings: { average: number; count: number };
  specifications: Record<string, string>;
  seo: { title?: string; description?: string; keywords?: string[] };

  // Fashion-specific
  fashionVariants?: IFashionVariant[];
  material?: string;
  fit?: string;
  gender?: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
  style?: string;

  // Cakes & Bakes fields
  bakeryVariants?: IBakeryVariant[];
  productType?: ProductType;
  flavour?: string;
  size?: string;
  occasion?: string[]; // ['BIRTHDAY', 'ANNIVERSARY', 'WEDDING', 'PARTY']
  isEggless?: boolean;
  isCustomizable?: boolean;
  preparationHours?: number; // lead time in hours (e.g. 24)
  shelfLifeDays?: number;
  ingredients?: string[];
  allergens?: string[];
  countryOfOrigin?: string;

  isReturnable: boolean;
  returnWindow?: number; // days
  isCancellable: boolean;

  moderationNote?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fashionVariantSchema = new Schema<IFashionVariant>({
  sku: { type: String, required: true, uppercase: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorHex: { type: String },
  stock: { type: Number, required: true, min: 0, default: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  price: { type: Number, min: 0 },
  images: [{ type: String }],
});

const bakeryVariantSchema = new Schema<IBakeryVariant>({
  sku: { type: String, required: true, uppercase: true },
  weight: { type: String },
  size: { type: String },
  flavour: { type: String },
  isEggless: { type: Boolean, default: false },
  unit: { type: String, required: true, default: 'piece' },
  stock: { type: Number, required: true, min: 0, default: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  price: { type: Number, required: true, min: 0 },
});

const productSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    topLevelCategory: {
      type: String,
      enum: {
        values: ['FASHION', 'CAKES_AND_BAKES'],
        message: 'Top-level category must be FASHION or CAKES_AND_BAKES',
      },
      required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategorySlug: { type: String, required: true },
    brand: { type: String, trim: true },
    images: [{ type: String }],
    thumbnail: { type: String, required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    basePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    tax: {
      rate: { type: Number, default: 0, min: 0 },
      inclusive: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE'],
      default: 'DRAFT',
    },
    totalStock: { type: Number, default: 0, min: 0 },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    specifications: { type: Map, of: String, default: {} },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },

    // Fashion fields
    fashionVariants: [fashionVariantSchema],
    material: { type: String },
    fit: { type: String },
    gender: { type: String, enum: ['MEN', 'WOMEN', 'KIDS', 'UNISEX'] },
    style: { type: String },

    // Cakes & Bakes fields
    bakeryVariants: [bakeryVariantSchema],
    productType: {
      type: String,
      enum: ['STANDARD_CAKE', 'CUSTOM_CAKE', 'STANDARD_BAKERY', 'COMBO', 'GIFT_BOX'],
      default: 'STANDARD_CAKE',
    },
    flavour: { type: String },
    size: { type: String },
    occasion: [{ type: String }],
    isEggless: { type: Boolean, default: false },
    isCustomizable: { type: Boolean, default: false },
    preparationHours: { type: Number, default: 24 },
    shelfLifeDays: { type: Number, default: 3 },
    ingredients: [{ type: String }],
    allergens: [{ type: String }],
    countryOfOrigin: { type: String, default: 'India' },

    isReturnable: { type: Boolean, default: false }, // Food items non-returnable by default
    returnWindow: { type: Number, default: 0 },
    isCancellable: { type: Boolean, default: true },

    moderationNote: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Text search index
productSchema.index({
  title: 'text',
  brand: 'text',
  tags: 'text',
  description: 'text',
  shortDescription: 'text',
});

productSchema.index({ topLevelCategory: 1, status: 1 });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ createdAt: -1 });

// Recalculate discount and totalStock before save
productSchema.pre('save', function (next) {
  if (this.basePrice > 0 && this.salePrice < this.basePrice) {
    this.discount = Math.round(((this.basePrice - this.salePrice) / this.basePrice) * 100);
  }

  if (this.topLevelCategory === 'FASHION' && this.fashionVariants?.length) {
    this.totalStock = this.fashionVariants.reduce(
      (sum, v) => sum + Math.max(0, v.stock - v.reservedStock),
      0
    );
  } else if (this.topLevelCategory === 'CAKES_AND_BAKES' && this.bakeryVariants?.length) {
    this.totalStock = this.bakeryVariants.reduce(
      (sum, v) => sum + Math.max(0, v.stock - v.reservedStock),
      0
    );
  }

  next();
});

productSchema.plugin(mongoosePaginate);

export const Product = mongoose.model<IProduct>('Product', productSchema);
