import { Router } from 'express';

import responseHelper from '../helpers/response.js';
import companyService from '../services/companyService.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return companyService.findAllForListing(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return companyService.create(values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/search', (req, res, next) => {
  const options = req.query;
  return companyService.findAllForSearch(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:companyId', (req, res, next) => {
  const { companyId } = req.params;
  return companyService.findOneByIdForView(companyId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:companyId', (req, res, next) => {
  const { companyId } = req.params;
  const values = req.body;
  return companyService.update(values, companyId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});


export default router;
