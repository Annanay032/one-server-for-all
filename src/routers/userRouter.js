import { Router } from 'express';
import userService from '../services/userService.js';
import responseHelper from '../helpers/response.js';

const router = Router();

router.get('/', (req, res, next) => {
  console.log('jhgfdssasasa', req)

  const options = req.query;
  return userService
    .findAllForListing(options)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  const userId = req.params.id;
  return userService
    .findOneById(userId)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const values = req.body;
  return userService
    .create(values)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:userId/edit', (req, res, next) => {
  console.log('jhgfdssasasa', req)

  const { userId } = req.params;
  const values = req.body;
  console.log('ereqwreewrew44444444444444444', userId, values);
  return userService
    .edit(values, userId)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.delete('/:id', (req, res, next) => {
  const userId = req.params.id;
  return userService
    .deleteById(userId)
    .then(ret => {
      if (ret) {
        responseHelper.success(res, null, {
          message: 'User deleted successfully',
        });
      } else {
        responseHelper.notFound(res, 'User not found');
      }
    })
    .catch(err => next(err));
});

export default router;
