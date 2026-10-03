import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload, uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../utils/AppError';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/products ─── Public product listing with filters + pagination
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      topLevelCategory,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      gender,
      size,
      color,
      material,
      fit,
      packSize,
      dietaryType,
      organic,
      rating,
      discount,
      availability,
      flavour,
      isEggless,
      productType,
      sort = 'relevance',
      page = '1',
      limit = '24',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { status: 'ACTIVE' };

    if (topLevelCategory) filter.topLevelCategory = topLevelCategory.toUpperCase();
    if (category) filter.categoryId = new mongoose.Types.ObjectId(category);
    if (subcategory) filter.subcategorySlug = subcategory;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) (filter.salePrice as Record<string, number>)['$gte'] = Number(minPrice);
      if (maxPrice) (filter.salePrice as Record<string, number>)['$lte'] = Number(maxPrice);
    }
    if (discount) filter.discount = { $gte: Number(discount) };
    if (rating) filter['ratings.average'] = { $gte: Number(rating) };
    if (availability === 'true') filter.totalStock = { $gt: 0 };
    if (organic === 'true') filter.organic = true;

    // Fashion-specific filters
    if (gender) filter.gender = gender.toUpperCase();
    if (material) filter.material = { $regex: material, $options: 'i' };
    if (fit) filter.fit = { $regex: fit, $options: 'i' };
    if (size) filter['fashionVariants.size'] = size;
    if (color) filter['fashionVariants.color'] = { $regex: color, $options: 'i' };

    // Cakes & Bakes-specific filters
    if (flavour) filter.flavour = { $regex: flavour, $options: 'i' };
    if (isEggless === 'true') filter.isEggless = true;
    if (productType) filter.productType = productType;

    // Sort
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case 'price_asc': sortObj = { salePrice: 1 }; break;
      case 'price_desc': sortObj = { salePrice: -1 }; break;
      case 'rating': sortObj = { 'ratings.average': -1 }; break;
      case 'discount': sortObj = { discount: -1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'popular': sortObj = { 'ratings.count': -1 }; break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('title slug thumbnail brand salePrice basePrice discount ratings totalStock topLevelCategory gender flavour size isEggless productType fashionVariants.size bakeryVariants.size createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/search ─── Full-text search
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q, topLevelCategory, page = '1', limit = '24', sort } = req.query as Record<string, string>;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, products: [], pagination: { total: 0, page: 1, limit: 24, pages: 0 } });
    }

    const filter: Record<string, unknown> = {
      $text: { $search: q.trim() },
      status: 'ACTIVE',
    };
    if (topLevelCategory) filter.topLevelCategory = topLevelCategory.toUpperCase();

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, parseInt(limit));

    let sortObj: any = { score: { $meta: 'textScore' } };
    if (sort === 'price_asc') sortObj = { salePrice: 1 };
    if (sort === 'price_desc') sortObj = { salePrice: -1 };
    if (sort === 'rating') sortObj = { 'ratings.average': -1 };

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .select('title slug thumbnail brand salePrice basePrice discount ratings totalStock topLevelCategory')
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      query: q,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/products/:slug ─── Product detail (public)
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: 'ACTIVE',
    })
      .populate('categoryId', 'name slug topLevelCategory')
      .populate('sellerId', 'name')
      .lean();

    if (!product) {
      return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/products ─── Seller creates product
const fashionVariantSchema = z.object({
  sku: z.string().min(3).max(50),
  size: z.string().min(1),
  color: z.string().min(1),
  colorHex: z.string().optional(),
  stock: z.number().int().min(0),
  price: z.number().min(0).optional(),
});

const bakeryVariantSchema = z.object({
  sku: z.string().min(3).max(50),
  weight: z.string().optional(),
  size: z.string().optional(),
  flavour: z.string().optional(),
  isEggless: z.boolean().default(false),
  unit: z.string().default('piece'),
  stock: z.number().int().min(0),
  price: z.number().min(0),
});

const createProductSchema = z.discriminatedUnion('topLevelCategory', [
  z.object({
    topLevelCategory: z.literal('FASHION'),
    title: z.string().min(5).max(200),
    description: z.string().min(20),
    shortDescription: z.string().max(500).optional(),
    categoryId: z.string(),
    subcategorySlug: z.string(),
    brand: z.string().optional(),
    tags: z.array(z.string()).max(10).optional(),
    basePrice: z.number().min(1),
    salePrice: z.number().min(1),
    fashionVariants: z.array(fashionVariantSchema).min(1),
    material: z.string().optional(),
    fit: z.string().optional(),
    gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'UNISEX']).optional(),
    style: z.string().optional(),
    isReturnable: z.boolean().default(true),
    returnWindow: z.number().int().min(0).max(30).default(7),
  }),
  z.object({
    topLevelCategory: z.literal('CAKES_AND_BAKES'),
    title: z.string().min(5).max(200),
    description: z.string().min(20),
    shortDescription: z.string().max(500).optional(),
    categoryId: z.string(),
    subcategorySlug: z.string(),
    brand: z.string().optional(),
    tags: z.array(z.string()).max(10).optional(),
    basePrice: z.number().min(1),
    salePrice: z.number().min(1),
    bakeryVariants: z.array(bakeryVariantSchema).optional(),
    productType: z.enum(['STANDARD_CAKE', 'CUSTOM_CAKE', 'STANDARD_BAKERY', 'COMBO', 'GIFT_BOX']).default('STANDARD_CAKE'),
    flavour: z.string().optional(),
    size: z.string().optional(),
    isEggless: z.boolean().default(false),
    isCustomizable: z.boolean().default(false),
    preparationHours: z.number().default(24),
    ingredients: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    countryOfOrigin: z.string().optional(),
    isReturnable: z.boolean().default(false),
    returnWindow: z.number().int().min(0).max(7).default(0),
  }),
]);

router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'),
  validate(createProductSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const data = req.body;

      // Verify seller is approved
      if (req.user!.role === 'SELLER') {
        const { Seller } = await import('../models/Seller');
        const seller = await Seller.findOne({ userId: req.user!._id, status: 'APPROVED' });
        if (!seller) {
          return next(new AppError('Your seller account is not approved.', 403, 'SELLER_NOT_APPROVED'));
        }
        // Check category permission
        if (!seller.categoryPermissions.includes(data.topLevelCategory)) {
          return next(new AppError(`You don't have permission to list ${data.topLevelCategory} products.`, 403, 'CATEGORY_PERMISSION_DENIED'));
        }
      }

      // Verify category exists
      const category = await Category.findById(data.categoryId);
      if (!category || category.topLevelCategory !== data.topLevelCategory) {
        return next(new AppError('Invalid category for this product type.', 400, 'INVALID_CATEGORY'));
      }

      // Generate unique slug
      let slug = slugify(data.title, { lower: true, strict: true });
      const slugExists = await Product.findOne({ slug });
      if (slugExists) slug = `${slug}-${uuidv4().slice(0, 8)}`;

      const product = await Product.create({
        ...data,
        slug,
        sellerId: req.user!._id,
        thumbnail: '', // set after image upload
        images: [],
        status: 'DRAFT',
      });

      res.status(201).json({ success: true, product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/products/:id/images ─── Upload product images
router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'),
  upload.array('images', 8),
  async (req: AuthRequest, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));

      // Ownership check
      if (req.user!.role === 'SELLER' && product.sellerId.toString() !== req.user!._id) {
        return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
      }

      const files = req.files as Express.Multer.File[];
      if (!files?.length) return next(new AppError('No images provided.', 400, 'NO_FILES'));

      const urls = await Promise.all(
        files.map((f) => uploadToCloudinary(f.buffer, `products/${product._id}`))
      );

      const imageUrls = urls.map((u) => u.url);
      product.images.push(...imageUrls);
      if (!product.thumbnail && imageUrls.length > 0) {
        product.thumbnail = imageUrls[0];
      }
      await product.save();

      res.json({ success: true, images: imageUrls, thumbnail: product.thumbnail });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/products/:id ─── Update product (seller owns it)
router.put(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));

      if (req.user!.role === 'SELLER' && product.sellerId.toString() !== req.user!._id) {
        return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
      }

      // Sellers can't change top-level category after creation
      if (req.body.topLevelCategory && req.body.topLevelCategory !== product.topLevelCategory) {
        return next(new AppError('Cannot change product category after creation.', 400, 'IMMUTABLE_CATEGORY'));
      }

      const allowedFields = [
        'title', 'description', 'shortDescription', 'brand', 'tags',
        'basePrice', 'salePrice', 'fashionVariants', 'bakeryVariants',
        'material', 'fit', 'gender', 'style', 'dietaryType', 'organic',
        'bestBefore', 'countryOfOrigin', 'specifications', 'seo',
        'isReturnable', 'returnWindow', 'isCancellable',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          (product as any)[field] = req.body[field];
        }
      });

      // When seller submits for review
      if (req.body.submit && product.status === 'DRAFT') {
        product.status = 'PENDING_REVIEW';
      }

      await product.save();
      res.json({ success: true, product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/products/:id ─── Deactivate (not hard delete)
router.delete(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return next(new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND'));

      if (req.user!.role === 'SELLER' && product.sellerId.toString() !== req.user!._id) {
        return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
      }

      product.status = 'INACTIVE';
      await product.save();

      res.json({ success: true, message: 'Product deactivated.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
