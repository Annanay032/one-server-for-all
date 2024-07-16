import BaseController from './baseController.js';
import { db } from '../models/index.js';

class ApprovalTemplateItemReminderController extends BaseController {
  constructor(customerId, transaction) {
    super(db.ApprovalTemplateItemReminder, customerId, { transaction });
  }

  bulkMarkInactiveByATIId(atiIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        approvalTemplateItemId: atiIds,
      },
    });
  }

  bulkMarkInactiveBySupplierTicketGroupId(supplierTicketGroupId) {
    return super.update({
      active: 0,
    }, {
      where: {
        supplierTicketGroupId,
      },
    });
  }
}

export default ApprovalTemplateItemReminderController;
