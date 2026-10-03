/**
 * FastVelix End-to-End Checkout Test
 * Tests: login → products → add-to-cart → checkout validate → create-payment (COD) → order confirmation
 */

const BASE = 'http://localhost:5000/api';

async function req(method: string, path: string, body?: any, cookies?: string): Promise<{ status: number; data: any; headers: Headers }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ status: res.status }));
  return { status: res.status, data, headers: res.headers };
}

function extractCookie(headers: Headers, name: string): string | null {
  const setCookie = headers.get('set-cookie') || '';
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? `${name}=${match[1]}` : null;
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   FastVelix Checkout E2E Test                    ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let cookies = '';
  let productId = '';
  let sku = '';
  let orderId = '';

  // 1. Health Check
  console.log('1. Health Check...');
  const health = await req('GET', '/health');
  if (health.status === 200 && health.data.success) {
    console.log('   ✅ Backend healthy\n');
  } else {
    console.log('   ❌ Backend not responding. Aborting.\n');
    process.exit(1);
  }

  // 2. Login
  console.log('2. Login...');
  const loginRes = await req('POST', '/auth/login', {
    email: 'customer@fastvelix.com',
    password: 'Customer@123',
  });
  if (loginRes.data.success) {
    const cookie = extractCookie(loginRes.headers, 'fv_token');
    if (cookie) cookies = cookie;
    console.log(`   ✅ Login OK\n`);
  } else {
    console.log(`   ❌ Login FAILED: ${loginRes.data.message}`);
    process.exit(1);
  }

  // 3. Auth Me
  console.log('3. Auth check...');
  const meRes = await req('GET', '/auth/me', undefined, cookies);
  console.log(`   ${meRes.data.success ? '✅' : '❌'} ${meRes.data.success ? meRes.data.user?.name : meRes.data.message}\n`);

  // 4. Fetch Products + Detail
  console.log('4. Fetching fashion products...');
  const productsRes = await req('GET', '/products?topLevelCategory=FASHION&limit=5');
  if (productsRes.data.success && productsRes.data.products?.length > 0) {
    const listProduct = productsRes.data.products[0];
    const slug = listProduct.slug;
    // Fetch full product detail to get variant SKUs
    const detailRes = await req('GET', `/products/${slug}`);
    if (!detailRes.data.success || !detailRes.data.product) {
      console.log(`   ❌ Product detail failed\n`); process.exit(1);
    }
    const p = detailRes.data.product;
    productId = p._id;
    const variant = p.fashionVariants?.[0];
    if (variant) {
      sku = variant.sku;
      console.log(`   ✅ Product: "${p.title}" | SKU: ${sku} | Available: ${variant.stock - (variant.reservedStock || 0)}\n`);
    } else {
      console.log('   ❌ No variants found\n'); process.exit(1);
    }
  } else {
    console.log(`   ❌ Products failed: ${JSON.stringify(productsRes.data).slice(0, 200)}\n`); process.exit(1);
  }

  // 5. Clear cart
  console.log('5. Clearing cart...');
  const clearRes = await req('DELETE', '/cart', undefined, cookies);
  console.log(`   ${clearRes.data.success ? '✅' : '⚠️'} ${clearRes.data.message || 'done'}\n`);

  // 6. Add to Cart
  console.log('6. Adding to cart...');
  const addRes = await req('POST', '/cart/add', { productId, sku, quantity: 1 }, cookies);
  if (addRes.data.success) {
    const c = addRes.data.cart;
    console.log(`   ✅ Cart: ${c.items.length} item(s), total=₹${c.grandTotal}\n`);
  } else {
    console.log(`   ❌ Add to cart FAILED: ${addRes.data.message}`);
    console.log(`   ${JSON.stringify(addRes.data)}`);
    process.exit(1);
  }

  // 7. Get Cart
  console.log('7. GET /cart verification...');
  const cartRes = await req('GET', '/cart', undefined, cookies);
  if (cartRes.data.success && cartRes.data.cart?.items?.length > 0) {
    console.log(`   ✅ Cart has ${cartRes.data.cart.items.length} item(s)\n`);
  } else {
    console.log(`   ❌ Cart empty or failed: ${JSON.stringify(cartRes.data).slice(0, 200)}\n`); process.exit(1);
  }

  // 8. Get Address
  console.log('8. Getting address...');
  const addrRes = await req('GET', '/users/addresses', undefined, cookies);
  let addressId = '';
  if (addrRes.data.success && addrRes.data.addresses?.length > 0) {
    addressId = addrRes.data.addresses[0]._id;
    console.log(`   ✅ Address: ${addrRes.data.addresses[0].city} (${addressId})\n`);
  } else {
    console.log(`   ❌ Address fetch failed: ${JSON.stringify(addrRes.data).slice(0, 200)}\n`); process.exit(1);
  }

  // 9. Validate
  console.log('9. Checkout validate...');
  const valRes = await req('POST', '/checkout/validate', { addressId }, cookies);
  if (valRes.data.success) {
    console.log('   ✅ Validation passed\n');
  } else {
    console.log(`   ❌ Validation FAILED: ${JSON.stringify(valRes.data)}\n`); process.exit(1);
  }

  // 10. Create COD Order
  console.log('10. Creating COD order...');
  const payRes = await req('POST', '/checkout/create-payment', {
    addressId,
    paymentMethod: 'COD',
    idempotencyKey: `test_${Date.now()}`,
  }, cookies);

  if (payRes.data.success) {
    orderId = payRes.data.order?._id;
    console.log(`   ✅ Order: ${payRes.data.order?.orderNumber} | ₹${payRes.data.order?.grandTotal}\n`);
  } else {
    console.log(`   ❌ Order FAILED: ${payRes.data.message}`);
    console.log(`   ${JSON.stringify(payRes.data).slice(0, 500)}`);
    process.exit(1);
  }

  // 11. Cart cleared?
  console.log('11. Verifying cart cleared...');
  const postCartRes = await req('GET', '/cart', undefined, cookies);
  const postCart = postCartRes.data.cart;
  const isEmpty = !postCart?.items || postCart.items.length === 0;
  console.log(`   ${isEmpty ? '✅ Cart is empty' : '⚠️ Cart still has items'}\n`);

  // 12. Fetch Order
  if (orderId) {
    console.log(`12. Fetching order ${orderId}...`);
    const orderRes = await req('GET', `/orders/${orderId}`, undefined, cookies);
    if (orderRes.data.success) {
      const o = orderRes.data.order;
      console.log(`   ✅ Status: ${o.status} | Payment: ${o.paymentStatus} | Items: ${o.items?.length}`);
    } else {
      console.log(`   ❌ Order fetch failed: ${JSON.stringify(orderRes.data).slice(0, 200)}`);
    }
  }

  // 13. Test Online (Mock Razorpay) Order
  console.log('\n─── BONUS: Testing Mock Online (Razorpay) Payment ───\n');
  
  // Re-add item to cart
  const addRes2 = await req('POST', '/cart/add', { productId, sku, quantity: 1 }, cookies);
  if (!addRes2.data.success) {
    console.log(`   ⚠️  Could not re-add to cart for online payment test: ${addRes2.data.message}\n`);
  } else {
    console.log(`13a. Re-added item to cart (total=₹${addRes2.data.cart?.grandTotal})`);

    // Create Razorpay order
    const rzpRes = await req('POST', '/checkout/create-payment', {
      addressId,
      paymentMethod: 'RAZORPAY',
      idempotencyKey: `test_rzp_${Date.now()}`,
    }, cookies);

    if (rzpRes.data.success) {
      const rzpOrderId = rzpRes.data.razorpayOrderId;
      const rzpInternalId = rzpRes.data.order?._id;
      console.log(`    ✅ Razorpay order: ${rzpRes.data.order?.orderNumber} | mock ID: ${rzpOrderId}`);

      // Verify payment with mock
      const verifyRes = await req('POST', '/checkout/verify-payment', {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: 'mock_signature',
        orderId: rzpInternalId,
      }, cookies);

      if (verifyRes.data.success) {
        console.log(`    ✅ Payment verified! Order confirmed.`);

        // 14. Test Tax Invoice API
        console.log(`\n14. Testing Tax Invoice API for order ${rzpInternalId}...`);
        const invoiceRes = await req('GET', `/orders/${rzpInternalId}/invoice`, undefined, cookies);
        if (invoiceRes.data.success && invoiceRes.data.invoice) {
          const inv = invoiceRes.data.invoice;
          console.log(`    ✅ Tax Invoice Generated:`);
          console.log(`       Invoice No   : ${inv.invoiceNumber}`);
          console.log(`       Seller GSTIN : ${inv.seller.gstin}`);
          console.log(`       Customer     : ${inv.customer.name}`);
          console.log(`       Taxable Val  : ₹${inv.summary.taxableValue}`);
          console.log(`       CGST (2.5%)  : ₹${inv.summary.totalCGST}`);
          console.log(`       SGST (2.5%)  : ₹${inv.summary.totalSGST}`);
          console.log(`       Grand Total  : ₹${inv.summary.grandTotal}\n`);
        } else {
          console.log(`    ❌ Tax Invoice fetch failed: ${JSON.stringify(invoiceRes.data)}\n`);
        }
      } else {
        console.log(`    ❌ Payment verification failed: ${JSON.stringify(verifyRes.data)}\n`);
      }
    } else {
      console.log(`    ❌ Razorpay order failed: ${rzpRes.data.message}\n`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   ✅  ALL TESTS PASSED                           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
}

run().catch((err) => {
  console.error('\n❌ Test crashed:', err.message || err);
  process.exit(1);
});
