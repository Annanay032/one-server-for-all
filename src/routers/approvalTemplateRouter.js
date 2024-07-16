import { Router } from 'express';

import responseHelper from '../helpers/response.js';
import approvalTemplateService from '../services/approvalTemplateService.js';

const router = Router();

router.post('/', (req, res, next) => {
  const { approvalTemplateId } = req.params;
  const values = req.body;
  return approvalTemplateService.create(values, approvalTemplateId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/eligible-approvers', (req, res, next) => approvalTemplateService.getEligibleApprovers(req.body, req.cappAuth)
  .then(ret => responseHelper.success(res, ret))
  .catch(err => next(err)));

router.post('/reassign-approvers', (req, res, next) => {
  const values = req.body;
  return approvalTemplateService.reassignApprovers(values, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const options = req.query;
  return approvalTemplateService.findAllForListing(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret.data, ret.meta))
    .catch(err => next(err));
});

router.get('/transactional-fields', (req, res, next) => {
  const { transactionType } = req.query;
  return approvalTemplateService.getTransactionalFields(transactionType, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/transaction-approvers', (req, res, next) => {
  const options = req.query;
  return approvalTemplateService.getApprovers(options, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.get('/:approvalTemplateId', (req, res, next) => {
  const { approvalTemplateId } = req.params;
  return approvalTemplateService.findOneByIdForView(approvalTemplateId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:approvalTemplateId', (req, res, next) => {
  const { approvalTemplateId } = req.params;
  const values = req.body;
  return approvalTemplateService.update(values, approvalTemplateId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

router.post('/:approvalTemplateId/transactions', (req, res, next) => {
  const { approvalTemplateId } = req.params;
  const values = req.body;
  return approvalTemplateService.updateTransactionApprovalTemplate(values, approvalTemplateId, req.cappAuth)
    .then(ret => responseHelper.success(res, ret))
    .catch(err => next(err));
});

export default router;
