import { Router } from 'express';
import userService from '../services/userService.js';
import responseHelper from '../helpers/response.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return userService.findAllForListing(options)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return userService.create(values)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
