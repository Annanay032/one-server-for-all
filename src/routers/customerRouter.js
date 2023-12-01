import jwt from 'jsonwebtoken';
import { Router } from 'express';

import config from '../config.js';
import { AuthenticationError } from '../helpers/customError.js';
import responseHelper from '../helpers/response.js';
import authTokenService from '../commons/services/authTokenService.js';

import customerService from '../services/customerService';

const router = new Router();

router.post('/:customerId', (req, res, next) => {
  const { customerId } = req.params;
  const authUser = req.headers.authuser;
  const values = req.body;
  return customerService.changeUserProfile(values, authUser, customerId)
    .then((ret) => {
      if (ret.auth) {
        const token = req.cookies[config.app.capp.auth.token];
        jwt.verify(token, config.app.capp.auth.jwtSecret, async (err, decoded) => {
          await authTokenService.changeUserId(ret.userId, decoded.key);
        });
        // res.cookie(config.app.capp.auth.token, ret.token, {
        //   maxAge: 10 * 24 * 60 * 60 * 1000, httpOnly: true, domain: config.app.capp.auth.domain, path: '/',
        // });
      } else {
        throw new AuthenticationError();
      }
      return responseHelper.success(res, ret);
    }).catch(err => next(err));
});

router.get('/:customerId/supplier-enabled-modules', (req, res, next) => {
  const { customerId } = req.params;
  return customerService.getAllSupplierEnabledModules(customerId)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
