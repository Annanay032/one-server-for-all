// const env = process.env.NODE_ENV || 'development';
import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error) {
  throw result.error;
}
const config = {
  app: {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    capp: {
      auth: {
        token: process.env.CAUTH_TOKEN,
        domain: process.env.CAUTH_DOMAIN,
        jwtSecret: process.env.CAUTH_JWT_SECRET,
      },
      url: process.env.CURL,
    },
  },
  db: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: process.env.DEV_DB_LOGGING || false,
  },
  log: {
    folder: process.env.DEV_LOG_FOLDER || '../logs',
    filename: process.env.DEV_LOG_FILENAME || 'vishnu-all.log',
    stackTrace: process.env.DEV_LOG_STACKTRACE || true,
  },
};

export default config;
