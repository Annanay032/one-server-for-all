import { Router } from 'express';
import notificationService from '../services/notificationService.js';
import responseHelper from '../helpers/response.js';

const router = Router();

router.post('/markAsRead', (req, res, next) => notificationService
  .markRead(req.appAuth)
  .then(ret => responseHelper.success(res, ret))
  .catch(err => next(err)));

router.post('/:notificationId/markAsRead', (req, res, next) => {
  const { notificationId } = req.params;
  console.log('ereqwreewrew44444444444444444', notificationId);
  return notificationService
    .markRead(req.appAuth, notificationId)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
