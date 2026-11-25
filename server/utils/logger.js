const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bijakbeli-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
    }),
  ],
});

// Console too in production: hosts like Render show stdout as the service log
// (their disk is wiped on restart, so the log files above don't last there).
logger.add(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === 'production'
        ? winston.format.simple()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  })
);

module.exports = logger;
