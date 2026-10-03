import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Seller, SellerApplication } from '../models/Seller';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Refund } from '../models/Refund';
import { Review } from '../models/Review';
import { Category } from '../models/Category';
import { Coupon } from '../models/Coupon';
import { HomepageSection } from '../models/HomepageSection';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { upload, uploadToCloudinary } from '../middleware/upload';
import { AppError } from '../utils/AppError';
import { sendEmail, emailTemplates } from '../config/mailer';
import { razorpay } from '../config/razorpay';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// ─── DASHBOARD ───
router.get('/dashboard', async (req, res, next) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (timeframe === 'today') startDate = new Date(new Date().setHours(0, 0, 0, 0));
    else if (timeframe === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (timeframe === '90d') startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    else if (timeframe === '12m') startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenueResult,
      totalCustomers,
      totalSellers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      pendingReviews,
      pendingSellerApplications,
      pendingRefunds,
      recentOrders,
      recentUsers,
      recentSellerApplications,
      recentActivity,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'PROCESSING' }),
      Order.countDocuments({ status: { $in: ['SHIPPED', 'OUT_FOR_DELIVERY'] } }),
      Order.countDocuments({ status: 'DELIVERED' }),
      Order.countDocuments({ status: 'CANCELLED' }),
      Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      User.countDocuments({ role: 'CUSTOMER' }),
      Seller.countDocuments({ status: 'APPROVED' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'ACTIVE' }),
      Product.countDocuments({ stockQuantity: { $lte: 5 } }),
      Review.countDocuments({ status: 'PENDING' }),
      SellerApplication.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } }),
      Refund.countDocuments({ status: { $in: ['REQUESTED', 'APPROVED'] } }),
      Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: 'CUSTOMER' }).select('name email createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      SellerApplication.find({ status: 'SUBMITTED' }).populate('userId', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find().populate('actor', 'name email').sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Revenue by category (time-filtered)
    const revenueByCategory = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.topLevelCategory', revenue: { $sum: '$items.totalPrice' }, count: { $sum: 1 } } },
    ]);

    // Orders trend (time-filtered)
    const ordersTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        totalCustomers,
        totalSellers,
        totalProducts,
        activeProducts,
        lowStockProducts,
        pendingReviews,
        pendingSellerApplications,
        pendingRefunds,
      },
      recentOrders,
      recentUsers,
      recentSellerApplications,
      recentActivity,
      revenueByCategory,
      ordersTrend,
    });
  } catch (err) {
    next(err);
  }
});

// ─── SELLER APPLICATIONS ───
router.get('/seller-applications', async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const apps = await SellerApplication.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, applications: apps });
  } catch (err) {
    next(err);
  }
});

router.put('/seller-applications/:id/review', async (req: AuthRequest, res, next) => {
  try {
    const { status, note, categoryPermissions } = req.body;
    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return next(new AppError('Invalid status.', 400, 'INVALID_STATUS'));
    }

    const application = await SellerApplication.findById(req.params.id).populate('userId');
    if (!application) return next(new AppError('Application not found.', 404, 'NOT_FOUND'));

    const before = { status: application.status };
    application.status = status;
    application.reviewNote = note;
    application.reviewedBy = new mongoose.Types.ObjectId(req.user!._id);
    application.reviewedAt = new Date();
    await application.save();

    if (status === 'APPROVED') {
      // Create seller profile
      const existingSeller = await Seller.findOne({ userId: application.userId });
      if (!existingSeller) {
        await Seller.create({
          userId: application.userId,
          businessName: application.businessName,
          businessType: application.businessType as 'INDIVIDUAL',
          email: application.contactEmail,
          phone: application.contactPhone,
          pickupAddress: application.businessAddress,
          categoryPermissions: categoryPermissions || ['FASHION', 'CAKES_AND_BAKES'],
          status: 'APPROVED',
          statusHistory: [{ status: 'APPROVED', changedAt: new Date(), changedBy: req.user!._id }],
        });

        // Upgrade user role to SELLER
        await User.findByIdAndUpdate(application.userId, { role: 'SELLER' });
      }

      // Notify
      await Notification.create({
        userId: application.userId,
        type: 'SELLER_APPLICATION_APPROVED',
        title: 'Seller Application Approved! 🎉',
        message: 'Your FastVelix seller application has been approved.',
        deepLink: '/seller',
      });

      const user = await User.findById(application.userId);
      if (user) {
        const template = emailTemplates.sellerApplicationStatus(user.name, 'APPROVED');
        sendEmail({ to: user.email, subject: template.subject, html: template.html }).catch(console.error);
      }
    }

    // Audit log
    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: `SELLER_APPLICATION_${status}`,
      entity: 'SellerApplication',
      entityId: application._id.toString(),
      before,
      after: { status },
      metadata: { note },
    });

    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

// ─── PRODUCT MODERATION ───
router.get('/products', async (req, res, next) => {
  try {
    const { status, topLevelCategory, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (topLevelCategory) filter.topLevelCategory = topLevelCategory;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('sellerId', 'name email')
        .select('title status topLevelCategory thumbnail salePrice createdAt sellerId')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, products, pagination: { total } });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id/moderate', async (req: AuthRequest, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['ACTIVE', 'REJECTED', 'INACTIVE'].includes(status)) {
      return next(new AppError('Invalid moderation status.', 400, 'INVALID_STATUS'));
    }

    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found.', 404, 'NOT_FOUND'));

    const before = { status: product.status };
    product.status = status;
    product.moderationNote = note;
    if (status === 'ACTIVE') product.publishedAt = new Date();
    await product.save();

    // Notify seller
    await Notification.create({
      userId: product.sellerId,
      type: status === 'ACTIVE' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
      title: status === 'ACTIVE' ? 'Product Approved' : 'Product Rejected',
      message: `Your product "${product.title}" has been ${status === 'ACTIVE' ? 'approved' : 'rejected'}.${note ? ` Note: ${note}` : ''}`,
      deepLink: `/seller/products/${product._id}`,
    });

    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: `PRODUCT_${status}`,
      entity: 'Product',
      entityId: product._id.toString(),
      before,
      after: { status },
      metadata: { note },
    });

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── ORDERS ───
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20', q } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) filter.orderNumber = { $regex: q, $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .select('orderNumber status paymentStatus grandTotal userId createdAt')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, orders, pagination: { total } });
  } catch (err) {
    next(err);
  }
});

// ─── REFUNDS ───
router.get('/refunds', async (req, res, next) => {
  try {
    const refunds = await Refund.find({ status: { $in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } })
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, refunds });
  } catch (err) {
    next(err);
  }
});

router.put('/refunds/:id/process', async (req: AuthRequest, res, next) => {
  try {
    const { action, note } = req.body; // 'APPROVE' | 'REJECT'

    const refund = await Refund.findById(req.params.id).populate('paymentId');
    if (!refund) return next(new AppError('Refund not found.', 404, 'NOT_FOUND'));

    if (!['REQUESTED', 'APPROVED'].includes(refund.status)) {
      return next(new AppError('Refund cannot be processed in current state.', 400, 'INVALID_STATE'));
    }

    if (action === 'REJECT') {
      refund.status = 'REJECTED';
      refund.rejectionReason = note;
      refund.statusHistory.push({ status: 'REJECTED', changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user!._id), note });
    } else if (action === 'APPROVE') {
      const payment = refund.paymentId as typeof Payment.prototype;

      // Issue Razorpay refund
      if (payment?.razorpayPaymentId) {
        const rpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(refund.amount * 100),
          notes: { refundId: refund._id.toString() },
        });
        refund.razorpayRefundId = rpRefund.id;
        refund.status = 'COMPLETED';
        refund.processedBy = new mongoose.Types.ObjectId(req.user!._id);
        refund.processedAt = new Date();
        refund.statusHistory.push({ status: 'COMPLETED', changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(req.user!._id) });

        // Update payment record
        await Payment.findByIdAndUpdate(payment._id, {
          $inc: { refundedAmount: refund.amount },
          $push: { refunds: { razorpayRefundId: rpRefund.id, amount: refund.amount, status: 'processed', createdAt: new Date() } },
        });
      }
    }

    await refund.save();

    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: `REFUND_${action}`,
      entity: 'Refund',
      entityId: refund._id.toString(),
      metadata: { amount: refund.amount, note },
    });

    res.json({ success: true, refund });
  } catch (err) {
    next(err);
  }
});

// ─── HOMEPAGE CMS ───
router.get('/homepage-sections', async (req, res, next) => {
  try {
    const sections = await HomepageSection.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
});

router.post('/homepage-sections', async (req: AuthRequest, res, next) => {
  try {
    const section = await HomepageSection.create({ ...req.body, createdBy: req.user!._id });
    res.status(201).json({ success: true, section });
  } catch (err) {
    next(err);
  }
});

router.put('/homepage-sections/:id', async (req: AuthRequest, res, next) => {
  try {
    const section = await HomepageSection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user!._id },
      { new: true, runValidators: true }
    );
    if (!section) return next(new AppError('Section not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
});

router.delete('/homepage-sections/:id', async (req, res, next) => {
  try {
    await HomepageSection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Section deleted.' });
  } catch (err) {
    next(err);
  }
});

// ─── AUDIT LOGS ───
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { entity, action, page = '1', limit = '50' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = { $regex: action, $options: 'i' };

    const logs = await AuditLog.find(filter)
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

// ─── CUSTOMERS ───
router.get('/customers', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', q } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { role: 'CUSTOMER' };
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];

    const [customers, total] = await Promise.all([
      User.find(filter).select('name email phone createdAt isActive isEmailVerified').sort({ createdAt: -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, customers, pagination: { total } });
  } catch (err) {
    next(err);
  }
});

// ─── REVIEW MODERATION ───
router.get('/reviews', async (req, res, next) => {
  try {
    const { status = 'PENDING' } = req.query as Record<string, string>;
    const reviews = await Review.find({ status })
      .populate('userId', 'name')
      .populate('productId', 'title thumbnail')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
});

router.put('/reviews/:id/moderate', async (req: AuthRequest, res, next) => {
  try {
    const { status, note } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, moderationNote: note, moderatedBy: req.user!._id, moderatedAt: new Date() },
      { new: true }
    );
    if (!review) return next(new AppError('Review not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN SHIPPING & LOGISTICS ───
router.get('/shipping', async (req, res, next) => {
  try {
    const { status, carrier, q, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (carrier) filter.shippingCarrier = { $regex: carrier, $options: 'i' };
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { trackingNumber: { $regex: q, $options: 'i' } },
        { 'deliveryAddress.fullName': { $regex: q, $options: 'i' } },
        { 'deliveryAddress.city': { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [shipments, total, inTransitCount, deliveredCount, pendingDispatchCount] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
      Order.countDocuments({ status: { $in: ['SHIPPED', 'OUT_FOR_DELIVERY'] } }),
      Order.countDocuments({ status: 'DELIVERED' }),
      Order.countDocuments({ status: { $in: ['CONFIRMED', 'PROCESSING'] } }),
    ]);

    res.json({
      success: true,
      shipments,
      stats: {
        total,
        inTransitCount,
        deliveredCount,
        pendingDispatchCount,
      },
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/shipping/:orderId', async (req: AuthRequest, res, next) => {
  try {
    const { trackingNumber, shippingCarrier, status, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    if (status && status !== order.status) {
      const prevStatus = order.status;
      order.status = status;
      if (status === 'DELIVERED') order.deliveredAt = new Date();
      order.statusHistory.push({
        from: prevStatus,
        to: status,
        changedAt: new Date(),
        changedBy: req.user!._id as any,
        actorRole: 'ADMIN',
        note: `Shipping updated by Admin: ${shippingCarrier || 'Carrier'} (${trackingNumber || 'N/A'})`,
      });
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!._id,
      action: 'UPDATE_SHIPPING',
      entity: 'Order',
      entityId: order._id,
      details: { trackingNumber, shippingCarrier, status },
    });

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN CATEGORIES (for product creation dropdowns) ───────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const { topLevelCategory } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isActive: true };
    if (topLevelCategory) filter.topLevelCategory = topLevelCategory.toUpperCase();
    const categories = await Category.find(filter).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

// ─── SLUG AVAILABILITY CHECK ──────────────────────────────────────────────────
router.get('/products/slug-check', async (req, res, next) => {
  try {
    const { slug, excludeId } = req.query as Record<string, string>;
    if (!slug) return res.json({ available: false, error: 'No slug provided.' });
    const filter: Record<string, unknown> = { slug: slug.toLowerCase().trim() };
    if (excludeId) filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    const existing = await Product.findOne(filter).select('_id').lean();
    res.json({ available: !existing });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN PRODUCT IMAGE UPLOAD ───────────────────────────────────────────────
router.post(
  '/uploads/product-image',
  upload.single('image'),
  async (req: AuthRequest, res, next) => {
    try {
      const file = req.file;
      if (!file) return next(new AppError('No image file provided.', 400, 'NO_FILE'));

      const { url, publicId } = await uploadToCloudinary(
        file.buffer,
        'admin-products',
        { width: 1200, crop: 'limit' }
      );

      res.json({ success: true, url, publicId });
    } catch (err) {
      next(err);
    }
  }
);

// ─── ADMIN — CREATE FASHION PRODUCT ──────────────────────────────────────────
router.post('/products/fashion', async (req: AuthRequest, res, next) => {
  try {
    const {
      title, description, shortDescription, categoryId, subcategorySlug,
      brand, tags, basePrice, salePrice, tax, sku,
      fashionVariants, material, fit, gender, style, pattern, sleeve,
      neck, occasion, season, careInstructions, countryOfOrigin,
      isReturnable, returnWindow, isCancellable,
      seo, images, thumbnail,
      status = 'DRAFT',
    } = req.body;

    // Validate required fields
    if (!title || !description || !categoryId || !subcategorySlug || !basePrice || !salePrice) {
      return next(new AppError('Missing required fields: title, description, categoryId, subcategorySlug, basePrice, salePrice.', 400, 'MISSING_FIELDS'));
    }

    // Verify category
    const category = await Category.findById(categoryId);
    if (!category || category.topLevelCategory !== 'FASHION') {
      return next(new AppError('Invalid category for Fashion product.', 400, 'INVALID_CATEGORY'));
    }

    // Price sanity
    if (Number(salePrice) > Number(basePrice)) {
      return next(new AppError('Sale price cannot exceed MRP.', 400, 'INVALID_PRICE'));
    }

    // For ACTIVE publish, require at least one image and one variant
    if (status === 'ACTIVE') {
      if (!thumbnail && (!images || images.length === 0)) {
        return next(new AppError('At least one product image is required before publishing.', 400, 'MISSING_IMAGE'));
      }
      if (!fashionVariants || fashionVariants.length === 0) {
        return next(new AppError('At least one variant (size/color + stock) is required before publishing.', 400, 'MISSING_VARIANTS'));
      }
    }

    // Generate unique slug
    const { default: slugify } = await import('slugify');
    let slug = slugify(title, { lower: true, strict: true });
    const slugExists = await Product.findOne({ slug });
    if (slugExists) slug = `${slug}-${uuidv4().slice(0, 8)}`;

    // Build specifications from fashion attributes
    const specifications: Record<string, string> = {};
    if (material) specifications['Material'] = material;
    if (fit) specifications['Fit'] = fit;
    if (pattern) specifications['Pattern'] = pattern;
    if (sleeve) specifications['Sleeve'] = sleeve;
    if (neck) specifications['Neck'] = neck;
    if (season) specifications['Season'] = season;
    if (careInstructions) specifications['Care Instructions'] = careInstructions;
    if (countryOfOrigin) specifications['Country of Origin'] = countryOfOrigin;

    const product = await Product.create({
      sellerId: req.user!._id,
      topLevelCategory: 'FASHION',
      title,
      slug,
      description,
      shortDescription,
      categoryId,
      subcategorySlug,
      brand,
      tags: tags || [],
      basePrice: Number(basePrice),
      salePrice: Number(salePrice),
      tax: tax || { rate: 0, inclusive: true },
      fashionVariants: fashionVariants || [],
      material,
      fit,
      gender,
      style,
      specifications,
      isReturnable: isReturnable ?? true,
      returnWindow: returnWindow ?? 7,
      isCancellable: isCancellable ?? true,
      seo: seo || {},
      images: images || [],
      thumbnail: thumbnail || (images && images[0]) || '',
      status,
      publishedAt: status === 'ACTIVE' ? new Date() : undefined,
    });

    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id.toString(),
      after: { title, status, topLevelCategory: 'FASHION' },
    });

    // Emit real-time event
    const { getIO } = await import('../config/socket');
    getIO()?.to('admin').emit('PRODUCT_CREATED', { productId: product._id, title, category: 'FASHION', status });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN — CREATE CAKES & BAKES PRODUCT ────────────────────────────────────
router.post('/products/cakes-bakes', async (req: AuthRequest, res, next) => {
  try {
    const {
      title, description, shortDescription, categoryId, subcategorySlug,
      brand, tags, basePrice, salePrice, tax, sku,
      productType, bakeryVariants,
      isEggless, isCustomizable, isVegetarian,
      preparationHours, shelfLifeDays,
      ingredients, allergens,
      storageInstructions, countryOfOrigin,
      occasion,
      enabledOptions, // { size, flavour, colour, message, photoUpload, topper, decoration, notes }
      deliveryConfig, // { sameDayAvailable, advanceNoticeHours, blockedDates, serviceablePincodes }
      seo, images, thumbnail,
      status = 'DRAFT',
    } = req.body;

    if (!title || !description || !categoryId || !subcategorySlug || !basePrice || !salePrice) {
      return next(new AppError('Missing required fields: title, description, categoryId, subcategorySlug, basePrice, salePrice.', 400, 'MISSING_FIELDS'));
    }
    if (!productType) {
      return next(new AppError('Product type is required for Cakes & Bakes.', 400, 'MISSING_PRODUCT_TYPE'));
    }

    const category = await Category.findById(categoryId);
    if (!category || category.topLevelCategory !== 'CAKES_AND_BAKES') {
      return next(new AppError('Invalid category for Cakes & Bakes product.', 400, 'INVALID_CATEGORY'));
    }

    if (Number(salePrice) > Number(basePrice)) {
      return next(new AppError('Sale price cannot exceed MRP.', 400, 'INVALID_PRICE'));
    }

    if (status === 'ACTIVE') {
      if (!thumbnail && (!images || images.length === 0)) {
        return next(new AppError('At least one product image is required before publishing.', 400, 'MISSING_IMAGE'));
      }
    }

    const { default: slugify } = await import('slugify');
    let slug = slugify(title, { lower: true, strict: true });
    const slugExists = await Product.findOne({ slug });
    if (slugExists) slug = `${slug}-${uuidv4().slice(0, 8)}`;

    const specifications: Record<string, string> = {};
    if (isVegetarian !== undefined) specifications['Vegetarian'] = isVegetarian ? 'Yes' : 'No';
    if (storageInstructions) specifications['Storage'] = storageInstructions;

    const product = await Product.create({
      sellerId: req.user!._id,
      topLevelCategory: 'CAKES_AND_BAKES',
      title,
      slug,
      description,
      shortDescription,
      categoryId,
      subcategorySlug,
      brand,
      tags: tags || [],
      basePrice: Number(basePrice),
      salePrice: Number(salePrice),
      tax: tax || { rate: 0, inclusive: true },
      productType,
      bakeryVariants: bakeryVariants || [],
      isEggless: isEggless ?? false,
      isCustomizable: isCustomizable ?? false,
      preparationHours: preparationHours ?? 24,
      shelfLifeDays: shelfLifeDays ?? 3,
      ingredients: ingredients || [],
      allergens: allergens || [],
      occasion: occasion || [],
      countryOfOrigin: countryOfOrigin || 'India',
      specifications,
      isReturnable: false,
      returnWindow: 0,
      isCancellable: true,
      seo: seo || {},
      images: images || [],
      thumbnail: thumbnail || (images && images[0]) || '',
      status,
      publishedAt: status === 'ACTIVE' ? new Date() : undefined,
    });

    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id.toString(),
      after: { title, status, topLevelCategory: 'CAKES_AND_BAKES', productType },
    });

    const { getIO } = await import('../config/socket');
    getIO()?.to('admin').emit('PRODUCT_CREATED', { productId: product._id, title, category: 'CAKES_AND_BAKES', status });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN — PATCH ANY PRODUCT ────────────────────────────────────────────────
router.patch('/products/:id', async (req: AuthRequest, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found.', 404, 'NOT_FOUND'));

    const before = { status: product.status, title: product.title };

    const PATCHABLE = [
      'title', 'description', 'shortDescription', 'brand', 'tags',
      'basePrice', 'salePrice', 'tax', 'status',
      'fashionVariants', 'bakeryVariants',
      'material', 'fit', 'gender', 'style', 'specifications',
      'isEggless', 'isCustomizable', 'preparationHours', 'shelfLifeDays',
      'ingredients', 'allergens', 'occasion', 'productType',
      'isReturnable', 'returnWindow', 'isCancellable',
      'seo', 'images', 'thumbnail', 'moderationNote',
      'categoryId', 'subcategorySlug',
    ];

    PATCHABLE.forEach((field) => {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
      }
    });

    if (req.body.status === 'ACTIVE' && !product.publishedAt) {
      product.publishedAt = new Date();
    }

    await product.save();

    await AuditLog.create({
      actor: req.user!._id,
      actorRole: req.user!.role,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product._id.toString(),
      before,
      after: { status: product.status, title: product.title },
    });

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN — REPLACE FASHION VARIANTS ─────────────────────────────────────────
router.post('/products/:id/variants', async (req: AuthRequest, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found.', 404, 'NOT_FOUND'));
    if (product.topLevelCategory !== 'FASHION') {
      return next(new AppError('Variants endpoint is only for Fashion products.', 400, 'INVALID_CATEGORY'));
    }

    const { variants } = req.body;
    if (!Array.isArray(variants)) {
      return next(new AppError('variants must be an array.', 400, 'INVALID_INPUT'));
    }

    product.fashionVariants = variants;
    await product.save();

    res.json({ success: true, fashionVariants: product.fashionVariants });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN — DELETE SINGLE FASHION VARIANT ────────────────────────────────────
router.delete('/products/:id/variants/:vid', async (req: AuthRequest, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found.', 404, 'NOT_FOUND'));
    if (product.topLevelCategory !== 'FASHION') {
      return next(new AppError('Variants endpoint is only for Fashion products.', 400, 'INVALID_CATEGORY'));
    }

    product.fashionVariants = (product.fashionVariants || []).filter(
      (v: any) => v._id?.toString() !== req.params.vid
    );
    await product.save();

    res.json({ success: true, fashionVariants: product.fashionVariants });
  } catch (err) {
    next(err);
  }
});



// ─── PUT /api/admin/orders/:id/location ─── Update delivery location (from Fzokart)
router.put('/orders/:id/location', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lng, address } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    const locationData = {
      lat: Number(lat),
      lng: Number(lng),
      address: address || '',
      updatedAt: new Date(),
    };

    (order as any).currentLocation = locationData;
    await order.save();

    // Emit real-time location update
    const { getIO } = await import('../config/socket');
    const io = getIO();
    if (io) {
      io.to(`user:${order.userId}`).emit('order:location_update', { orderId: order._id, location: locationData });
      io.to('admin-monitor').emit('order:location_update', { orderId: order._id, location: locationData });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/admin/orders/:id/delivery-agent ─── Set delivery agent info (from Fzokart)
router.put('/orders/:id/delivery-agent', async (req: AuthRequest, res, next) => {
  try {
    const { name, phone, vehicle, deliveryText } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    if (name || phone || vehicle) {
      (order as any).deliveryAgent = { name, phone, vehicle };
    }
    if (deliveryText !== undefined) {
      (order as any).deliveryText = deliveryText;
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

export default router;
