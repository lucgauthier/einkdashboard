const winston = require('winston');
const path = require('path');

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.simple(),
    myFormat
  ),
  defaultMeta: { },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: getLogfilePath('error.log'), level: 'error', maxFiles: 3, maxsize: 50000, tailable: true }),
    new winston.transports.File({ filename: getLogfilePath('combined.log'), maxFiles: 3, maxsize: 50000, tailable: true }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: getLogfilePath('exceptions.log'), maxFiles: 3, maxsize: 50000, tailable: true })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        myFormat
      )
  }));
}

module.exports = logger;

function getLogfilePath(filename) {
    return path.resolve(__dirname, '..', 'logs', filename);
}