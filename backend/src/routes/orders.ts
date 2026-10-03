import { Router } from 'express';
import { Order, VALID_ORDER_TRANSITIONS, OrderStatus } from '../models/Order';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { sendEmail, emailTemplates } from '../config/mailer';
import { socketService } from '../services/socketService';
import { handleOrderDeliveredNotification } from '../services/notificationService';

const router = Router();
router.use(authenticate);

// ─── GET /api/orders ─── List user's orders
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber items.title items.thumbnail status paymentStatus grandTotal createdAt deliveryAddress.city')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders/:id ─── Order detail
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('paymentId', 'status razorpayPaymentId paidAt amount');

    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    // Customers can only see their own orders
    if (req.user!.role === 'CUSTOMER' && order.userId.toString() !== req.user!._id) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    // Sellers can only see orders containing their products
    if (req.user!.role === 'SELLER') {
      const hasSellerItems = order.items.some((i) => i.sellerId.toString() === req.user!._id);
      if (!hasSellerItems) return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders/:id/invoice ─── Get Tax Invoice details
router.get('/:id/invoice', async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('paymentId', 'provider razorpayPaymentId paidAt status amount');

    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    const userIdStr = (order.userId as any)._id ? (order.userId as any)._id.toString() : order.userId.toString();
    if (req.user!.role === 'CUSTOMER' && userIdStr !== req.user!._id) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    const invoiceNumber = `INV-FV-${new Date(order.createdAt).getFullYear()}-${order.orderNumber}`;
    const invoiceDate = order.createdAt;

    const sellerInfo = {
      companyName: 'FastVelix Retail Partners India Pvt. Ltd.',
      tradeName: 'FastVelix Commerce',
      gstin: '29AAACF9999F1Z5',
      pan: 'AAACF9999F',
      fssaiLicNo: '11223999000123',
      address: 'Plot 42, FastVelix Tech Hub, Outer Ring Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      supportEmail: 'billing@fastvelix.com',
      supportPhone: '+91 1800 200 9000',
    };

    const itemsWithTax = order.items.map((item, idx) => {
      const taxableValue = Math.round((item.totalPrice / 1.05) * 100) / 100;
      const gstAmount = Math.round((item.totalPrice - taxableValue) * 100) / 100;
      const cgst = Math.round((gstAmount / 2) * 100) / 100;
      const sgst = Math.round((gstAmount / 2) * 100) / 100;
      const hsnCode = item.topLevelCategory === 'FASHION' ? '6205' : '2106';

      return {
        slNo: idx + 1,
        title: item.title,
        brand: item.brand || 'FastVelix',
        sku: item.sku,
        category: item.topLevelCategory,
        variantInfo: item.size ? `Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}` : item.weight ? `Weight: ${item.weight}` : '',
        hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        grossAmount: item.totalPrice,
        taxableValue,
        gstRate: 5,
        cgstRate: 2.5,
        cgstAmount: cgst,
        sgstRate: 2.5,
        sgstAmount: sgst,
        totalAmount: item.totalPrice,
      };
    });

    const totalTaxable = itemsWithTax.reduce((sum, i) => sum + i.taxableValue, 0);
    const totalCGST = itemsWithTax.reduce((sum, i) => sum + i.cgstAmount, 0);
    const totalSGST = itemsWithTax.reduce((sum, i) => sum + i.sgstAmount, 0);
    const totalGST = totalCGST + totalSGST;

    res.json({
      success: true,
      invoice: {
        invoiceNumber,
        invoiceDate,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentId: (order.paymentId as any)?.razorpayPaymentId || (order.paymentMethod === 'COD' ? 'COD-PAY-ON-DELIVERY' : 'N/A'),
        seller: sellerInfo,
        customer: {
          name: order.deliveryAddress.fullName,
          phone: order.deliveryAddress.phone,
          email: (order.userId as any)?.email || '',
          addressLine1: order.deliveryAddress.addressLine1,
          addressLine2: order.deliveryAddress.addressLine2 || '',
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          pincode: order.deliveryAddress.pincode,
          country: order.deliveryAddress.country || 'India',
        },
        items: itemsWithTax,
        summary: {
          subtotal: order.subtotal,
          taxableValue: Math.round(totalTaxable * 100) / 100,
          totalCGST: Math.round(totalCGST * 100) / 100,
          totalSGST: Math.round(totalSGST * 100) / 100,
          totalGST: Math.round(totalGST * 100) / 100,
          shippingFee: order.shippingFee,
          couponCode: order.couponCode,
          couponDiscount: order.couponDiscount,
          grandTotal: order.grandTotal,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/orders/:id/cancel ─── Cancel order (customer)
router.post('/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    if (order.userId.toString() !== req.user!._id) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    // Can only cancel if PENDING or CONFIRMED
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return next(new AppError(
        `Cannot cancel an order in "${order.status}" status.`,
        400,
        'INVALID_STATUS_TRANSITION'
      ));
    }

    const prevStatus = order.status;
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    order.statusHistory.push({
      from: prevStatus as OrderStatus,
      to: 'CANCELLED',
      changedAt: new Date(),
      changedBy: order.userId,
      actorRole: 'CUSTOMER',
      note: order.cancellationReason,
    });

    await order.save();

    // Release reserved stock
    for (const item of order.items) {
      const { Product } = await import('../models/Product');
      if (item.topLevelCategory === 'FASHION') {
        await Product.updateOne(
          { _id: item.productId, 'fashionVariants.sku': item.sku },
          { $inc: { 'fashionVariants.$.reservedStock': -item.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId, 'bakeryVariants.sku': item.sku },
          { $inc: { 'bakeryVariants.$.reservedStock': -item.quantity } }
        );
      }
    }

    // Notify user via DB & Socket
    const notif = await Notification.create({
      userId: order.userId,
      type: 'ORDER_CANCELLED',
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.`,
      deepLink: `/orders/${order._id}`,
    });

    socketService.sendNotificationToUser(order.userId.toString(), notif);
    socketService.emitOrderStatusUpdate(order._id.toString(), order.userId.toString(), order);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/orders/:id/return ─── Request return (customer)
router.post('/:id/return', async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    if (order.userId.toString() !== req.user!._id) {
      return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    if (order.status !== 'DELIVERED') {
      return next(new AppError('Returns can only be requested for delivered orders.', 400, 'INVALID_STATUS'));
    }

    // Check return window
    const deliveredDate = order.deliveredAt || order.updatedAt;
    const maxReturnDate = new Date(deliveredDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() > maxReturnDate) {
      return next(new AppError('Return window has expired.', 400, 'RETURN_WINDOW_EXPIRED'));
    }

    order.status = 'RETURN_REQUESTED';
    order.statusHistory.push({
      from: 'DELIVERED',
      to: 'RETURN_REQUESTED',
      changedAt: new Date(),
      changedBy: order.userId,
      actorRole: 'CUSTOMER',
      note: req.body.reason || 'Return requested by customer',
    });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/orders/:id/status ─── Update order status (seller/admin)
router.put('/:id/status', authorize('SELLER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, note, trackingNumber, shippingCarrier } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));

    // Sellers can only update their own orders
    if (req.user!.role === 'SELLER') {
      const hasItems = order.items.some((i) => i.sellerId.toString() === req.user!._id);
      if (!hasItems) return next(new AppError('Access denied.', 403, 'FORBIDDEN'));
    }

    const validNext = VALID_ORDER_TRANSITIONS[order.status as OrderStatus];
    if (!validNext?.includes(status)) {
      return next(new AppError(
        `Cannot transition from "${order.status}" to "${status}".`,
        400,
        'INVALID_STATUS_TRANSITION'
      ));
    }

    const prevStatus = order.status;
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;
    if (status === 'DELIVERED') order.deliveredAt = new Date();

    order.statusHistory.push({
      from: prevStatus as OrderStatus,
      to: status,
      changedAt: new Date(),
      changedBy: new (await import('mongoose')).default.Types.ObjectId(req.user!._id),
      actorRole: req.user!.role,
      note,
    });

    await order.save();

    // Audit log for admin actions
    if (req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN') {
      await AuditLog.create({
        actor: req.user!._id,
        actorRole: req.user!.role,
        action: `ORDER_STATUS_${status}`,
        entity: 'Order',
        entityId: order._id.toString(),
        before: { status: prevStatus },
        after: { status },
        metadata: { note },
      });
    }

    // Notify customer
    const notifMap: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed.',
      PROCESSING: 'Your order is being processed.',
      SHIPPED: `Your order has been shipped${trackingNumber ? ` (${trackingNumber})` : ''}.`,
      OUT_FOR_DELIVERY: 'Your order is out for delivery!',
      DELIVERED: 'Your order has been delivered. Enjoy!',
    };

    if (notifMap[status]) {
      const notif = await Notification.create({
        userId: order.userId,
        type: `ORDER_${status}` as 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_OUT_FOR_DELIVERY' | 'ORDER_DELIVERED',
        title: `Order ${status.replace('_', ' ')}`,
        message: notifMap[status],
        deepLink: `/orders/${order._id}`,
      });

      socketService.sendNotificationToUser(order.userId.toString(), notif);

      if (status === 'SHIPPED') {
        const user = await User.findById(order.userId);
        if (user) {
          const template = emailTemplates.orderShipped(user.name, order._id.toString(), trackingNumber);
          sendEmail({ to: user.email, subject: template.subject, html: template.html }).catch(console.error);
        }
      }
    }

    // Emit real-time status update to live listeners
    socketService.emitOrderStatusUpdate(order._id.toString(), order.userId.toString(), order);

    // 🔔 Notify seller(s) via Email + WhatsApp when order is DELIVERED
    if (status === 'DELIVERED') {
      handleOrderDeliveredNotification(order._id.toString()).catch((err) => {
        console.error('[Notification] Background seller notification failed:', err);
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

export default router;
