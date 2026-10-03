import https from 'https';
import querystring from 'querystring';
import { sendEmail } from '../config/mailer';
import { User } from '../models/User';
import { Order } from '../models/Order';

// ────────────────────────────────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────────────────────────────────
export interface DeliveryNotificationPayload {
  sellerEmail: string;
  sellerWhatsapp?: string | null;
  sellerName: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerCity: string;
  totalAmount: number;
  itemCount: number;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Send Delivery Email to Seller
// ────────────────────────────────────────────────────────────────────────────
export async function sendSellerDeliveryEmail(payload: DeliveryNotificationPayload): Promise<void> {
  const { sellerEmail, sellerName, orderNumber, orderId, customerName, customerCity, totalAmount, itemCount } = payload;

  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Delivered — FastVelix</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16A34A 0%,#15803D 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">✅ Order Delivered!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Your FastVelix order has been successfully delivered.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#333;font-size:15px;">Hello <strong>${sellerName}</strong>,</p>
              <p style="margin:0 0 28px;color:#555;font-size:14px;line-height:1.7;">
                Great news! Order <strong>#${orderNumber}</strong> placed by <strong>${customerName}</strong> from <strong>${customerCity}</strong> has been <span style="color:#16A34A;font-weight:700;">successfully delivered</span>.
              </p>

              <!-- Order Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6B7280;font-size:13px;">Order Number</span><br/>
                          <span style="color:#111827;font-size:15px;font-weight:600;">#${orderNumber}</span>
                        </td>
                        <td style="padding:6px 0;text-align:right;">
                          <span style="color:#6B7280;font-size:13px;">Total Amount</span><br/>
                          <span style="color:#16A34A;font-size:15px;font-weight:700;">₹${totalAmount.toLocaleString('en-IN')}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6B7280;font-size:13px;">Customer</span><br/>
                          <span style="color:#111827;font-size:14px;">${customerName}</span>
                        </td>
                        <td style="padding:6px 0;text-align:right;">
                          <span style="color:#6B7280;font-size:13px;">Items</span><br/>
                          <span style="color:#111827;font-size:14px;">${itemCount} item${itemCount > 1 ? 's' : ''}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#555;font-size:14px;">Your payout will be processed within <strong>7 business days</strong> as per our seller payment policy.</p>

              <a href="${dashboardUrl}" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
                Go to Seller Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">FastVelix Commerce · support@fastvelix.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: sellerEmail,
    subject: `✅ Order Delivered — #${orderNumber} | FastVelix`,
    html,
  });

  console.log(`[Notification] Delivery email sent to seller ${sellerEmail} for order #${orderNumber}`);
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Send WhatsApp Notification to Seller (via Twilio)
// ────────────────────────────────────────────────────────────────────────────
export async function sendSellerWhatsApp(payload: DeliveryNotificationPayload): Promise<void> {
  const { sellerWhatsapp, orderNumber, customerName, totalAmount, itemCount } = payload;

  if (!sellerWhatsapp) {
    console.log('[Notification] Seller has no WhatsApp number — skipping WhatsApp notification.');
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.warn('[Notification] Twilio credentials not configured — skipping WhatsApp notification.');
    return;
  }

  let toNumber = sellerWhatsapp.replace(/\D/g, '');
  if (!toNumber.startsWith('91') && toNumber.length === 10) {
    toNumber = '91' + toNumber;
  }
  const toWhatsapp = `whatsapp:+${toNumber}`;

  const messageBody = [
    `✅ *Order Delivered — FastVelix*`,
    ``,
    `Order *#${orderNumber}* has been successfully delivered!`,
    ``,
    `👤 Customer: ${customerName}`,
    `📦 Items: ${itemCount}`,
    `💰 Amount: ₹${totalAmount.toLocaleString('en-IN')}`,
    ``,
    `Your payout will be processed within 7 business days.`,
    ``,
    `📊 Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller`,
  ].join('\n');

  const postData = querystring.stringify({
    From: fromNumber,
    To: toWhatsapp,
    Body: messageBody,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.sid) {
            console.log(`[Notification] WhatsApp sent to ${toWhatsapp}. SID: ${parsed.sid}`);
          } else {
            console.error('[Notification] WhatsApp send failed:', parsed);
          }
        } catch {
          // Ignore parse errors
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('[Notification] WhatsApp request error:', err.message);
      resolve(); // Don't block the order update
    });

    req.write(postData);
    req.end();
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Combined: Send Email + WhatsApp
// ────────────────────────────────────────────────────────────────────────────
export async function notifySellerOnDelivery(payload: DeliveryNotificationPayload): Promise<void> {
  const results = await Promise.allSettled([
    sendSellerDeliveryEmail(payload),
    sendSellerWhatsApp(payload),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const channel = i === 0 ? 'Email' : 'WhatsApp';
      console.error(`[Notification] ${channel} failed:`, result.reason);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Main orchestrator — call this from orders route when status = DELIVERED
// ────────────────────────────────────────────────────────────────────────────
export async function handleOrderDeliveredNotification(orderId: string): Promise<void> {
  try {
    console.log(`[Notification] Loading order ${orderId} for seller notifications...`);

    const order = await Order.findById(orderId)
      .populate('userId', 'name')
      .lean();

    if (!order) {
      console.warn(`[Notification] Order ${orderId} not found — skipping seller notification.`);
      return;
    }

    // Collect unique seller IDs from order items
    const sellerIds = [
      ...new Set(
        order.items
          .map((item: any) => item.sellerId?.toString())
          .filter((sid: string | undefined): sid is string => !!sid)
      ),
    ];

    if (sellerIds.length === 0) {
      console.log(`[Notification] No seller linked to order ${orderId} — skipping seller notification.`);
      return;
    }

    const addressSnap = (order as any).deliveryAddress || {};
    const customerCity = addressSnap?.city || 'N/A';
    const customerName = (order.userId as any)?.name || 'Customer';
    const totalAmount = (order as any).grandTotal || (order as any).totalAmount || 0;
    const itemCount = order.items.length;
    const orderNumber = (order as any).orderNumber || orderId.slice(-8).toUpperCase();

    // Fetch seller info
    const sellers = await User.find({ _id: { $in: sellerIds } })
      .select('name email whatsappNumber')
      .lean();

    console.log(`[Notification] Sending delivery notifications to ${sellers.length} seller(s) for order #${orderNumber}...`);

    for (const seller of sellers) {
      await notifySellerOnDelivery({
        sellerEmail: seller.email,
        sellerWhatsapp: (seller as any).whatsappNumber || null,
        sellerName: seller.name || 'Seller',
        orderNumber,
        orderId,
        customerName,
        customerCity,
        totalAmount: Number(totalAmount),
        itemCount,
      });
    }
  } catch (err: any) {
    console.error('[Notification] handleOrderDeliveredNotification failed:', err?.message);
  }
}
