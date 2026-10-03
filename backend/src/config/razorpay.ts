import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from './index';

let _razorpay: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!_razorpay) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      throw new Error('Razorpay key_id and key_secret must be set in environment variables.');
    }
    _razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return _razorpay;
};

// Keep backward-compat named export (lazy proxy)
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return (getRazorpay() as any)[prop];
  },
});

export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

export const verifyWebhookSignature = (
  body: string,
  signature: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

export const createRazorpayOrder = async (
  amount: number, // in paise (smallest unit)
  currency = 'INR',
  receipt: string,
  notes: Record<string, string> = {}
) => {
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // convert to paise
    currency,
    receipt,
    notes,
  });
};
