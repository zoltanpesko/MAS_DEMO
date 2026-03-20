/**
 * Logger Utility
 * Winston-based logging configuration
 */

const winston = require('winston');
const config = require('../config/environment');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: config.app.name,
    environment: config.app.env,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.app.isDevelopment ? consoleFormat : logFormat,
    }),
  ],
});

// Add file transport in production
if (config.app.isProduction) {
  logger.add(
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Separate error log file
  logger.add(
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '-error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;

// Made with Bob
