const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
// Import models to establish associations
require('./models/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const subscriptionRoutes = require('./routes/subscriptions');
const vehicleRoutes = require('./routes/vehicles');
const jobRoutes = require('./routes/jobs');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const subscriptionPlanRoutes = require('./routes/subscriptionPlans');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZipSureAI API',
      version: '1.0.0',
      description: 'Fleet operations and job allocation platform API',
      contact: {
        name: 'Dhruv Shridhar',
        email: 'support@zipsure.ai'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Swagger documentation
const swaggerSimpleDocument = require('./swagger-simple.json');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs-simple', swaggerUi.serve, swaggerUi.setup(swaggerSimpleDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ZipSureAI API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticateToken, userRoutes);
app.use('/api/v1/organizations', authenticateToken, organizationRoutes);
app.use('/api/v1/subscriptions', authenticateToken, subscriptionRoutes);
app.use('/api/v1/vehicles', authenticateToken, vehicleRoutes);
app.use('/api/v1/jobs', authenticateToken, jobRoutes);
app.use('/api/v1/payments', authenticateToken, paymentRoutes);
app.use('/api/v1/analytics', authenticateToken, analyticsRoutes);
app.use('/api/v1/subscriptionPlans', authenticateToken, subscriptionPlanRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join organization room
  socket.on('join-organization', (organizationId) => {
    socket.join(`org-${organizationId}`);
  });

  // Handle job notifications
  socket.on('job-assigned', (data) => {
    socket.to(`org-${data.organizationId}`).emit('new-job', data);
  });

  // Handle job status updates
  socket.on('job-status-update', (data) => {
    socket.to(`org-${data.organizationId}`).emit('job-updated', data);
  });

  socket.on('disconnect', () => {
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || '3000';

// Database connection and server start
db.authenticate()
  .then(() => {
    console.log('----------------Database connected successfully');
    // Only sync in development, use migrations in production
    if (process.env.NODE_ENV === 'development') {
      return db.sync({ alter: true }).catch(err => {
        console.warn('----------------Database sync warning (this is normal if tables already exist):', err.message);
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`> server running on port ${PORT}`);
      console.log(`===> API top Documentation: http://localhost:${PORT}/api-docs-simple`);
      console.log(`===> API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`> Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io }; 