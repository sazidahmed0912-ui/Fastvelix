import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from './env';

// The bare origin, not the /api value. socket.io resolves its handshake
// relative to whatever it is given, so passing ".../api" made it request
// /api/socket.io/ and every realtime connection returned 404 in production.
const BACKEND_URL = API_ORIGIN;

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
