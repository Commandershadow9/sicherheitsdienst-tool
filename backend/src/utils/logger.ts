import { createLogger, format, transports, addColors } from 'winston';

const { combine, timestamp, errors, printf, colorize, json, splat } = format;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  format: combine(timestamp(), errors({ stack: true }), splat(), json()),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

const useJsonConsole = String(process.env.LOG_FORMAT || '').toLowerCase() === 'json';
if (process.env.NODE_ENV !== 'production' || useJsonConsole) {
  logger.add(
    new transports.Console({
      format: useJsonConsole ? combine(timestamp(), errors({ stack: true }), splat(), json()) : combine(colorize(), logFormat),
    }),
  );
}

export default logger;
