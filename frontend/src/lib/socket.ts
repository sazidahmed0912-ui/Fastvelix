import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });
  } else if (token) {
    socket.auth = { token: `Bearer ${token}` };
  }

  return socket;
};

export const connectSocket = (token?: string): Socket => {
  const s = getSocket(token);
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
