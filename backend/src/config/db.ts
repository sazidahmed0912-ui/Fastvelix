import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    try {
      const conn = await mongoose.connect(config.db.uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (primaryErr: any) {
      console.warn(`⚠️ Primary MongoDB connection failed (${primaryErr.message}). Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/fastvelix)...`);
      const localUri = 'mongodb://127.0.0.1:27017/fastvelix';
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log(`✅ Local MongoDB fallback connected: ${conn.connection.host}`);
    }

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Retrying...');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
      isConnected = false;
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  console.log('MongoDB disconnected.');
};
