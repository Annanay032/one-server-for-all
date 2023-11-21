import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import logger from './logger.js';
import userRouter from './routers/userRouter.js';
import responseHelper from './helpers/response.js';

const app = express();
// const PORT = 8080;
app.use(cors());
app.use(morgan('combined', { stream: logger.stream }));

app.all('*', (req, res, next) => {
  console.log('Before processing - ', req.url, req.method);
  res.header('Access-Control-Allow-Origin', 'http://localhost:2000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  if (req.method === 'OPTIONS') {
    return responseHelper.optionsSuccess(res);
  }
  return next();
});

app.use((err, req, res, next) => {
  responseHelper.error(res, err);
});

app.use('/users', userRouter);
export default app;
