import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Seller } from '../models/Seller';
import { Coupon } from '../models/Coupon';
import { HomepageSection } from '../models/HomepageSection';
import { CakeSize, CakeFlavour, CakeStyle, CakeTopper, CakeDecoration } from '../models/CakeOption';
import { DeliverySlot } from '../models/DeliverySlot';

// ─── Safety check: never run in production ──────────────────────────────────
if (config.env === 'production') {
  console.error('❌ Seed script must NOT run in production!');
  process.exit(1);
}

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting database seed for FastVelix Fashion & Cakes & Bakes...');

  // ─── Clear existing seed data ────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Seller.deleteMany({}),
    Coupon.deleteMany({}),
    HomepageSection.deleteMany({}),
    CakeSize.deleteMany({}),
    CakeFlavour.deleteMany({}),
    CakeStyle.deleteMany({}),
    CakeTopper.deleteMany({}),
    CakeDecoration.deleteMany({}),
    DeliverySlot.deleteMany({}),
  ]);
  console.log('✅ Cleared existing data');

  // ─── Create Users ────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'FastVelix Admin',
    email: config.admin.email || 'admin@fastvelix.com',
    password: config.admin.password || 'Admin@123',
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    isActive: true,
  });

  const sellerUser = await User.create({
    name: 'Velvet Bakes & Fashion',
    email: 'seller@fastvelix.com',
    password: 'Seller@123',
    role: 'SELLER',
    isEmailVerified: true,
    isActive: true,
  });

  const customerUser = await User.create({
    name: 'Demo Customer',
    email: 'customer@fastvelix.com',
    password: 'Customer@123',
    role: 'CUSTOMER',
    isEmailVerified: true,
    isActive: true,
  });

  console.log('✅ Users created');

  // ─── Create Seller Profile ───────────────────────────────────────────────
  const seller = await Seller.create({
    userId: sellerUser._id,
    businessName: 'Velvet Artisanal Bakery',
    businessType: 'INDIVIDUAL',
    email: 'seller@fastvelix.com',
    phone: '9876543210',
    pickupAddress: {
      addressLine1: '123 Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
    },
    categoryPermissions: ['FASHION', 'CAKES_AND_BAKES'],
    status: 'APPROVED',
    statusHistory: [{ status: 'APPROVED', changedAt: new Date() }],
  });

  // ─── Create Categories ───────────────────────────────────────────────────
  const fashionCategory = await Category.create({
    name: 'Fashion',
    slug: 'fashion',
    topLevelCategory: 'FASHION',
    description: 'Clothing, footwear, and accessories',
    isActive: true,
    sortOrder: 1,
    subcategories: [
      { name: 'Men', slug: 'men', isActive: true, sortOrder: 1 },
      { name: 'Women', slug: 'women', isActive: true, sortOrder: 2 },
      { name: 'Kids', slug: 'kids', isActive: true, sortOrder: 3 },
      { name: 'Footwear', slug: 'footwear', isActive: true, sortOrder: 4 },
      { name: 'Accessories', slug: 'accessories', isActive: true, sortOrder: 5 },
    ],
  });

  const cakesCategory = await Category.create({
    name: 'Cakes & Bakes',
    slug: 'cakes-and-bakes',
    topLevelCategory: 'CAKES_AND_BAKES',
    description: 'Custom celebration cakes, fresh bakes and dessert hampers',
    isActive: true,
    sortOrder: 2,
    subcategories: [
      { name: 'Cakes', slug: 'cakes', isActive: true, sortOrder: 1 },
      { name: 'Cupcakes', slug: 'cupcakes', isActive: true, sortOrder: 2 },
      { name: 'Pastries', slug: 'pastries', isActive: true, sortOrder: 3 },
      { name: 'Desserts', slug: 'desserts', isActive: true, sortOrder: 4 },
      { name: 'Bakery', slug: 'bakery', isActive: true, sortOrder: 5 },
      { name: 'Gifts & Combos', slug: 'gifts', isActive: true, sortOrder: 6 },
    ],
  });

  console.log('✅ Categories created');

  // ─── Create Custom Cake Options ──────────────────────────────────────────
  await CakeSize.insertMany([
    { name: '0.5 kg', weightKg: 0.5, servings: '4-6 People', extraPrice: 0, sortOrder: 1 },
    { name: '1 kg', weightKg: 1.0, servings: '8-10 People', extraPrice: 400, sortOrder: 2 },
    { name: '1.5 kg', weightKg: 1.5, servings: '12-14 People', extraPrice: 750, sortOrder: 3 },
    { name: '2 kg', weightKg: 2.0, servings: '16-18 People', extraPrice: 1100, sortOrder: 4 },
    { name: '3 kg', weightKg: 3.0, servings: '24-28 People', extraPrice: 1900, sortOrder: 5 },
  ]);

  await CakeFlavour.insertMany([
    { name: 'Belgian Chocolate Truffle', description: 'Rich dark chocolate ganache with moist sponge', extraPrice: 150, sortOrder: 1 },
    { name: 'Red Velvet Cheese Cream', description: 'Classic red velvet with cream cheese frosting', extraPrice: 150, sortOrder: 2 },
    { name: 'Madagascar Vanilla Bean', description: 'Real vanilla bean whipped cream sponge', extraPrice: 0, sortOrder: 3 },
    { name: 'Black Forest Royale', description: 'Dark cherries, chocolate flakes and fresh whipped cream', extraPrice: 100, sortOrder: 4 },
    { name: 'Butterscotch Crunch', description: 'Caramel crunch pralines with praline cream', extraPrice: 50, sortOrder: 5 },
    { name: 'Fresh Pineapple Passion', description: 'Juicy pineapple chunks with light chiffon sponge', extraPrice: 0, sortOrder: 6 },
  ]);

  await CakeStyle.insertMany([
    { name: 'Minimalist Pastel', category: 'BIRTHDAY', extraPrice: 0, sortOrder: 1 },
    { name: 'Floral Dream Garden', category: 'ANNIVERSARY', extraPrice: 250, sortOrder: 2 },
    { name: 'Royal Gold Leaf Luxury', category: 'LUXURY', extraPrice: 400, sortOrder: 3 },
    { name: 'Comic Cartoon 2D', category: 'KIDS', extraPrice: 300, sortOrder: 4 },
    { name: 'Elegant Tiered Celebration', category: 'WEDDING', extraPrice: 600, sortOrder: 5 },
  ]);

  await CakeTopper.insertMany([
    { name: 'Happy Birthday (Gold Acrylic)', extraPrice: 120, sortOrder: 1 },
    { name: 'Happy Anniversary (Wooden)', extraPrice: 150, sortOrder: 2 },
    { name: 'Custom Name Topper', extraPrice: 200, sortOrder: 3 },
    { name: 'No Topper', extraPrice: 0, sortOrder: 4 },
  ]);

  await CakeDecoration.insertMany([
    { name: 'Edible 24k Gold Foil', extraPrice: 200, sortOrder: 1 },
    { name: 'Artisanal French Macarons (Set of 3)', extraPrice: 250, sortOrder: 2 },
    { name: 'Sparkler Candles Set', extraPrice: 80, sortOrder: 3 },
  ]);

  await DeliverySlot.insertMany([
    { slotTime: '10:00 AM – 12:00 PM', cutoffHours: 4, maxOrdersPerSlot: 10, sortOrder: 1 },
    { slotTime: '12:00 PM – 02:00 PM', cutoffHours: 4, maxOrdersPerSlot: 12, sortOrder: 2 },
    { slotTime: '02:00 PM – 04:00 PM', cutoffHours: 4, maxOrdersPerSlot: 12, sortOrder: 3 },
    { slotTime: '04:00 PM – 06:00 PM', cutoffHours: 4, maxOrdersPerSlot: 15, sortOrder: 4 },
    { slotTime: '06:00 PM – 08:00 PM', cutoffHours: 4, maxOrdersPerSlot: 15, sortOrder: 5 },
  ]);

  console.log('✅ Custom Cake Options & Delivery Slots created');

  // ─── Create Fashion Products ─────────────────────────────────────────────
  const fashionProducts = [
    {
      sellerId: sellerUser._id,
      title: 'Classic White Oxford Shirt',
      slug: 'classic-white-oxford-shirt',
      description: 'A timeless white Oxford shirt crafted from 100% Egyptian cotton.',
      shortDescription: 'Premium Egyptian cotton Oxford shirt',
      topLevelCategory: 'FASHION',
      categoryId: fashionCategory._id,
      subcategorySlug: 'men',
      brand: 'TrendHub',
      thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
      images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'],
      tags: ['shirt', 'oxford', 'formal', 'white', 'cotton'],
      basePrice: 2499,
      salePrice: 1999,
      fashionVariants: [
        { sku: 'COWS-S-WHT', size: 'S', color: 'White', colorHex: '#FFFFFF', stock: 25, reservedStock: 0 },
        { sku: 'COWS-M-WHT', size: 'M', color: 'White', colorHex: '#FFFFFF', stock: 40, reservedStock: 0 },
        { sku: 'COWS-L-WHT', size: 'L', color: 'White', colorHex: '#FFFFFF', stock: 35, reservedStock: 0 },
      ],
      material: 'Egyptian Cotton',
      fit: 'Regular',
      gender: 'MEN',
      style: 'Formal',
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
    {
      sellerId: sellerUser._id,
      title: 'Floral Midi Dress',
      slug: 'floral-midi-dress',
      description: 'A stunning floral midi dress perfect for summer outings.',
      shortDescription: 'Elegant floral midi dress for summer',
      topLevelCategory: 'FASHION',
      categoryId: fashionCategory._id,
      subcategorySlug: 'women',
      brand: 'BloomWear',
      thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
      images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
      tags: ['dress', 'floral', 'midi', 'summer', 'women'],
      basePrice: 3299,
      salePrice: 2499,
      fashionVariants: [
        { sku: 'FMD-S-FLRL', size: 'S', color: 'Floral', colorHex: '#FF6B9D', stock: 30, reservedStock: 0 },
        { sku: 'FMD-M-FLRL', size: 'M', color: 'Floral', colorHex: '#FF6B9D', stock: 25, reservedStock: 0 },
      ],
      material: 'Rayon',
      fit: 'A-Line',
      gender: 'WOMEN',
      style: 'Casual',
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  ];

  // ─── Create Cakes & Bakes Products ────────────────────────────────────────
  const cakesAndBakesProducts = [
    {
      sellerId: sellerUser._id,
      title: 'Signature Red Velvet Cream Cheese Cake',
      slug: 'signature-red-velvet-cream-cheese-cake',
      description: 'Layers of moist red velvet cocoa sponge paired with authentic Madagascar vanilla cream cheese frosting. Freshly baked per order.',
      shortDescription: 'Rich red velvet sponge with rich cream cheese frosting',
      topLevelCategory: 'CAKES_AND_BAKES',
      categoryId: cakesCategory._id,
      subcategorySlug: 'cakes',
      brand: 'Velvet Bakes',
      thumbnail: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400',
      images: ['https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800'],
      tags: ['red-velvet', 'cake', 'birthday', 'anniversary', 'cream-cheese'],
      basePrice: 999,
      salePrice: 799,
      productType: 'STANDARD_CAKE',
      flavour: 'Red Velvet Cheese Cream',
      size: '0.5 kg',
      isEggless: true,
      isCustomizable: true,
      preparationHours: 24,
      shelfLifeDays: 3,
      ingredients: ['Flour', 'Cocoa Powder', 'Cream Cheese', 'Sugar', 'Butter', 'Vanilla Extract'],
      allergens: ['Dairy', 'Gluten'],
      bakeryVariants: [
        { sku: 'RVCC-05KG', size: '0.5 kg', weight: '500g', flavour: 'Red Velvet', isEggless: true, unit: 'piece', stock: 50, reservedStock: 0, price: 799 },
        { sku: 'RVCC-1KG', size: '1 kg', weight: '1000g', flavour: 'Red Velvet', isEggless: true, unit: 'piece', stock: 30, reservedStock: 0, price: 1199 },
      ],
      isReturnable: false,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
    {
      sellerId: sellerUser._id,
      title: 'Belgian Dark Chocolate Truffle Cake',
      slug: 'belgian-dark-chocolate-truffle-cake',
      description: 'Decadent 55% dark Belgian chocolate ganache layered with moist chocolate sponge and glazed with mirror chocolate drip.',
      shortDescription: '55% Belgian chocolate ganache cake',
      topLevelCategory: 'CAKES_AND_BAKES',
      categoryId: cakesCategory._id,
      subcategorySlug: 'cakes',
      brand: 'Velvet Bakes',
      thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
      images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'],
      tags: ['chocolate', 'truffle', 'belgian', 'cake', 'birthday'],
      basePrice: 1199,
      salePrice: 899,
      productType: 'STANDARD_CAKE',
      flavour: 'Belgian Chocolate Truffle',
      size: '0.5 kg',
      isEggless: false,
      isCustomizable: true,
      preparationHours: 24,
      shelfLifeDays: 4,
      ingredients: ['Belgian Dark Chocolate', 'Heavy Cream', 'Cocoa', 'Flour', 'Eggs', 'Butter'],
      allergens: ['Dairy', 'Gluten', 'Eggs'],
      bakeryVariants: [
        { sku: 'BDCT-05KG', size: '0.5 kg', weight: '500g', flavour: 'Chocolate', isEggless: false, unit: 'piece', stock: 40, reservedStock: 0, price: 899 },
        { sku: 'BDCT-1KG', size: '1 kg', weight: '1000g', flavour: 'Chocolate', isEggless: false, unit: 'piece', stock: 25, reservedStock: 0, price: 1399 },
      ],
      isReturnable: false,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
    {
      sellerId: sellerUser._id,
      title: 'Custom Celebration Designer Cake',
      slug: 'custom-celebration-designer-cake',
      description: 'Fully customizable celebration cake for Birthdays, Weddings and Special Moments. Choose your size, flavour, theme, photo upload, and toppers.',
      shortDescription: 'Design your own custom cake for any occasion',
      topLevelCategory: 'CAKES_AND_BAKES',
      categoryId: cakesCategory._id,
      subcategorySlug: 'cakes',
      brand: 'Velvet Bakes',
      thumbnail: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=400',
      images: ['https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800'],
      tags: ['custom', 'designer', 'photo-cake', 'birthday', 'wedding'],
      basePrice: 999,
      salePrice: 799,
      productType: 'CUSTOM_CAKE',
      isCustomizable: true,
      preparationHours: 24,
      shelfLifeDays: 3,
      isReturnable: false,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
    {
      sellerId: sellerUser._id,
      title: 'French Macarons Luxury Box (Set of 12)',
      slug: 'french-macarons-luxury-box-12',
      description: 'Assorted handcrafted French macarons including Salted Caramel, Pistachio, Raspberry, Dark Chocolate, Vanilla, and Lemon.',
      shortDescription: '12 handcrafted assorted French macarons in gift box',
      topLevelCategory: 'CAKES_AND_BAKES',
      categoryId: cakesCategory._id,
      subcategorySlug: 'gifts',
      brand: 'Velvet Bakes',
      thumbnail: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400',
      images: ['https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800'],
      tags: ['macarons', 'french', 'dessert', 'gift-box', 'pastry'],
      basePrice: 999,
      salePrice: 799,
      productType: 'GIFT_BOX',
      isEggless: false,
      preparationHours: 12,
      shelfLifeDays: 7,
      isReturnable: false,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
    {
      sellerId: sellerUser._id,
      title: 'New York Blueberry Cheesecake Slice Set',
      slug: 'new-york-blueberry-cheesecake-set',
      description: 'Authentic dense New York style baked cheesecake topped with fresh wild blueberry compote and graham cracker crust.',
      shortDescription: 'Baked New York cheesecake with blueberry compote',
      topLevelCategory: 'CAKES_AND_BAKES',
      categoryId: cakesCategory._id,
      subcategorySlug: 'desserts',
      brand: 'Velvet Bakes',
      thumbnail: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
      images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800'],
      tags: ['cheesecake', 'blueberry', 'new-york', 'dessert', 'pastry'],
      basePrice: 599,
      salePrice: 449,
      productType: 'STANDARD_BAKERY',
      isEggless: false,
      preparationHours: 12,
      shelfLifeDays: 5,
      isReturnable: false,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  ];

  for (const p of [...fashionProducts, ...cakesAndBakesProducts]) {
    await Product.create(p);
  }
  console.log('✅ Products created');

  // ─── Create Coupons ──────────────────────────────────────────────────────
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Coupon.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off on your first order',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 299,
      maxDiscount: 200,
      startDate: now,
      endDate: futureDate,
      perUserLimit: 1,
      isActive: true,
      createdBy: adminUser._id,
    },
    {
      code: 'FASHION20',
      description: '20% off on Fashion products',
      type: 'PERCENTAGE',
      value: 20,
      minOrderValue: 999,
      maxDiscount: 500,
      startDate: now,
      endDate: futureDate,
      applicableCategories: ['FASHION'],
      perUserLimit: 2,
      isActive: true,
      createdBy: adminUser._id,
    },
    {
      code: 'BAKES150',
      description: '₹150 off on custom cakes & bakes orders above ₹799',
      type: 'FIXED',
      value: 150,
      minOrderValue: 799,
      startDate: now,
      endDate: futureDate,
      applicableCategories: ['CAKES_AND_BAKES'],
      perUserLimit: 3,
      isActive: true,
      createdBy: adminUser._id,
    },
  ]);

  console.log('✅ Coupons created');

  // ─── Create Homepage Sections ────────────────────────────────────────────
  await HomepageSection.insertMany([
    {
      sectionKey: 'fashion_hero',
      title: 'Fashion Hero Banner',
      topLevelCategory: 'FASHION',
      type: 'HERO',
      isActive: true,
      sortOrder: 1,
      content: {
        heading: 'Dress Your Best',
        subheading: 'Discover the latest trends in fashion — curated for you.',
        ctaText: 'Shop Fashion',
        ctaUrl: '/fashion',
        imageDesktop: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400',
        imageMobile: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      },
      createdBy: adminUser._id,
    },
    {
      sectionKey: 'cakes_hero',
      title: 'Cakes & Bakes Hero Banner',
      topLevelCategory: 'CAKES_AND_BAKES',
      type: 'HERO',
      isActive: true,
      sortOrder: 1,
      content: {
        heading: 'Made for Moments Worth Celebrating.',
        subheading: 'Custom cakes, fresh bakes and beautiful treats crafted for your special moments.',
        ctaText: 'Design Your Cake',
        ctaUrl: '/cakes-and-bakes/custom-cake',
        imageDesktop: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400',
        imageMobile: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
      },
      createdBy: adminUser._id,
    },
  ]);

  console.log('✅ Homepage sections created');

  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   🌱 FastVelix Cakes & Bakes Seed Complete!       ║
  ╚═══════════════════════════════════════════════════╝

  Test Accounts:
  ├── Admin:    admin@fastvelix.com / Admin@123
  ├── Seller:   seller@fastvelix.com / Seller@123
  └── Customer: customer@fastvelix.com / Customer@123

  Coupons: WELCOME10, FASHION20, BAKES150
  Verticals: FASHION | CAKES_AND_BAKES
  `);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
