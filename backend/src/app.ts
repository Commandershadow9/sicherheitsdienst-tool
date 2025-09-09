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
import { systemRoutes, userRoutes, shiftRoutes, authRoutes, siteRoutes, notificationRoutes, eventRoutes, pushRoutes } from './routes';

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
app.use('/api/events', eventRoutes);
app.use('/api/push', pushRoutes);

// API v1 Alias (OpenAPI servers: /api/v1)
app.use('/api/v1', systemRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/sites', siteRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/push', pushRoutes);

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
  let code: string | undefined;

  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        const target = err.meta?.target;
        message = `Ein Eintrag mit diesen Daten existiert bereits (${Array.isArray(target) ? target.join(', ') : target}).`;
        code = 'CONFLICT';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Die angeforderte Ressource wurde nicht gefunden.';
        code = 'NOT_FOUND';
        break;
      default:
        statusCode = 400;
        message = 'Ein Datenbankfehler ist aufgetreten.';
        code = 'BAD_REQUEST';
        break;
    }
  }

  if (err.name === 'ZodError' && err.errors) {
    statusCode = 422;
    message = 'Validierungsfehler.';
    errorsArray = err.errors;
    code = 'VALIDATION_ERROR';
  }

  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Ungültiger oder abgelaufener Token.';
    code = 'UNAUTHORIZED';
  }

  const errorResponse: {
    success: boolean;
    message: string;
    errors?: any;
    details?: string;
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
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
    if (!code && err.code) errorResponse.code = String(err.code);
  }

  // Mappe generische Codes für bekannte Status, falls kein spezifischer Code gesetzt wurde
  if (!errorResponse.code) {
    switch (statusCode) {
      case 400:
        errorResponse.code = 'BAD_REQUEST';
        break;
      case 401:
        errorResponse.code = 'UNAUTHORIZED';
        break;
      case 403:
        errorResponse.code = 'FORBIDDEN';
        break;
      case 404:
        errorResponse.code = 'NOT_FOUND';
        break;
      case 409:
        errorResponse.code = 'CONFLICT';
        break;
      case 422:
        errorResponse.code = 'VALIDATION_ERROR';
        break;
      case 429:
        errorResponse.code = 'TOO_MANY_REQUESTS';
        break;
      case 503:
        errorResponse.code = 'SERVICE_UNAVAILABLE';
        break;
      default:
        errorResponse.code = 'INTERNAL_SERVER_ERROR';
    }
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
