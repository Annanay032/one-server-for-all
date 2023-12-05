import { Router } from 'express';

import responseHelper from '../helpers/response.js';
import roleService from '../services/roleService.js';

const router = Router();

router.get('/', (req, res, next) => {
  const options = req.query;
  return roleService.findAllForListing(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.get('/options', (req, res, next) => roleService.findAllByOptions(req.appAuth)
  .then(ret => responseHelper.success(res, ret, ret.meta))
  .catch(err => next(err)));

router.get('/all-mini', (req, res, next) => {
  const options = req.query;
  return roleService.findAllForListingInTransactions(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/search', (req, res, next) => {
  const options = req.query;
  return roleService.findAllForSearch(options, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return roleService.create(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/update-hierarchy', (req, res, next) => {
  const values = req.body;
  return roleService.updateHierarchy(values, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:roleId', (req, res, next) => {
  const { roleId } = req.params;
  return roleService.findOneById(roleId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:roleId', (req, res, next) => {
  const { roleId } = req.params;
  const values = req.body;
  values.ipAddress = req.clientIp;
  return roleService.updateById(values, roleId, req.appAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.delete('/:id', (req, res, next) => {
  const roleId = req.params.id;
  return roleService
    .deleteById(roleId, req.appAuth)
    .then(ret => {
      if (ret) {
        responseHelper.success(res, null, {
          message: 'Role deleted successfully',
        });
      } else {
        responseHelper.notFound(res, 'Role not found');
      }
    })
    .catch(err => next(err));
});

export default router;
