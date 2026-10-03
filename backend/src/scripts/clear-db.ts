import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Seller, SellerApplication } from '../models/Seller';
import { Payment } from '../models/Payment';
import { Refund } from '../models/Refund';
import { Review } from '../models/Review';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import { Coupon } from '../models/Coupon';

const clearDB = async () => {
  await connectDB();
  console.log('🧹 Clearing MongoDB orders, products, sellers, refunds, reviews, and logs...');

  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
    Seller.deleteMany({}),
    SellerApplication.deleteMany({}),
    Payment.deleteMany({}),
    Refund.deleteMany({}),
    Review.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  console.log('✅ MongoDB data cleared. Only Admin user preserved.');
  process.exit(0);
};

clearDB().catch((err) => {
  console.error('Error clearing database:', err);
  process.exit(1);
});
