import { Router } from 'express';
import responseHelper from '../helpers/response.js';
import customTransactionService from '../services/customTransactionService.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return customTransactionService.findAllForListing(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return customTransactionService.create(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:ctId', (req, res, next) => {
  const { ctId } = req.params;
  return customTransactionService.findOneByIdForView(ctId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:ctId', (req, res, next) => {
  const { ctId } = req.params;
  const values = req.body;
  return customTransactionService.update(values, ctId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});


export default router;
