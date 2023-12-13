import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import requestIp from 'request-ip';
import logger from './logger.js';
import registrationRouter from './routers/registrationRouter.js';
import userRouter from './routers/userRouter.js';
import authRouter from './routers/authRouter.js';
import authService from './services/authService.js';
import notificationRouter from './routers/notificationRouter.js';
import roleRouter from './routers/roleRouter.js';
import companyRouter from './routers/companyRouter.js';
import addressRouter from './routers/addressRouter.js';
import responseHelper from './helpers/response.js';
import { RouteNotFoundError } from './helpers/customError.js';

const app = express();
// const PORT = 8080;
app.use(cors({
  origin: 'http://localhost:3000', // Replace with the actual origin of your frontend
  credentials: true, // Allow credentials (e.g., cookies)
}));

app.use(morgan('combined', { stream: logger.stream }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.json({ limit: '5mb', extended: true }));
app.use(cookieParser());
app.use(requestIp.mw());

app.all('*', (req, res, next) => {
  console.log('Before processing - ', req.url, req.method);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  res.header('Strict-Transport-Security', 'maxAge=100000');
  res.header('X-Frame-Options', 'DENY');
  res.header('Content-Security-Policy', "frame-ancestors 'none'");
  res.header('Access-Control-Allow-Headers', 'Cookies, cookies, x-access-token, Origin, Content-Type, Accept, authUser');
  if (req.method === 'OPTIONS') {
    return responseHelper.optionsSuccess(res);
  }
  return next();
});

app.use('/*', authService.authenticate);
app.use('/registration', registrationRouter);
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/roles', roleRouter);
app.use('/notifications', notificationRouter);
app.use('/addresses', addressRouter);
app.use('/company', companyRouter);

app.use((req, res, next) => {
  next(new RouteNotFoundError());
});

app.use((err, req, res, next) => {
  responseHelper.error(res, err);
});

export default app;
