import { Router } from 'express';
import responseHelper from '../helpers/response.js';
import registrationService from '../services/registrationService.js';

const router = Router();

router.post('/', (req, res, next) => {
  const values = req.body;
  // values.ipAddress = req.clientIp;
  return registrationService.register(values)
    .then(ret => responseHelper.success(res, ret)).catch(err => next(err));
});

export default router;
