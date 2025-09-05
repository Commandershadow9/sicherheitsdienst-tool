import express, { Request, Response, ErrorRequestHandler } from 'express'; // ErrorRequestHandler importiert
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Import all routes
import { systemRoutes, userRoutes, shiftRoutes, authRoutes, siteRoutes, notificationRoutes } from './routes';

const app = express();
// Port-Konstante wird hier nicht benötigt (Server-Start in server.ts)

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.MOBILE_APP_URL || 'http://localhost:19000',
    ],
    credentials: true,
  }),
);
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }),
);
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
      shifts: '/api/shifts',
      sites: '/api/sites',
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Die angeforderte Ressource '${req.originalUrl}' wurde nicht gefunden.`,
  });
});

// Global Error Handler - Explicitly typed with ErrorRequestHandler
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('🚨 Global Error Handler: %o', err);

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
    statusCode = 422;
    message = 'Validierungsfehler.';
    errorsArray = err.errors;
  }

  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Ungültiger oder abgelaufener Token.';
  }

  const errorResponse: {
    success: boolean;
    message: string;
    errors?: any;
    errorDetails?: string;
    stack?: string;
    code?: string;
  } = {
    success: false,
    message,
  };

  if (errorsArray) {
    errorResponse.errors = errorsArray;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.errorDetails = err.message;
    errorResponse.stack = err.stack;
    if (err.code) errorResponse.code = err.code;
  }

  // Wichtig: Sicherstellen, dass eine Antwort gesendet wird.
  // Wenn bereits Header gesendet wurden (selten im Error Handler, aber möglich), nicht erneut senden.
  if (res.headersSent) {
    return next(err); // Weiterleiten, falls schon gesendet wurde (Fallback)
  }
  res.status(statusCode).json(errorResponse);
};

app.use(globalErrorHandler); // Error Handler hier registrieren
export default app;
