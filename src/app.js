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
