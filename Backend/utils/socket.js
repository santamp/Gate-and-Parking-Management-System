const { Server } = require('socket.io');

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

    // Basic socket connection handling
    io.on('connection', (socket) => {
      console.log(`📡 Socket connected: ${socket.id}`);

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
