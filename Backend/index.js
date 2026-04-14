// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// require('dotenv').config();
// const connectDB = require('./config/db');

// // Connect Database
// connectDB();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(morgan('dev'));
// app.use(express.json());

// // Set static folder for uploads
// app.use('/uploads', express.static('uploads'));

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const warehouseRoutes = require('./routes/warehouseRoutes');
// const gateRoutes = require('./routes/gateRoutes');
// const billingRoutes = require('./routes/billingRoutes');
// const adminRoutes = require('./routes/adminRoutes');

// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/warehouse', warehouseRoutes);
// app.use('/api/v1/gate', gateRoutes);
// app.use('/api/v1/billing', billingRoutes);
// app.use('/api/v1/admin', adminRoutes);

// app.get('/', (req, res) => {
//   res.send('Gate and Parking Management System API is running');
// });

// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'UP',
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString()
//   });
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });






const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ================= CORS (ALLOW ALL) =================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ===================================================

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Static folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/warehouse', require('./routes/warehouseRoutes'));
app.use('/api/v1/gate', require('./routes/gateRoutes'));
app.use('/api/v1/billing', require('./routes/billingRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// Root route
app.get('/', (req, res) => {
  res.send('Gate and Parking Management System API is running');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);

// Initialize Socket.io
require('./utils/socket').init(server);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
