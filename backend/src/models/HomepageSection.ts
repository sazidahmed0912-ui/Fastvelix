import mongoose, { Document, Schema } from 'mongoose';

export interface IHomepageSection extends Document {
  sectionKey: string; // unique identifier e.g. 'fashion_hero', 'bakery_hero'
  title: string;
  topLevelCategory?: 'FASHION' | 'CAKES_AND_BAKES' | 'ALL';
  type: 'HERO' | 'BANNER' | 'PRODUCT_GRID' | 'CATEGORY_GRID' | 'OFFER_STRIP' | 'TEXT';
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
  content: {
    heading?: string;
    subheading?: string;
    ctaText?: string;
    ctaUrl?: string;
    imageDesktop?: string;
    imageMobile?: string;
    backgroundColor?: string;
    textColor?: string;
    productIds?: mongoose.Types.ObjectId[];
    categoryIds?: mongoose.Types.ObjectId[];
    badgeText?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homepageSectionSchema = new Schema<IHomepageSection>(
  {
    sectionKey: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    topLevelCategory: { type: String, enum: ['FASHION', 'CAKES_AND_BAKES', 'ALL'], default: 'ALL' },
    type: {
      type: String,
      enum: ['HERO', 'BANNER', 'PRODUCT_GRID', 'CATEGORY_GRID', 'OFFER_STRIP', 'TEXT'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    content: {
      heading: { type: String },
      subheading: { type: String },
      ctaText: { type: String },
      ctaUrl: { type: String },
      imageDesktop: { type: String },
      imageMobile: { type: String },
      backgroundColor: { type: String },
      textColor: { type: String },
      productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      badgeText: { type: String },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

homepageSectionSchema.index({ topLevelCategory: 1, isActive: 1, sortOrder: 1 });

export const HomepageSection = mongoose.model<IHomepageSection>(
  'HomepageSection',
  homepageSectionSchema
);
