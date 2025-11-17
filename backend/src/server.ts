import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import customerRoutes from './routes/customer.routes';
import salesRoutes from './routes/sales.routes';
import prescriptionRoutes from './routes/prescription.routes';
import path from 'path';






// Import routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PharmaERP API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 PharmaERP Backend Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server running on: http://localhost:${PORT}
🏥 API Base URL: http://localhost:${PORT}/api
✅ Health check: http://localhost:${PORT}/health
  `);
});

export default app;
