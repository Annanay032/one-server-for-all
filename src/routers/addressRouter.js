import { Router } from 'express';

import responseHelper from '../helpers/response.js';
import addressService from '../services/addressService.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return addressService.findAllForListing(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.get('/all-mini', (req, res, next) => {
  const options = req.query;
  return addressService.findAllForListingInTransactions(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/search', (req, res, next) => {
  const options = req.qeury;
  return addressService.findAllForSearch(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return addressService.create(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/bulk-upload', (req, res, next) => {
  const values = req.body;
  return addressService.bulkUpload(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/user-address-mappings', (req, res, next) => {
  return addressService.findAllwithUserMappings(req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});


router.get('/approvers', (req, res, next) => {
  const options = req.query;
  return addressService.getApprovers(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:addressId', (req, res, next) => {
  const { addressId } = req.params;
  const options = req.query;
  return addressService.findOneByIdForView(addressId, req.appAuth , options)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:addressId', (req, res, next) => {
  const { addressId } = req.params;
  const values = req.body;
  return addressService.update(values, addressId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:addressId/active', (req, res, next) => {
  const { addressId } = req.params;
  return addressService.markActiveById(addressId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:addressId/inactive', (req, res, next) => {
  const { addressId } = req.params;
  return addressService.markInactiveById(addressId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:addressId/approve', (req, res, next) => {
  const { addressId } = req.params;
  return addressService.approve(addressId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:addressId/reject', (req, res, next) => {
  const { addressId } = req.params;
  const values = req.body;
  return addressService.reject(values, addressId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
