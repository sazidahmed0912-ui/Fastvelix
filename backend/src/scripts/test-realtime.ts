import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initSocket } from '../config/socket';
import { socketService } from '../services/socketService';
import { config } from '../config';

const runTest = async () => {
  console.log('🧪 Starting Real-Time WebSocket Server Test...\n');

  // 1. Create Express App & Server
  const app = express();
  const server = http.createServer(app);
  const ioServer = initSocket(server);

  const PORT = 5099;
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Real-time Socket.io test server running on port ${PORT}`);

  // 2. Generate valid JWT Token for test user
  const testUser = {
    id: '65f1234567890abcdef12345',
    _id: '65f1234567890abcdef12345',
    email: 'test.realtime@fastvelix.com',
    role: 'CUSTOMER',
    firstName: 'Realtime',
    lastName: 'Tester',
  };

  const token = jwt.sign(testUser, config.jwt.secret, { expiresIn: '1h' });

  // 3. Connect Real-time Socket Client
  const clientSocket: ClientSocket = Client(`http://localhost:${PORT}`, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timed out')), 5000);
    clientSocket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`✅ Client connected successfully. Socket ID: ${clientSocket.id}`);
      resolve();
    });
  });

  // 4. Test User Room Push Notification
  let notificationReceived = false;
  clientSocket.on('notification', (data) => {
    console.log('📬 Live Notification Received:', data);
    if (data.title === 'Test Real-time Alert') {
      notificationReceived = true;
    }
  });

  // 5. Test Order Tracking Room Updates
  let orderUpdateReceived = false;
  clientSocket.emit('join_order', 'ORDER_TEST_99');

  clientSocket.on('order_status_update', (data) => {
    console.log('📦 Live Order Status Update Received:', data);
    if (data.orderId === 'ORDER_TEST_99' && data.status === 'SHIPPED') {
      orderUpdateReceived = true;
    }
  });

  // Wait 300ms for room join to register
  await new Promise((r) => setTimeout(r, 300));

  // 6. Trigger Backend Service Events
  console.log('\n🚀 Triggering backend socketService broadcasts...');
  socketService.sendNotificationToUser(testUser.id, {
    type: 'SYSTEM',
    title: 'Test Real-time Alert',
    message: 'Real-time WebSocket backend is functioning perfectly!',
  });

  socketService.emitOrderStatusUpdate('ORDER_TEST_99', testUser.id, {
    orderStatus: 'SHIPPED',
    tracking: { carrier: 'Express', trackingNumber: 'TRK123456789' },
  });

  // Wait 1000ms for events to process
  await new Promise((r) => setTimeout(r, 1000));

  // 7. Verification & Teardown
  clientSocket.disconnect();
  server.close();

  if (notificationReceived && orderUpdateReceived) {
    console.log('\n🎉 ALL REAL-TIME TESTS PASSED SUCCESSFULLY! Socket.io server, authentication, rooms, and broadcast functions verified.');
    process.exit(0);
  } else {
    console.error(`❌ REAL-TIME TEST FAILED! notificationReceived: ${notificationReceived}, orderUpdateReceived: ${orderUpdateReceived}`);
    process.exit(1);
  }
};

runTest().catch((err) => {
  console.error('💥 Test error:', err);
  process.exit(1);
});
