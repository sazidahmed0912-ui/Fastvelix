import { Router } from 'express';
import { Seller, SellerApplication } from '../models/Seller';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { upload, uploadToCloudinary } from '../middleware/upload';
import { sendEmail, emailTemplates } from '../config/mailer';

const router = Router();
router.use(authenticate, authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'));

// Helper: ensure the requesting seller owns the resource
const requireSellerOwnership = async (req: AuthRequest, sellerId: string) => {
  if (req.user!.role === 'SELLER' && req.user!._id !== sellerId) {
    throw new AppError('Access denied.', 403, 'FORBIDDEN');
  }
};

// ─── GET /api/seller/dashboard ─── Seller dashboard stats
router.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const sellerId = req.user!._id;

    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller && req.user!.role === 'SELLER') {
      return next(new AppError('Seller profile not found.', 404, 'SELLER_NOT_FOUND'));
    }

    const [totalProducts, totalOrders, pendingOrders, activeProducts] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Order.countDocuments({ 'items.sellerId': sellerId }),
      Order.countDocuments({ 'items.sellerId': sellerId, status: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } }),
      Product.countDocuments({ sellerId, status: 'ACTIVE' }),
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      sellerId,
      status: 'ACTIVE',
      totalStock: { $lt: 10, $gt: 0 },
    }).select('title totalStock thumbnail').limit(10).lean();

    // Revenue (last 30 days from paid orders)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const revenueResult = await Order.aggregate([
      {
        $match: {
          'items.sellerId': sellerId,
          paymentStatus: 'PAID',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        revenue30d: revenueResult[0]?.total || 0,
      },
      lowStockProducts,
      seller,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/products ─── Seller's products
router.get('/products', async (req: AuthRequest, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { sellerId: req.user!._id };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('title thumbnail status totalStock salePrice topLevelCategory createdAt ratings')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, products, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/orders ─── Seller's orders
router.get('/orders', async (req: AuthRequest, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { 'items.sellerId': req.user!._id };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber status paymentStatus grandTotal items.title items.quantity items.sellerId createdAt')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Only expose items belonging to this seller
    const filteredOrders = orders.map((o) => ({
      ...o,
      items: o.items.filter((i) => i.sellerId.toString() === req.user!._id),
    }));

    res.json({ success: true, orders: filteredOrders, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/profile ─── Get seller profile
router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user!._id });
    if (!seller) return next(new AppError('Seller profile not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, seller });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/seller/profile ─── Update seller profile
router.put('/profile', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req: AuthRequest, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user!._id });
    if (!seller) return next(new AppError('Seller profile not found.', 404, 'NOT_FOUND'));

    const files = req.files as Record<string, Express.Multer.File[]>;
    if (files?.logo?.[0]) {
      const result = await uploadToCloudinary(files.logo[0].buffer, 'sellers/logos');
      seller.logo = result.url;
    }
    if (files?.banner?.[0]) {
      const result = await uploadToCloudinary(files.banner[0].buffer, 'sellers/banners');
      seller.banner = result.url;
    }

    const allowedFields = ['businessName', 'description', 'website', 'phone', 'pickupAddress', 'bankDetails'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (seller as any)[field] = req.body[field];
      }
    });

    await seller.save();
    res.json({ success: true, seller });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/seller/inventory/:productId ─── Update inventory for a product
router.post('/inventory/:productId', async (req: AuthRequest, res, next) => {
  try {
    const { sku, stock, action = 'SET' } = req.body;

    const product = await Product.findOne({ _id: req.params.productId, sellerId: req.user!._id });
    if (!product) return next(new AppError('Product not found.', 404, 'NOT_FOUND'));

    if (product.topLevelCategory === 'FASHION') {
      const variant = product.fashionVariants?.find((v) => v.sku === sku);
      if (!variant) return next(new AppError('Variant not found.', 404, 'VARIANT_NOT_FOUND'));
      if (action === 'ADD') variant.stock += stock;
      else variant.stock = Math.max(0, stock);
    } else {
      const variant = product.bakeryVariants?.find((v) => v.sku === sku);
      if (!variant) return next(new AppError('Variant not found.', 404, 'VARIANT_NOT_FOUND'));
      if (action === 'ADD') variant.stock += stock;
      else variant.stock = Math.max(0, stock);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/shipping ─── List seller's order shipments
router.get('/shipping', async (req: AuthRequest, res, next) => {
  try {
    const sellerId = req.user!._id;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { 'items.sellerId': sellerId };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber items deliveryAddress status paymentMethod paymentStatus grandTotal trackingNumber shippingCarrier estimatedDelivery createdAt')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Filter items to only include items belonging to this seller
    const shipments = orders.map((order) => {
      const sellerItems = order.items.filter((item: any) => item.sellerId.toString() === sellerId);
      return {
        ...order,
        items: sellerItems,
      };
    });

    res.json({
      success: true,
      shipments,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/seller/shipping/:orderId/dispatch ─── Update tracking & dispatch order
router.post('/shipping/:orderId/dispatch', async (req: AuthRequest, res, next) => {
  try {
    const sellerId = req.user!._id;
    const { trackingNumber, shippingCarrier, status = 'SHIPPED', estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    const hasSellerItems = order.items.some((i) => i.sellerId.toString() === sellerId);
    if (!hasSellerItems && req.user!.role === 'SELLER') {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    if (status && status !== order.status) {
      const prevStatus = order.status;
      order.status = status as any;
      order.statusHistory.push({
        from: prevStatus,
        to: status as any,
        changedAt: new Date(),
        changedBy: req.user!._id as any,
        actorRole: req.user!.role,
        note: `Shipping updated by seller: ${shippingCarrier || 'Carrier'} (${trackingNumber || 'N/A'})`,
      });
    }

    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.userId,
      type: 'ORDER_SHIPPED',
      title: 'Order Dispatched! 🚚',
      message: `Your order #${order.orderNumber} has been dispatched via ${order.shippingCarrier || 'Express Delivery'}. Tracking #: ${order.trackingNumber || 'N/A'}`,
      deepLink: `/orders/${order._id}`,
    }).catch(() => {});

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/seller/shipping/:orderId/label ─── Get Shipping Label data
router.get('/shipping/:orderId/label', async (req: AuthRequest, res, next) => {
  try {
    const sellerId = req.user!._id;

    const [order, seller] = await Promise.all([
      Order.findById(req.params.orderId).lean(),
      Seller.findOne({ userId: sellerId }).lean(),
    ]);

    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    const sellerItems = order.items.filter((i: any) => i.sellerId.toString() === sellerId);
    if (sellerItems.length === 0 && req.user!.role === 'SELLER') {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    const carrier = order.shippingCarrier || 'FastVelix Express Logistics';
    const awb = order.trackingNumber || `AWB-${order.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    const label = {
      labelId: `LBL-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      paymentMethod: order.paymentMethod,
      isCOD: order.paymentMethod === 'COD',
      codAmount: order.paymentMethod === 'COD' ? order.grandTotal : 0,
      carrier,
      awb,
      routingHub: `HUB-${order.deliveryAddress.pincode.slice(0, 3)}/${order.deliveryAddress.state.slice(0, 3).toUpperCase()}`,
      shipFrom: {
        companyName: seller?.businessName || 'FastVelix Merchant',
        contactPerson: req.user!.name,
        phone: seller?.phone || (req.user as any).phone || '9876543210',
        address: seller?.pickupAddress?.addressLine1 || 'Plot 42, Industrial Area',
        city: seller?.pickupAddress?.city || 'Bengaluru',
        state: seller?.pickupAddress?.state || 'Karnataka',
        pincode: seller?.pickupAddress?.pincode || '560038',
      },
      shipTo: {
        name: order.deliveryAddress.fullName,
        phone: order.deliveryAddress.phone,
        addressLine1: order.deliveryAddress.addressLine1,
        addressLine2: order.deliveryAddress.addressLine2 || '',
        city: order.deliveryAddress.city,
        state: order.deliveryAddress.state,
        pincode: order.deliveryAddress.pincode,
        country: order.deliveryAddress.country || 'India',
      },
      packageDetails: {
        totalItems: sellerItems.length,
        weight: '0.75 kg', // Estimated standard package weight
        dimensions: '25 x 20 x 10 cm',
        items: sellerItems.map((item: any) => ({
          title: item.title,
          sku: item.sku,
          variant: item.size ? `Size: ${item.size}` : item.packSize ? `Pack: ${item.packSize}` : '',
          quantity: item.quantity,
        })),
      },
    };

    res.json({ success: true, label });
  } catch (err) {
    next(err);
  }
});

export default router;
