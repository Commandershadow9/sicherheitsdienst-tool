import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express'; // ErrorRequestHandler importiert
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Import all routes
import { systemRoutes, userRoutes, shiftRoutes, authRoutes } from './routes';

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

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🛡️ Sicherheitsdienst-Tool Backend API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'Running',
    documentation: `/api-docs`,
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      auth: '/api/auth',
      users: '/api/users',
      shifts: '/api/shifts'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Die angeforderte Ressource '${req.originalUrl}' wurde nicht gefunden.`,
  });
});

// Global Error Handler - Explicitly typed with ErrorRequestHandler
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Interner Serverfehler.';
  let errorsArray;

  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        const target = err.meta?.target;
        message = `Ein Eintrag mit diesen Daten existiert bereits (${Array.isArray(target) ? target.join(', ') : target}).`;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Die angeforderte Ressource wurde nicht gefunden.';
        break;
      default:
        statusCode = 400;
        message = 'Ein Datenbankfehler ist aufgetreten.';
        break;
    }
  }

  if (err.name === 'ZodError' && err.errors) {
    statusCode = 400;
    message = 'Validierungsfehler.';
    errorsArray = err.errors;
  }

  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Ungültiger oder abgelaufener Token.';
  }

  const errorResponse: { success: boolean; message: string; errors?: any; errorDetails?: string; stack?: string; code?: string } = {
    success: false,
    message,
  };

  if (errorsArray) {
    errorResponse.errors = errorsArray;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.errorDetails = err.message;
    errorResponse.stack = err.stack;
    if(err.code) errorResponse.code = err.code;
  }

  // Wichtig: Sicherstellen, dass eine Antwort gesendet wird.
  // Wenn bereits Header gesendet wurden (selten im Error Handler, aber möglich), nicht erneut senden.
  if (res.headersSent) {
    return next(err); // Weiterleiten, falls schon gesendet wurde (Fallback)
  }
  res.status(statusCode).json(errorResponse);
};

app.use(globalErrorHandler); // Error Handler hier registrieren

// Graceful Shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await prisma.$disconnect();
    console.log('👋 Prisma disconnected');
  } catch (e) {
    console.error('Error during Prisma disconnect:', e);
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start Server
app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`🛡️  Sicherheitsdienst-Tool Backend`);
  console.log('🚀 ================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log(`   ├─ Welcome:        http://localhost:${PORT}/`);
  console.log(`   ├─ Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`   ├─ System Stats:   http://localhost:${PORT}/api/stats`);
  console.log(`   ├─ Auth API:       http://localhost:${PORT}/api/auth`);
  console.log(`   ├─ Users API:      http://localhost:${PORT}/api/users`);
  console.log(`   └─ Shifts API:     http://localhost:${PORT}/api/shifts`);
  console.log('');
  console.log('🛠️  Development Tools:');
  console.log(`   ├─ Prisma Studio: http://localhost:5555`);
  console.log('🚀 ================================');
});
export default app;
