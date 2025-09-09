import app from './app';
import logger from './utils/logger';
import prisma from './utils/prisma';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info('🚀 ================================');
  logger.info('🛡️  Sicherheitsdienst-Tool Backend');
  logger.info('🚀 ================================');
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('');
  logger.info('📍 Available Endpoints:');
  logger.info(`   ├─ Welcome:        http://localhost:${PORT}/`);
  logger.info(`   ├─ Health Check:   http://localhost:${PORT}/api/health`);
  logger.info(`   ├─ System Stats:   http://localhost:${PORT}/api/stats`);
  logger.info(`   ├─ Auth API:       http://localhost:${PORT}/api/auth`);
  logger.info(`   ├─ Users API:      http://localhost:${PORT}/api/users`);
  logger.info(`   └─ Shifts API:     http://localhost:${PORT}/api/shifts`);
  logger.info('');
  logger.info('🛠️  Development Tools:');
  logger.info('   ├─ Prisma Studio: http://localhost:5555');
  logger.info('🚀 ================================');
});

const shutdown = async (signal: string, code = 0) => {
  try {
    logger.info(`Received ${signal}. Closing server...`);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
    logger.info('Server closed and Prisma disconnected. Bye!');
    process.exit(code);
  } catch (err) {
    logger.error('Error during shutdown: %o', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
