import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = async (token: string): Promise<Socket> => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot initialize socket on server side');
  }

  if (!socket) {
    const io = (await import('socket.io-client')).default;
    socket = io('/', {
      path: '/api/socket',
      query: { token },
      transports: ['websocket', 'polling'], // Ensure both transports are enabled
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket Error:', error);
    });

    socket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect');
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
