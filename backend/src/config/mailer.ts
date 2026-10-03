import nodemailer from 'nodemailer';
import { config } from './index';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (config.env === 'development' && !config.email.user) {
    console.log(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  await transporter.sendMail({
    from: config.email.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
};

export const emailTemplates = {
  verification: (name: string, url: string) => ({
    subject: 'Verify your FastVelix account',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0A0A0A">Welcome to FastVelix, ${name}!</h2>
        <p>Please verify your email address to get started.</p>
        <a href="${url}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Verify Email</a>
        <p style="color:#6B7280;margin-top:16px;font-size:14px">This link expires in 24 hours.</p>
      </div>
    `,
  }),

  passwordReset: (name: string, url: string) => ({
    subject: 'Reset your FastVelix password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0A0A0A">Password Reset Request</h2>
        <p>Hi ${name}, click the button below to reset your password.</p>
        <a href="${url}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#6B7280;margin-top:16px;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  }),

  orderConfirmation: (name: string, orderId: string, total: number) => ({
    subject: `Order Confirmed — FastVelix #${orderId.slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0A0A0A">Your order is confirmed! 🎉</h2>
        <p>Hi ${name}, thank you for shopping with FastVelix.</p>
        <p><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
        <p><strong>Total:</strong> ₹${total.toLocaleString('en-IN')}</p>
        <a href="${config.frontendUrl}/orders/${orderId}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Track Order</a>
      </div>
    `,
  }),

  orderShipped: (name: string, orderId: string, trackingNumber?: string) => ({
    subject: `Your FastVelix order is on its way! 🚚`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0A0A0A">Your order has been shipped!</h2>
        <p>Hi ${name}, your FastVelix order is on its way.</p>
        ${trackingNumber ? `<p><strong>Tracking:</strong> ${trackingNumber}</p>` : ''}
        <a href="${config.frontendUrl}/orders/${orderId}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Track Order</a>
      </div>
    `,
  }),

  sellerApplicationStatus: (name: string, status: 'APPROVED' | 'REJECTED', reason?: string) => ({
    subject: `FastVelix Seller Application ${status === 'APPROVED' ? 'Approved ✅' : 'Update'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0A0A0A">Seller Application ${status === 'APPROVED' ? 'Approved!' : 'Update'}</h2>
        <p>Hi ${name},</p>
        ${status === 'APPROVED'
          ? `<p>Congratulations! Your seller application has been approved. You can now start listing products on FastVelix.</p>
             <a href="${config.frontendUrl}/seller" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Go to Seller Dashboard</a>`
          : `<p>We regret to inform you that your seller application was not approved at this time.${reason ? ` Reason: ${reason}` : ''}</p>
             <p>You may reapply after addressing the concerns raised.</p>`
        }
      </div>
    `,
  }),
};
