import { Router } from 'express';
import mongoose from 'mongoose';
import { Order, VALID_ORDER_TRANSITIONS, OrderStatus } from '../models/Order';
import { Cart } from '../models/Cart';
import { Payment } from '../models/Payment';
import { Product } from '../models/Product';
import { Coupon, CouponUsage } from '../models/Coupon';
import { Address } from '../models/Address';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay';
import { sendEmail, emailTemplates } from '../config/mailer';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { socketService } from '../services/socketService';

const router = Router();

// â”€â”€â”€ POST /api/checkout/validate â”€â”€â”€ Pre-checkout validation
router.post('/validate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { addressId } = req.body;

    const [cart, address] = await Promise.all([
      Cart.findOne({ userId: req.user!._id }),
      addressId ? Address.findOne({ _id: addressId, userId: req.user!._id }) : null,
    ]);

    if (!cart || cart.items.length === 0) {
      return next(new AppError('Your cart is empty.', 400, 'EMPTY_CART'));
    }

    if (addressId && !address) {
      return next(new AppError('Delivery address not found.', 404, 'ADDRESS_NOT_FOUND'));
    }

    // Validate each item's stock
    const issues: string[] = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'ACTIVE') {
        issues.push(`"${item.title}" is no longer available.`);
        continue;
      }

      let available = 0;
      if (item.topLevelCategory === 'FASHION') {
        const v = product.fashionVariants?.find((fv) => fv.sku === item.sku);
        available = v ? v.stock - (v.reservedStock || 0) : 0;
      } else {
        const v = product.bakeryVariants?.find((bv) => bv.sku === item.sku);
        available = v ? v.stock - (v.reservedStock || 0) : product.totalStock || 10;
      }

      if (available < item.quantity) {
        issues.push(`"${item.title}" â€” only ${available} units available.`);
      }
    }

    if (issues.length > 0) {
      return res.status(400).json({ success: false, code: 'STOCK_ISSUES', issues });
    }

    res.json({ success: true, cart, address });
  } catch (err) {
    next(err);
  }
});

// â”€â”€â”€ Helper for standalone/replica-set compatible MongoDB operations â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function runWithOptionalSession<T>(fn: (session?: mongoose.ClientSession) => Promise<T>): Promise<T> {
  let session: mongoose.ClientSession | undefined;
  try {
    const s = await mongoose.startSession();
    s.startTransaction();
    session = s;
  } catch {
    session = undefined;
  }

  try {
    const result = await fn(session);
    if (session && session.inTransaction()) {
      await session.commitTransaction();
    }
    return result;
  } catch (error: any) {
    if (session && session.inTransaction()) {
      try { await session.abortTransaction(); } catch {}
    }

    // If MongoDB rejected transaction because server is standalone (not replica set), retry without session
    if (error?.message?.includes('Transaction numbers') || error?.code === 20 || error?.codeName === 'IllegalOperation') {
      return await fn(undefined);
    }

    throw error;
  } finally {
    if (session) {
      try { session.endSession(); } catch {}
    }
  }
}

// â”€â”€â”€ POST /api/checkout/create-payment â”€â”€â”€ Create Razorpay order intent
router.post('/create-payment', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await runWithOptionalSession(async (session) => {
      const opts = session ? { session } : {};
      const { addressId, paymentMethod = 'RAZORPAY', idempotencyKey } = req.body;

      // Prevent duplicate order creation
      if (idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey }).setOptions(opts);
        if (existing) {
          return { success: true, order: existing, alreadyExists: true };
        }
      }

      const cart = await Cart.findOne({ userId: req.user!._id }).setOptions(opts);
      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty.', 400, 'EMPTY_CART');
      }

      let address = mongoose.Types.ObjectId.isValid(addressId)
        ? await Address.findOne({ _id: addressId, userId: req.user!._id }).setOptions(opts)
        : await Address.findOne({ userId: req.user!._id }).setOptions(opts);

      if (!address) {
        const created = await Address.create([{
          userId: req.user!._id,
          label: 'HOME',
          fullName: req.user!.name || 'Demo Customer',
          phone: '9876543210',
          addressLine1: '123 MG Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          country: 'India',
          isDefault: true,
        }], opts);
        address = created[0];
      }

      // Server-side recalculate totals (never trust client)
      let subtotal = 0;
      const orderItems = [];

      for (const item of cart.items) {
        const product = await Product.findById(item.productId).setOptions(opts);
        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product "${item.title}" is no longer available.`, 400, 'PRODUCT_UNAVAILABLE');
        }

        let unitPrice: number;
        if (item.topLevelCategory === 'FASHION') {
          const v = product.fashionVariants?.find((fv) => fv.sku === item.sku);
          if (!v || (v.stock - (v.reservedStock || 0)) < item.quantity) {
            throw new AppError(`"${item.title}" â€” insufficient stock.`, 400, 'OUT_OF_STOCK');
          }
          unitPrice = v.price || product.salePrice;
          await Product.updateOne(
            { _id: product._id, 'fashionVariants.sku': item.sku },
            { $inc: { 'fashionVariants.$.reservedStock': item.quantity } },
            opts
          );
        } else {
          // CAKES_AND_BAKES â€” custom cakes use cakeConfiguration price; standard bakes use bakery variant price
          if (item.cakeConfiguration?.customPrice) {
            unitPrice = item.cakeConfiguration.customPrice;
          } else {
            const v = product.bakeryVariants?.find((bv: any) => bv.sku === item.sku);
            if (!v || (v.stock - (v.reservedStock || 0)) < item.quantity) {
              throw new AppError(`"${item.title}" â€” insufficient stock.`, 400, 'OUT_OF_STOCK');
            }
            unitPrice = v.price;
            await Product.updateOne(
              { _id: product._id, 'bakeryVariants.sku': item.sku },
              { $inc: { 'bakeryVariants.$.reservedStock': item.quantity } },
              opts
            );
          }
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product._id,
          sellerId: product.sellerId,
          title: product.title,
          thumbnail: product.thumbnail,
          brand: product.brand,
          topLevelCategory: product.topLevelCategory,
          sku: item.sku,
          size: item.size,
          color: item.color,
          weight: item.weight,
          flavour: item.flavour,
          isEggless: item.isEggless,
          cakeConfiguration: item.cakeConfiguration,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          tax: 0,
          discount: 0,
          isReturnable: product.isReturnable,
          returnWindow: product.returnWindow || 7,
        });
      }

      // ── Advanced Coupon Engine (from Fzokart) ──────────────────────────────
      let couponDiscount = 0;
      let isFreeShipping = false;

      if (cart.couponCode) {
        const coupon = await Coupon.findOne({ code: cart.couponCode, isActive: true });

        if (coupon && new Date() <= coupon.endDate && new Date() >= coupon.startDate) {
          const userUsage = await CouponUsage.countDocuments({ couponId: coupon._id, userId: req.user!._id });
          const conditions: any = (coupon as any).conditions || {};
          let skipCoupon = false;

          if (conditions.paymentRestriction && paymentMethod) {
            if (conditions.paymentRestriction.toLowerCase() !== paymentMethod.toLowerCase()) skipCoupon = true;
          }
          if (!skipCoupon && conditions.firstOrderOnly) {
            const prevOrders = await Order.countDocuments({ userId: req.user!._id });
            if (prevOrders > 0) skipCoupon = true;
          }

          if (!skipCoupon && userUsage < coupon.perUserLimit && subtotal >= coupon.minOrderValue) {
            switch (coupon.type) {
              case 'PERCENTAGE':
                couponDiscount = (subtotal * coupon.value) / 100;
                if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
                break;
              case 'FIXED':
                couponDiscount = coupon.value;
                break;
              case 'FREE_SHIPPING':
                isFreeShipping = true;
                break;
              case 'CATEGORY_SPECIFIC': {
                const allowedCats: string[] = conditions.allowedCategories || [];
                let applicableTotal = 0;
                for (const item of orderItems) { if (allowedCats.includes(item.topLevelCategory)) applicableTotal += item.totalPrice; }
                if (applicableTotal > 0) couponDiscount = applicableTotal * (coupon.value / 100);
                break;
              }
              case 'PRODUCT_SPECIFIC': {
                const allowedProds = (conditions.allowedProducts || []).map(String);
                let applicableTotal = 0;
                for (const item of orderItems) { if (allowedProds.includes(item.productId.toString())) applicableTotal += item.totalPrice; }
                if (applicableTotal > 0) couponDiscount = applicableTotal * (coupon.value / 100);
                break;
              }
              case 'BOGO': {
                const sortedItems = [...orderItems].sort((a, b) => a.unitPrice - b.unitPrice);
                const totalQty = sortedItems.reduce((acc, i) => acc + i.quantity, 0);
                if (totalQty >= 2) {
                  const freeCount = Math.floor(totalQty / 2); let freed = 0;
                  for (const item of sortedItems) {
                    if (freed >= freeCount) break;
                    const canFree = Math.min(item.quantity, freeCount - freed);
                    couponDiscount += item.unitPrice * canFree; freed += canFree;
                  }
                }
                break;
              }
              case 'BUY_X_GET_Y': {
                const buyX = conditions.buyX || 1;
                const totalQty = orderItems.reduce((acc, i) => acc + i.quantity, 0);
                if (totalQty >= buyX) couponDiscount = coupon.value;
                break;
              }
              case 'MIN_CART_VALUE':
                if (subtotal >= coupon.minOrderValue) couponDiscount = coupon.value;
                break;
              default:
                couponDiscount = coupon.value;
            }

            if (conditions.excludedCategories?.length && coupon.type === 'PERCENTAGE') {
              for (const item of orderItems) {
                if (conditions.excludedCategories.includes(item.topLevelCategory)) couponDiscount -= item.totalPrice * (coupon.value / 100);
              }
            }
            if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) couponDiscount = coupon.maxDiscount;
            couponDiscount = Math.max(0, Math.min(couponDiscount, subtotal));
            couponDiscount = Math.round(couponDiscount * 100) / 100;
          }
        }
      }

      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const shippingFee = isFreeShipping ? 0 : (subtotal >= 499 ? 0 : 49);
      const grandTotal = Math.max(0, subtotal + tax + shippingFee - couponDiscount);

      const orderKey = idempotencyKey || uuidv4();

      const order = new Order({
        orderNumber: `FV${Date.now().toString(36).toUpperCase()}`,
        userId: req.user!._id,
        items: orderItems,
        deliveryAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
        paymentMethod,
        subtotal,
        taxTotal: tax,
        shippingFee,
        couponCode: cart.couponCode,
        couponDiscount,
        grandTotal,
        idempotencyKey: orderKey,
        statusHistory: [{ to: 'PENDING', changedAt: new Date(), actorRole: 'CUSTOMER' }],
      });

      await order.save(opts);

      let razorpayOrderId: string | undefined;

      if (paymentMethod === 'COD') {
        // â”€â”€ Cash on Delivery direct confirmation â”€â”€
        order.status = 'CONFIRMED';
        order.paymentStatus = 'PENDING';
        order.statusHistory.push({
          from: 'PENDING',
          to: 'CONFIRMED',
          changedAt: new Date(),
          actorRole: 'SYSTEM',
          note: 'Order confirmed via Cash on Delivery',
        });

        // Deduct actual stock and free reserved stock
        for (const item of orderItems) {
          if (item.topLevelCategory === 'FASHION') {
            await Product.updateOne(
              { _id: item.productId, 'fashionVariants.sku': item.sku },
              {
                $inc: {
                  'fashionVariants.$.stock': -item.quantity,
                  'fashionVariants.$.reservedStock': -item.quantity,
                },
              },
              opts
            );
          } else {
            await Product.updateOne(
              { _id: item.productId, 'bakeryVariants.sku': item.sku },
              {
                $inc: {
                  'bakeryVariants.$.stock': -item.quantity,
                  'bakeryVariants.$.reservedStock': -item.quantity,
                },
              },
              opts
            );
          }
        }

        // Clear user cart
        await Cart.updateOne({ userId: req.user!._id }, { $set: { items: [], couponCode: null, couponDiscount: 0, subtotal: 0, tax: 0, shippingFee: 0, grandTotal: 0 } }, opts);

        const payment = new Payment({
          orderId: order._id,
          userId: req.user!._id,
          provider: 'COD',
          amount: grandTotal,
          status: 'PAID',
          idempotencyKey: orderKey,
        });
        await payment.save(opts);

        order.paymentId = payment._id;
        await order.save(opts);
      } else {
        // â”€â”€ Razorpay Online Payment â”€â”€
        if (config.razorpay.keyId && config.razorpay.keySecret) {
          const rpOrder = await createRazorpayOrder(grandTotal, 'INR', order.orderNumber, {
            orderId: order._id.toString(),
            userId: req.user!._id,
          });
          razorpayOrderId = rpOrder.id;
        } else if (config.env !== 'development') {
          // Refuse rather than fall back. The mock order id below makes
          // /verify-payment skip signature checking altogether, so producing it
          // in production would let anyone place an order marked PAID without
          // paying. The transaction is still open, so throwing here discards the
          // order that was just created.
          throw new AppError(
            'Online payment is unavailable because Razorpay is not configured on the server. Please choose Cash on Delivery.',
            503,
            'PAYMENT_NOT_CONFIGURED'
          );
        } else {
          // Dev mode fallback mock order ID when keys are not configured
          razorpayOrderId = `order_mock_${Date.now()}`;
        }

        const payment = new Payment({
          orderId: order._id,
          userId: req.user!._id,
          provider: 'RAZORPAY',
          amount: grandTotal,
          razorpayOrderId,
          idempotencyKey: orderKey,
        });
        await payment.save(opts);

        order.paymentId = payment._id;
        await order.save(opts);
      }

      return {
        success: true,
        order: { _id: order._id, orderNumber: order.orderNumber, grandTotal },
        razorpayOrderId,
        // Never hand the client a placeholder in production: the checkout page
        // would pass it to Razorpay and the payment would fail confusingly.
        razorpayKeyId: config.razorpay.keyId || 'rzp_test_mockkey',
      };
    });

    if (result.success && result.order) {
      socketService.sendNotificationToUser(req.user!._id, {
        type: 'ORDER_PLACED',
        title: 'Order Placed Successfully!',
        message: `Your order #${result.order.orderNumber} has been received.`,
        deepLink: `/orders/${result.order._id}`,
      });
      socketService.emitAdminDashboardUpdate('NEW_ORDER_CREATED', {
        orderId: result.order._id,
        orderNumber: result.order.orderNumber,
        grandTotal: result.order.grandTotal,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// â”€â”€â”€ POST /api/checkout/verify-payment â”€â”€â”€ Verify Razorpay payment (client callback)
router.post('/verify-payment', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // The mock path is for local development only. It was previously also taken
    // whenever RAZORPAY_KEY_SECRET was absent, which meant a server missing one
    // env var accepted any signature at all and marked the order PAID and
    // CONFIRMED. A missing secret now fails closed.
    const isMock =
      config.env === 'development' &&
      (razorpayOrderId?.startsWith('order_mock_') || !config.razorpay.keySecret);

    if (!isMock) {
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return next(new AppError('Payment verification failed. Invalid signature.', 400, 'PAYMENT_VERIFICATION_FAILED'));
      }
    }

    // Find and update payment
    const payment = await Payment.findOne({ $or: [{ razorpayOrderId }, { orderId }] });
    if (!payment) return next(new AppError('Payment record not found.', 404, 'PAYMENT_NOT_FOUND'));

    payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    payment.razorpaySignature = razorpaySignature || 'mock_signature';
    payment.status = 'PAID';
    payment.paidAt = new Date();
    await payment.save();

    // Confirm order directly
    const order = await Order.findById(orderId || payment.orderId);
    if (!order) return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
    
    if (order.status === 'PENDING') {
      order.status = 'CONFIRMED';
      order.paymentStatus = 'PAID';
      order.statusHistory.push({
        from: 'PENDING',
        to: 'CONFIRMED',
        changedAt: new Date(),
        actorRole: 'SYSTEM',
        note: 'Payment verified via Razorpay',
      });
      await order.save();

      // Deduct actual stock and free reserved stock
      for (const item of order.items) {
        if (item.topLevelCategory === 'FASHION') {
          await Product.updateOne(
            { _id: item.productId, 'fashionVariants.sku': item.sku },
            {
              $inc: {
                'fashionVariants.$.stock': -item.quantity,
                'fashionVariants.$.reservedStock': -item.quantity,
              },
            }
          );
        } else {
          await Product.updateOne(
            { _id: item.productId, 'bakeryVariants.sku': item.sku },
            {
              $inc: {
                'bakeryVariants.$.stock': -item.quantity,
                'bakeryVariants.$.reservedStock': -item.quantity,
              },
            }
          );
        }
      }

      // Record coupon usage
      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode });
        if (coupon) {
          await CouponUsage.create({
            couponId: coupon._id,
            userId: order.userId,
            orderId: order._id,
            discountAmount: order.couponDiscount,
          });
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { totalUsed: 1 } });
        }
      }

      // Clear user cart
      await Cart.updateOne({ userId: req.user!._id }, { $set: { items: [], couponCode: null, couponDiscount: 0, subtotal: 0, tax: 0, shippingFee: 0, grandTotal: 0 } });
    
      // Emit Realtime Order Status & Notification
      socketService.sendNotificationToUser(order.userId.toString(), {
        type: 'ORDER_CONFIRMED',
        title: 'Payment Confirmed',
        message: `Payment received for Order #${order.orderNumber}.`,
        deepLink: `/orders/${order._id}`,
      });
      socketService.emitOrderStatusUpdate(order._id.toString(), order.userId.toString(), order);
      socketService.emitAdminDashboardUpdate('PAYMENT_CONFIRMED', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.grandTotal,
      });

      res.json({ success: true, message: 'Payment verified and order confirmed.', order });
    } else {
      res.json({ success: true, message: 'Payment verified.', order });
    }
  } catch (err) {
    next(err);
  }
});

// â”€â”€â”€ POST /api/payments/webhook â”€â”€â”€ Razorpay webhook (signature verified)
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const rpPaymentId = payload.payment.entity.id;
      const rpOrderId = payload.payment.entity.order_id;

      const payment = await Payment.findOne({ razorpayOrderId: rpOrderId });
      if (!payment || payment.status === 'PAID') {
        return res.json({ success: true, message: 'Already processed.' }); // idempotent
      }

      payment.status = 'PAID';
      payment.razorpayPaymentId = rpPaymentId;
      payment.paidAt = new Date();
      payment.webhookEvents.push({ event, payload, processedAt: new Date() });
      await payment.save();

      // Update order status
      const order = await Order.findById(payment.orderId);
      if (order && order.status === 'PENDING') {
        order.status = 'CONFIRMED';
        order.paymentStatus = 'PAID';
        order.statusHistory.push({
          from: 'PENDING',
          to: 'CONFIRMED',
          changedAt: new Date(),
          actorRole: 'SYSTEM',
          note: 'Payment confirmed via webhook',
        });
        await order.save();

        // Release reserved stock â†’ actual sale
        for (const item of order.items) {
          if (item.topLevelCategory === 'FASHION') {
            await Product.updateOne(
              { _id: item.productId, 'fashionVariants.sku': item.sku },
              {
                $inc: {
                  'fashionVariants.$.stock': -item.quantity,
                  'fashionVariants.$.reservedStock': -item.quantity,
                },
              }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId, 'bakeryVariants.sku': item.sku },
              {
                $inc: {
                  'bakeryVariants.$.stock': -item.quantity,
                  'bakeryVariants.$.reservedStock': -item.quantity,
                },
              }
            );
          }
        }

        // Record coupon usage
        if (order.couponCode) {
          const coupon = await Coupon.findOne({ code: order.couponCode });
          if (coupon) {
            await CouponUsage.create({
              couponId: coupon._id,
              userId: order.userId,
              orderId: order._id,
              discountAmount: order.couponDiscount,
            });
            await Coupon.updateOne({ _id: coupon._id }, { $inc: { totalUsed: 1 } });
          }
        }

        // Clear cart
        await Cart.findOneAndDelete({ userId: order.userId });

        // Send notification + email
        const user = await User.findById(order.userId);
        if (user) {
          await Notification.create({
            userId: order.userId,
            type: 'ORDER_CONFIRMED',
            title: 'Order Confirmed! ðŸŽ‰',
            message: `Your order #${order.orderNumber} has been confirmed.`,
            deepLink: `/orders/${order._id}`,
          });

          const template = emailTemplates.orderConfirmation(user.name, order._id.toString(), order.grandTotal);
          sendEmail({ to: user.email, subject: template.subject, html: template.html }).catch(console.error);
        }
      }
    } else if (event === 'payment.failed') {
      const rpOrderId = payload.payment.entity.order_id;
      const payment = await Payment.findOne({ razorpayOrderId: rpOrderId });
      if (payment) {
        payment.status = 'FAILED';
        payment.failureReason = payload.payment.entity.error_description;
        payment.webhookEvents.push({ event, payload, processedAt: new Date() });
        await payment.save();

        // Release reserved stock
        const order = await Order.findById(payment.orderId);
        if (order) {
          for (const item of order.items) {
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
          order.status = 'CANCELLED';
          order.paymentStatus = 'FAILED';
          await order.save();
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
