import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import logger from './logger.js';
import userRouter from './routers/userRouter.js';
import notificationRouter from './routers/notificationRouter.js';
import responseHelper from './helpers/response.js';
import { RouteNotFoundError } from './helpers/customError.js';


const app = express();
// const PORT = 8080;
app.use(cors({
  origin: 'http://localhost:2000', // Replace with the actual origin of your frontend
  credentials: true, // Allow credentials (e.g., cookies)
}));


app.use(morgan('combined', { stream: logger.stream }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.json({ limit: '5mb', extended: true }));

app.all('*', (req, res, next) => {
  console.log('Before processing - ', req.url, req.method);
  res.header('Access-Control-Allow-Origin', 'http://localhost:2000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  res.header('Strict-Transport-Security', 'maxAge=100000');
  res.header('X-Frame-Options', 'DENY');
  res.header('Content-Security-Policy', "frame-ancestors 'none'");
  // res.header('Access-Control-Allow-Headers', 'Cookies, cookies, x-access-token, Origin, Content-Type, Accept, authUser');
  if (req.method === 'OPTIONS') {
    return responseHelper.optionsSuccess(res);
  }
  return next();
});

app.use('/users', userRouter);
app.use('/notifications', notificationRouter);

app.use((req, res, next) => {
  next(new RouteNotFoundError());
});

app.use((err, req, res, next) => {
  responseHelper.error(res, err);
});

export default app;
