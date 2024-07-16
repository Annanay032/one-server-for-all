import sequelize, { Op } from 'sequelize';
import BaseController from './baseController.js';
import { db } from '../models/index.js';

class ApprovalTemplateItemController extends BaseController {
  constructor(customerId, transaction) {
    super(db.ApprovalTemplateItem, customerId, { transaction });
  }

  bulkMarkInactiveById(atiIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        id: atiIds,
      },
    });
  }

  findOneByIdWithReminders(approvalTemplateItemId) {
    const filter = {
      where: {
        id: approvalTemplateItemId,
      },
      attributes: ['id', 'deadlineType', 'deadlineValue', 'approvalType', 'rejectionType', 'enableTransactionHold',
        'minimumApprovalCount', 'minimumRejectionCount', 'commentRequired', 'rejectionReasonRequired', 'enableTransactionEditing', 'enableInternalUpdate', 'enableRejectBtn', 'approveText', 'statusText', 'enableRevert', 'autoSelectApprovers', 'enableNextSequenceApprovers'],
      include: [{
        model: db.ApprovalTemplateItemReminder,
        as: 'ATIRs',
        where: {
          active: 1,
        },
        required: false,
      }],
    };
    return super.findOne(filter);
  }

  findOneByRoleId(options) {
    const filter = {
      where: {
        roleIds: { [Op.contains]: [+options.roleId] },
        active: 1,
      },
      attributes: [[sequelize.fn('max', sequelize.col('sno')), 'max']],
      raw: true,
      include: [{
        model: db.ApprovalTemplate,
        as: 'AT',
        attributes: [],
        where: {
          module: options.module,
          moduleAction: options.moduleAction,
        },
      }],
    };
    return super.findAll(filter);
  }

  findOneWithApprovalTemplate(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['id', 'enableValueFilter', 'roleIds', 'enableDepartmentFilter', 'enableCostCentreFilter', 'enableLedgerFilter', 'reassignApprovalSettings'],
      include: [{
        model: db.ApprovalTemplate,
        as: 'AT',
        attributes: ['id', 'excludeTransactionCreator'],
      }],
    };
    return super.findOne(filter);
  }
}

export default ApprovalTemplateItemController;
