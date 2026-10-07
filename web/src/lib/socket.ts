import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  const token = getAuthToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket) {
    socket = io({
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  return socket;
};

export const joinLocationRoom = (location: string) => {
  const s = getSocket();
  if (s) {
    s.emit('join:location', location);
  }
};

export const leaveLocationRoom = (location: string) => {
  const s = getSocket();
  if (s) {
    s.emit('leave:location', location);
  }
};
