import 'express-async-errors';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { config, isAllowedOrigin } from './config';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter, readLimiter } from './middleware/rateLimit';
import { AppError } from './utils/AppError';
import { initDefaultUsers } from './utils/initDefaultUsers';

import path from 'path';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import checkoutRoutes from './routes/checkout';
import sellerRoutes from './routes/seller';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import cakeOptionRoutes from './routes/cakeOptions';
import customCakeRoutes from './routes/customCakes';
import deliverySlotRoutes from './routes/deliverySlots';
import walletRoutes from './routes/wallet';
import couponRoutes from './routes/coupons';
import referralRoutes from './routes/referrals';

const app = express();
const server = http.createServer(app);

// Render terminates TLS and forwards the request, so without this every
// req.ip resolved to Render's proxy rather than the shopper's. All visitors
// then shared a single rate-limit bucket and the store returned 429 for
// everyone within minutes of going live. Trusting exactly one hop reads the
// client address from X-Forwarded-For, and also makes req.protocol report https
// so the SameSite=None session cookie is treated as secure.
app.set('trust proxy', 1);

// Serve static uploaded cake photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Realtime Socket.io Server
initSocket(server);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com', 'https://lh3.googleusercontent.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'http://localhost:5000', 'http://127.0.0.1:5000', 'ws://localhost:5000', 'wss://localhost:5000'],
      frameSrc: ["'self'", 'https://api.razorpay.com'],
    },
  },
}));

// Origins are explicitly allowlisted. Because the session cookie is now
// SameSite=None it travels on cross site requests, so this allowlist is also
// what stops another website from riding a logged in user's session. A blocked
// origin is rejected outright instead of silently losing the CORS headers,
// which keeps the request from ever reaching the routes below.
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new AppError(`Origin not allowed by CORS policy: ${origin}`, 403, 'CORS_BLOCKED'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Webhook endpoint needs raw body for signature verification
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookie.secret));
app.use(mongoSanitize()); // Prevent NoSQL injection

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Mounted in order: readLimiter counts GET/HEAD/OPTIONS, apiLimiter skips them,
// so each request is only charged to the budget that suits it.
app.use('/api', readLimiter, apiLimiter);

// ─── Health Check & Root Route ────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'FastVelix E-Commerce API',
    version: '1.0.0',
    status: 'online',
    realtime: 'enabled',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'FastVelix API is running.',
    realtime: 'Socket.io Active',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cake-options', cakeOptionRoutes);
app.use('/api/custom-cakes', customCakeRoutes);
app.use('/api/delivery', deliverySlotRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/referrals', referralRoutes);

// ─── Wishlist, Reviews, Notifications (inline for brevity, could be separate files)
// Wishlist
const wishlistRouter = express.Router();
wishlistRouter.use(require('./middleware/auth').authenticate);
wishlistRouter.get('/', async (req: any, res: any, next: any) => {
  const { Wishlist } = require('./models/Wishlist');
  const userId = req.user?._id;
  const wishlist = await Wishlist.findOne({ userId }).populate('items.productId', 'title thumbnail salePrice basePrice discount ratings status');
  res.json({ success: true, wishlist: wishlist || { items: [] } });
});
wishlistRouter.post('/toggle', async (req: any, res: any, next: any) => {
  const { Wishlist } = require('./models/Wishlist');
  const userId = req.user?._id;
  const { productId } = req.body;
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) wishlist = new Wishlist({ userId, items: [] });
  const idx = wishlist.items.findIndex((i: { productId: { toString: () => string } }) => i.productId.toString() === productId);
  if (idx >= 0) {
    wishlist.items.splice(idx, 1);
    await wishlist.save();
    return res.json({ success: true, action: 'removed' });
  }
  wishlist.items.push({ productId, addedAt: new Date() });
  await wishlist.save();
  res.json({ success: true, action: 'added' });
});
app.use('/api/wishlist', wishlistRouter);

// Notifications
const notifRouter = express.Router();
notifRouter.use(require('./middleware/auth').authenticate);
notifRouter.get('/', async (req: any, res: any) => {
  const { Notification } = require('./models/Notification');
  const userId = req.user?._id;
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  res.json({ success: true, notifications, unreadCount });
});
notifRouter.put('/read-all', async (req: any, res: any) => {
  const { Notification } = require('./models/Notification');
  const userId = req.user?._id;
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  res.json({ success: true });
});
app.use('/api/notifications', notifRouter);

// Categories (public)
const categoryRouter = express.Router();
categoryRouter.get('/', async (req: any, res: any, next: any) => {
  const { Category } = require('./models/Category');
  const { topLevelCategory } = req.query;
  const filter: Record<string, unknown> = { isActive: true };
  if (topLevelCategory) filter.topLevelCategory = (topLevelCategory as string).toUpperCase();
  const categories = await Category.find(filter).sort({ sortOrder: 1 }).lean();
  res.json({ success: true, categories });
});
app.use('/api/categories', categoryRouter);

// Homepage sections (public)
const homepageRouter = express.Router();
homepageRouter.get('/sections', async (req: any, res: any) => {
  const { HomepageSection } = require('./models/HomepageSection');
  const { topLevelCategory } = req.query;
  const now = new Date();
  const filter: Record<string, unknown> = {
    isActive: true,
    $or: [{ startDate: { $lte: now } }, { startDate: null }],
    $and: [{ $or: [{ endDate: { $gte: now } }, { endDate: null }] }],
  };
  if (topLevelCategory) {
    filter.topLevelCategory = { $in: [(topLevelCategory as string).toUpperCase(), 'ALL'] };
  }
  const sections = await HomepageSection.find(filter)
    .populate('content.productIds', 'title thumbnail salePrice basePrice discount ratings slug topLevelCategory')
    .sort({ sortOrder: 1 })
    .lean();
  res.json({ success: true, sections });
});
app.use('/api/homepage', homepageRouter);

// Seller application (public form for non-sellers)
const sellerApplyRouter = express.Router();
sellerApplyRouter.use(require('./middleware/auth').authenticate);
sellerApplyRouter.post('/apply', async (req: any, res: any, next: any) => {
  const { SellerApplication } = require('./models/Seller');
  const userId = req.user?._id;
  const existing = await SellerApplication.findOne({ userId });
  if (existing) return res.status(409).json({ success: false, code: 'APPLICATION_EXISTS', message: 'You have already submitted an application.' });
  const application = await SellerApplication.create({ ...req.body, userId });
  res.status(201).json({ success: true, application });
});
app.use('/api/seller-application', sellerApplyRouter);

// ─── 404 + Error Handler ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await initDefaultUsers();

  server.listen(config.port, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║     🚀 FastVelix API Server Ready     ║
    ║     ⚡ Real-time Socket.io Active      ║
    ╚═══════════════════════════════════════╝
    Environment : ${config.env}
    Port        : ${config.port}
    Frontend    : ${config.frontendUrl}
    `);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

