import { Router } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { Coupon, CouponUsage } from '../models/Coupon';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

// All cart routes require auth
router.use(authenticate);

const calculateCartTotals = (items: typeof Cart.prototype.items) => {
  const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST flat
  const shippingFee = subtotal >= 499 ? 0 : 49; // Free shipping above ₹499
  return { subtotal, tax, shippingFee, grandTotal: subtotal + tax + shippingFee };
};

// ─── GET /api/cart ─── Get current user's cart
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user!._id })
      .populate('items.productId', 'title thumbnail salePrice totalStock status fashionVariants bakeryVariants');

    if (!cart) {
      return res.json({ success: true, cart: { items: [], subtotal: 0, tax: 0, shippingFee: 0, grandTotal: 0, couponDiscount: 0 } });
    }

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/cart/add ─── Add item to cart
const addItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1).max(10),
  cakeConfiguration: z.object({
    size: z.string().optional(),
    flavour: z.string().optional(),
    style: z.string().optional(),
    colour: z.string().optional(),
    message: z.string().optional(),
    photoUrl: z.string().optional(),
    topper: z.string().optional(),
    decoration: z.string().optional(),
    deliveryDate: z.string().optional(),
    deliverySlot: z.string().optional(),
    additionalNotes: z.string().optional(),
    customPrice: z.number().optional(),
  }).optional(),
});

router.post('/add', validate(addItemSchema), async (req: AuthRequest, res, next) => {
  try {
    const { productId, sku, quantity, cakeConfiguration } = req.body;

    // Validate product
    const product = await Product.findById(productId).lean();
    if (!product || product.status !== 'ACTIVE') {
      return next(new AppError('Product not available.', 404, 'PRODUCT_UNAVAILABLE'));
    }

    let unitPrice: number;
    let size: string | undefined;
    let flavour: string | undefined;
    let isEggless: boolean = false;

    if (product.topLevelCategory === 'FASHION') {
      const variant = product.fashionVariants?.find((v) => v.sku === sku);
      if (!variant) return next(new AppError('Selected variant not found.', 400, 'VARIANT_NOT_FOUND'));
      const available = variant.stock - (variant.reservedStock || 0);
      if (available < quantity) {
        return next(new AppError(`Only ${available} units available for this variant.`, 400, 'INSUFFICIENT_STOCK'));
      }
      unitPrice = variant.price || product.salePrice;
      size = variant.size;
    } else {
      // CAKES_AND_BAKES
      if (cakeConfiguration && cakeConfiguration.customPrice) {
        unitPrice = cakeConfiguration.customPrice;
        size = cakeConfiguration.size;
        flavour = cakeConfiguration.flavour;
      } else {
        const bakeVariant = product.bakeryVariants?.find((v) => v.sku === sku);
        unitPrice = bakeVariant ? bakeVariant.price : product.salePrice;
        size = bakeVariant?.size || product.size;
        flavour = bakeVariant?.flavour || product.flavour;
        isEggless = bakeVariant?.isEggless || product.isEggless || false;
      }
    }

    let cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart) {
      cart = new Cart({ userId: req.user!._id, items: [] });
    }

    // Custom cakes get unique cart entries
    const isCustom = Boolean(cakeConfiguration);
    const existingIdx = isCustom
      ? -1
      : cart.items.findIndex((i) => i.sku === sku && i.productId.toString() === productId);

    if (existingIdx >= 0) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      cart.items[existingIdx].quantity = newQty;
      cart.items[existingIdx].totalPrice = newQty * unitPrice;
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        sellerId: product.sellerId,
        title: product.title,
        thumbnail: product.thumbnail,
        topLevelCategory: product.topLevelCategory,
        sku,
        size,
        flavour,
        isEggless,
        cakeConfiguration: cakeConfiguration || undefined,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      });
    }

    const totals = calculateCartTotals(cart.items);
    Object.assign(cart, totals);

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/cart/item/:sku ─── Update item quantity
router.put('/item/:sku', async (req: AuthRequest, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return next(new AppError('Invalid quantity.', 400, 'INVALID_QUANTITY'));
    }

    const cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart) return next(new AppError('Cart not found.', 404, 'CART_NOT_FOUND'));

    const item = cart.items.find((i) => i.sku === req.params.sku || i._id?.toString() === req.params.sku);
    if (!item) return next(new AppError('Item not in cart.', 404, 'ITEM_NOT_FOUND'));

    item.quantity = quantity;
    item.totalPrice = quantity * item.unitPrice;

    const totals = calculateCartTotals(cart.items);
    Object.assign(cart, totals);

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/cart/item/:itemId ─── Remove item
router.delete('/item/:itemId', async (req: AuthRequest, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart) return next(new AppError('Cart not found.', 404, 'CART_NOT_FOUND'));

    cart.items = cart.items.filter((i) => i.sku !== req.params.itemId && i._id?.toString() !== req.params.itemId);

    const totals = calculateCartTotals(cart.items);
    Object.assign(cart, totals);

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/cart/coupon ─── Apply coupon
router.post('/coupon', async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return next(new AppError('Coupon code is required.', 400, 'MISSING_CODE'));

    const cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Your cart is empty.', 400, 'EMPTY_CART'));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return next(new AppError('Invalid or expired coupon.', 400, 'INVALID_COUPON'));

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return next(new AppError('This coupon is not currently valid.', 400, 'COUPON_EXPIRED'));
    }

    const userUsage = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId: req.user!._id,
    });
    if (userUsage >= coupon.perUserLimit) {
      return next(new AppError('You have already used this coupon.', 400, 'COUPON_ALREADY_USED'));
    }

    if (cart.subtotal < coupon.minOrderValue) {
      return next(new AppError(`Minimum order value of ₹${coupon.minOrderValue} required.`, 400, 'MIN_ORDER_NOT_MET'));
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (cart.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
    discount = Math.round(discount * 100) / 100;

    cart.couponCode = coupon.code;
    cart.couponDiscount = discount;
    cart.grandTotal = Math.max(0, cart.subtotal + cart.tax + cart.shippingFee - discount);

    await cart.save();
    res.json({ success: true, couponDiscount: discount, cart });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/cart/coupon ─── Remove coupon
router.delete('/coupon', async (req: AuthRequest, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user!._id });
    if (!cart) return next(new AppError('Cart not found.', 404, 'CART_NOT_FOUND'));

    cart.couponCode = undefined;
    cart.couponDiscount = 0;

    const totals = calculateCartTotals(cart.items);
    Object.assign(cart, totals);

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/cart ─── Clear cart
router.delete('/', async (req: AuthRequest, res, next) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user!._id });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;
