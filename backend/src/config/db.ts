import mongoose from 'mongoose';
import { config } from './index';
import { AppError } from '../utils/AppError';

let isConnected = false;

export interface ConnectOptions {
  /**
   * Whether a failed Atlas connection may fall back to a stray local mongod.
   *
   * Defaults to true, which is a reasonable convenience when running the dev
   * server. Pass false for anything destructive. The seeder's first act is to
   * empty a dozen collections, so silently retargeting it at 127.0.0.1 would
   * wipe the developer's local data and then report success while the real
   * database stayed empty. A loud failure is the only safe outcome there.
   */
  allowLocalFallback?: boolean;
}

export const connectDB = async (options: ConnectOptions = {}): Promise<void> => {
  if (isConnected) return;

  const { allowLocalFallback = true } = options;

  try {
    try {
      const conn = await mongoose.connect(config.db.uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (primaryErr: any) {
      // The local fallback only makes sense on a developer machine, where a
      // stray local mongod is a reasonable safety net. In production there is
      // no local mongod, so retrying would burn five extra seconds and print a
      // misleading "fallback" warning before dying anyway. Rethrow instead so
      // the log names the actual connection failure.
      if (config.env === 'production') {
        throw primaryErr;
      }

      if (!allowLocalFallback) {
        throw new AppError(
          `Refusing to fall back to a local MongoDB: ${primaryErr.message}. ` +
            'This operation targets the configured database, so it must not be ' +
            'silently retargeted at 127.0.0.1. Check MONGODB_URI.'
        );
      }

      console.warn(`⚠️ Primary MongoDB connection failed (${primaryErr.message}). Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/fastvelix)...`);
      const localUri = 'mongodb://127.0.0.1:27017/fastvelix';
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log(`✅ Local MongoDB fallback connected: ${conn.connection.host}/${conn.connection.name}`);
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
