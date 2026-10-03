import { getIO } from '../config/socket';

export const socketService = {
  /**
   * Push live notification to a specific user
   */
  sendNotificationToUser: (userId: string, notification: any) => {
    try {
      const io = getIO();
      if (!io) return;
      io.to(`user:${userId}`).emit('notification', notification);
    } catch (err) {
      console.error('Error emitting notification via socket:', err);
    }
  },

  /**
   * Broadcast real-time order status update to order room and user room
   */
  emitOrderStatusUpdate: (orderId: string, userId: string, orderData: any) => {
    try {
      const io = getIO();
      if (!io) return;

      const payload = {
        orderId,
        status: orderData.orderStatus || orderData.status,
        tracking: orderData.tracking,
        updatedAt: new Date().toISOString(),
        order: orderData,
      };

      // Emit to listeners on order detail page
      io.to(`order:${orderId}`).emit('order_status_update', payload);

      // Emit to user's global notification channel
      io.to(`user:${userId}`).emit('order_status_update', payload);
    } catch (err) {
      console.error('Error emitting order status update:', err);
    }
  },

  /**
   * Broadcast product inventory / stock update
   */
  emitInventoryUpdate: (productId: string, stockData: { stockQuantity: number; inStock: boolean }) => {
    try {
      const io = getIO();
      if (!io) return;
      io.to(`product:${productId}`).emit('inventory_update', {
        productId,
        ...stockData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error emitting inventory update:', err);
    }
  },

  /**
   * Broadcast to all connected sellers or a specific seller
   */
  emitSellerAlert: (sellerId: string, event: string, payload: any) => {
    try {
      const io = getIO();
      if (!io) return;
      io.to(`seller:${sellerId}`).emit(event, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error emitting seller alert:', err);
    }
  },

  /**
   * Broadcast real-time dashboard events to admins
   */
  emitAdminDashboardUpdate: (event: string, payload: any) => {
    try {
      const io = getIO();
      if (!io) return;
      io.to('admin').emit(event, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error emitting admin event:', err);
    }
  },

  /**
   * Broadcast new chat message to a chat room
   */
  emitChatMessage: (chatRoomId: string, message: any) => {
    try {
      const io = getIO();
      if (!io) return;
      io.to(`chat:${chatRoomId}`).emit('new_chat_message', message);
    } catch (err) {
      console.error('Error emitting chat message:', err);
    }
  },
};
