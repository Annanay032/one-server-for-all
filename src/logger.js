import winston from 'winston';
import config from './config.js';

const log = `${config.log.folder}/${config.log.filename}`;

const winstonLogger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      level: 'debug',
      filename: log,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
  exitOnError: false,
});

const logger = {};

logger.log = (level, message) => winstonLogger.log(level, message);

logger.info = message => winstonLogger.info(message);

logger.warn = message => winstonLogger.warn(message);

logger.error = (message) => {
  if (message instanceof Error) {
    winstonLogger.error(message.message);
    if (config.log.stackTrace) {
      winstonLogger.error(`Stack Trace --> ${message.stack}`);
    }
  } else {
    winstonLogger.error(message);
  }
};

logger.stream = {
  write(message) {
    winstonLogger.info(message);
  },
};

export default logger;
