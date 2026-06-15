import fs from 'fs';
import path from 'path';
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Log format for files (plain text, no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Log format for console (colored)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const isWritableLogDir = () => {
  try {
    const logDir = path.resolve('logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.accessSync(logDir, fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
};

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

if (isWritableLogDir()) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    }),
  );
} else {
  console.warn('Logger warning: logs directory unavailable, using console-only logging');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  transports,
});

export default logger;
