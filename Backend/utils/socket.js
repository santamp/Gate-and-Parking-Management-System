const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    });

    io.on('connection', (socket) => {
      console.log(`📡 Socket connected: ${socket.id}`);

      try {
        const token = socket.handshake.auth?.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_development_only');
          socket.join(`user_${decoded.id}`);
          if (decoded.role) {
            socket.join(`role_${decoded.role}`);
          }
        }
      } catch (error) {
        console.error('Socket auth room join failed:', error.message);
      }

      // Optional: Join a specific room based on user role or ID
      socket.on('join_unit_room', (unitId) => {
        socket.join(`unit_${unitId}`);
        console.log(`📡 Socket ${socket.id} joined room: unit_${unitId}`);
      });

      socket.on('disconnect', () => {
        console.log(`📡 Socket disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
