import { Router } from 'express';
import responseHelper from '../helpers/response.js';
import customModuleService from '../services/customModuleService.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return customModuleService.findAllForListing(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return customModuleService.create(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:cmId', (req, res, next) => {
  console.log('uytrew34232232222222222', req.params, req.body, req.query)
  const { cmId } = req.params;
  const options = req.query
  return customModuleService.findOneByIdForView(cmId, options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/slug/:slugName', (req, res, next) => {
  console.log('uytrew34232232222222222', req.params, req.body, req.query)
  const { slugName } = req.params;
  return customModuleService.findOneBySlugForView(slugName, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.delete('/:cmId', (req, res, next) => {
  const { cmId } = req.params;
  return customModuleService.deleteById(cmId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:cmId/edit', (req, res, next) => {
  const { cmId } = req.params;
  const values = req.body;
  return customModuleService.update(values, cmId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});


export default router;
