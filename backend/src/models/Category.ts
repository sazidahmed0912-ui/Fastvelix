import mongoose, { Document, Schema } from 'mongoose';

export type TopLevelCategory = 'FASHION' | 'CAKES_AND_BAKES';

export interface ISubcategory {
  _id?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  topLevelCategory: TopLevelCategory;
  description?: string;
  image?: string;
  icon?: string;
  subcategories: ISubcategory[];
  isActive: boolean;
  sortOrder: number;
  seo?: {
    title?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<ISubcategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  image: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    // CORE GOVERNANCE: only FASHION or CAKES_AND_BAKES allowed at top level
    topLevelCategory: {
      type: String,
      enum: {
        values: ['FASHION', 'CAKES_AND_BAKES'],
        message: 'Top-level category must be either FASHION or CAKES_AND_BAKES',
      },
      required: [true, 'Top-level category is required'],
    },
    description: { type: String },
    image: { type: String },
    icon: { type: String },
    subcategories: [subcategorySchema],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String },
      description: { type: String },
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ topLevelCategory: 1, isActive: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
