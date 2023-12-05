import { Router } from 'express';

import responseHelper from '../helpers/response.js';
import fieldService from '../services/fieldService.js';

const router = Router();

router.post('/', (req, res, next) => {
  const values = req.body;
  return fieldService.create(values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/master-fields', (req, res, next) => {
  const options = req.query;
  return fieldService.findAllMasterForListing(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.get('/listing-fields', (req, res, next) => {
  const options = req.query;
  return fieldService.findAllFieldsBasedOnVisibility(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/master-field/:fieldId', (req, res, next) => {
  const { fieldId } = req.params;
  return fieldService.findOneMasterByIdForView(fieldId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/master-field-update-active/:fieldId', (req, res, next) => {
  const { fieldId } = req.params;
  const values = req.body;
  return fieldService.updateActiveStatus(fieldId, values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/create-master-field', (req, res, next) => {
  const values = req.body;
  return fieldService.createMasterField(values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:fieldId/update', (req, res, next) => {
  const { fieldId } = req.params;
  const values = req.body;
  return fieldService.updateById(fieldId, values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:fieldId/mark-active', (req, res, next) => {
  const { fieldId } = req.params;
  return fieldService.markActiveById(fieldId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:fieldId/mark-inactive', (req, res, next) => {
  const { fieldId } = req.params;
  const values = req.body;
  return fieldService.markInActiveById(values, fieldId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
