import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.MOBILE_APP_URL || 'http://localhost:19000'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sicherheitsdienst-Tool Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);

// Future routes will be added here
// app.use('/api/auth', authRoutes);
// app.use('/api/shifts', shiftRoutes);
// app.use('/api/time-entries', timeEntryRoutes);
// app.use('/api/incidents', incidentRoutes);

// 404 handler for unmatched routes - this should come after all defined routes
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: 'Die angeforderte Ressource wurde nicht gefunden.' 
  });
});

// Error handling middleware - catches errors from routes if next(err) is called
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('👋 Prisma disconnected');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});

export default app;