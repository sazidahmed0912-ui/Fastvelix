'use client';

import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, getSocket } from '../lib/socket';

export interface UseSocketOptions {
  token?: string;
  autoConnect?: boolean;
  orderId?: string;
  productId?: string;
  chatRoomId?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { token, autoConnect = true, orderId, productId, chatRoomId } = options;
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const s = connectSocket(token);
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [token, autoConnect]);

  // Handle joining specific rooms (Order live tracking, Product stock, Chat room)
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (orderId) {
      socket.emit('join_order', orderId);
    }
    if (productId) {
      socket.emit('join_product', productId);
    }
    if (chatRoomId) {
      socket.emit('join_chat', chatRoomId);
    }

    return () => {
      if (orderId) socket.emit('leave_order', orderId);
      if (productId) socket.emit('leave_product', productId);
      if (chatRoomId) socket.emit('leave_chat', chatRoomId);
    };
  }, [socket, isConnected, orderId, productId, chatRoomId]);

  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    const s = getSocket();
    s.on(event, callback);
    return () => {
      s.off(event, callback);
    };
  }, []);

  return {
    socket,
    isConnected,
    emit,
    subscribe,
  };
}
