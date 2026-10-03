import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import os from 'os';
import { config } from './index';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      _id: string;
      id: string;
      email: string;
      role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPER_ADMIN';
      firstName?: string;
      lastName?: string;
    };
  };
}

let io: Server | null = null;

/**
 * Broadcast a log message to all connected admin monitors (from Fzokart)
 */
export const broadcastLog = (
  type: 'info' | 'warning' | 'error' | 'success',
  message: string,
  source: string = 'System'
) => {
  if (io) {
    io.to('admin-monitor').emit('monitor:log', {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      source,
    });
  }
};

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.frontendUrl) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware for Socket Authentication via JWT
  io.use((socket: Socket, next) => {
    try {
      const authSocket = socket as AuthenticatedSocket;
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token as string;
      }

      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        // Allow anonymous sockets for public product stock views, but mark unauthenticated
        return next();
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      authSocket.data.user = {
        _id: decoded.id || decoded._id,
        id: decoded.id || decoded._id,
        email: decoded.email,
        role: decoded.role || 'CUSTOMER',
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };

      next();
    } catch (err) {
      console.warn('Socket Auth Warning:', (err as Error).message);
      // Proceed unauthenticated rather than breaking connection (allows public product live rooms)
      next();
    }
  });

  // ─── Admin Monitor Room ──────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.data.user;

    if (user) {
      // Auto-join personal user room
      const userRoom = `user:${user._id}`;
      socket.join(userRoom);

      // Join seller room if seller
      if (user.role === 'SELLER') {
        socket.join(`seller:${user._id}`);
      }

      // Join admin room if admin
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        socket.join('admin');
      }

      console.log(`⚡ Realtime Client Connected: User ${user.email} (${user.role}) [Socket ID: ${socket.id}]`);
    } else {
      console.log(`⚡ Realtime Client Connected: Anonymous Guest [Socket ID: ${socket.id}]`);
    }

    // ─── Join Admin Monitor Room ────────────────────────────────────────────
    socket.on('join_monitor', () => {
      socket.join('admin-monitor');
      console.log(`[Monitor] Admin socket ${socket.id} joined admin-monitor room`);
    });

    // ─── Order Tracking Rooms ────────────────────────────────────────────────
    socket.on('join_order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`Socket ${socket.id} joined room order:${orderId}`);
        socket.emit('joined_room', { room: `order:${orderId}`, success: true });
      }
    });

    socket.on('leave_order', (orderId: string) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`Socket ${socket.id} left room order:${orderId}`);
      }
    });

    // ─── Live Inventory & Product Rooms ────────────────────────────────────
    socket.on('join_product', (productId: string) => {
      if (productId) {
        socket.join(`product:${productId}`);
        socket.emit('joined_room', { room: `product:${productId}`, success: true });
      }
    });

    socket.on('leave_product', (productId: string) => {
      if (productId) {
        socket.leave(`product:${productId}`);
      }
    });

    // ─── Live Support & Chat Rooms ──────────────────────────────────────────
    socket.on('join_chat', (chatRoomId: string) => {
      if (chatRoomId) {
        socket.join(`chat:${chatRoomId}`);
        console.log(`Socket ${socket.id} joined chat:${chatRoomId}`);
        socket.emit('joined_room', { room: `chat:${chatRoomId}`, success: true });
      }
    });

    socket.on('leave_chat', (chatRoomId: string) => {
      if (chatRoomId) {
        socket.leave(`chat:${chatRoomId}`);
      }
    });

    socket.on('typing_start', ({ chatRoomId, userName }: { chatRoomId: string; userName: string }) => {
      socket.to(`chat:${chatRoomId}`).emit('user_typing', { chatRoomId, userName, isTyping: true });
    });

    socket.on('typing_stop', ({ chatRoomId }: { chatRoomId: string }) => {
      socket.to(`chat:${chatRoomId}`).emit('user_typing', { chatRoomId, isTyping: false });
    });

    // ─── Disconnect Listener ────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      if (user) {
        console.log(`🔌 Realtime Client Disconnected: User ${user.email} (${reason})`);
      } else {
        console.log(`🔌 Realtime Client Disconnected: Guest (${reason})`);
      }
    });
  });

  // ─── Admin Monitor Loop: System Stats every 2 seconds (from Fzokart) ────
  setInterval(async () => {
    const activeUsers = io!.engine.clientsCount;
    const uptime = process.uptime();

    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const load =
      cpus.length > 0
        ? (cpus[0].times.user / (cpus[0].times.user + cpus[0].times.idle)) * 100
        : 0;

    // Active users with geolocation from last 24h
    let activeUserList: any[] = [];
    try {
      const { User } = await import('../models/User');
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      activeUserList = await User.find({
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
        lastLocationUpdate: { $gte: twentyFourHoursAgo },
      })
        .select('name email latitude longitude city country countryCode')
        .lean();
    } catch { /* DB might not be ready */ }

    io!.to('admin-monitor').emit('monitor:stats', {
      activeUsers,
      serverLoad: Math.round(load) || Math.floor(Math.random() * 20) + 5,
      memoryUsage: memPercentage,
      uptime: Math.floor(uptime),
      systemStatus: memPercentage > 90 ? 'Critical' : 'Operational',
      activeUserList,
    });
  }, 2000);

  return io;
};

export const getIO = (): Server | null => {
  return io;
};
