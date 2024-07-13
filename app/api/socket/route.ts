import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseServerIO } from '../../../types/next';
import { verify } from 'jsonwebtoken';

let io: SocketIOServer;

export function GET(req: Request, res: NextApiResponseServerIO) {
  if (!io) {
    console.log('Socket is initializing');
    io = new SocketIOServer((res as any).socket.server, {
      cors: {
        origin: '*', // Allow all origins, adjust as needed
        methods: ['GET', 'POST'],
      },
    });

    io.use((socket, next) => {
      const token = socket.handshake.query.token as string;
      if (token) {
        verify(token, process.env.JWT_SECRET!, (err, decoded) => {
          if (err) {
            console.error('Token verification error:', err);
            return next(new Error('Authentication error'));
          }
          socket.data.user = decoded;
          next();
        });
      } else {
        console.error('Authentication error: No token provided');
        next(new Error('Authentication error: No token provided'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.user.id}`);

      socket.on('ping', (data) => {
        if (data.to === 'all') {
          socket.broadcast.emit('notification', { from: socket.data.user.id, message: 'Ping!' });
        } else {
          io.to(data.to).emit('notification', { from: socket.data.user.id, message: 'Ping!' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user.id}`);
      });
    });

    (res as any).socket.server.io = io;
  } else {
    console.log('Socket is already running');
  }

  return new Response('Socket is running');
}
