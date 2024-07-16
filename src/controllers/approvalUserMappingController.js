import BaseController from './baseController.js';
import { db } from '../models/index.js';

class ApprovalUserMappingController extends BaseController {
  constructor(customerId, transaction) {
    super(db.ApprovalUserMapping, customerId, { transaction });
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

  bulkMarkInactiveByApprovalIds(approvalIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        approvalId: approvalIds,
      },
    });
  }

  findOneByIdWithAttributes(options = {}) {
    if (!options.aumId) {
      return;
    }

    const filter = {
      where: {
        id: options.aumId,
      },
    };

    if (Array.isArray(options.attributes) && options.attributes.length) {
      filter.attributes = options.attributes;
    }

    return super.findOne(filter);
  }

  bulkMarkInactiveByApprovalIdAndUserId(approvalId, userId) {
    return super.update({
      active: 0,
    }, {
      where: {
        approvalId,
        userId,
        active: 1,
      },
    });
  }

  findAllWithApprovalId(approvalId) {
    const filter = {
      where: {
        approvalId,
      },
    };
    return super.findAll(filter);
  }

  findOneByIdForReassignApprovers(aumId) {
    const filter = {
      where: {
        id: aumId,
      },
      attributes: ['id', 'userId'],
      include: [{
        model: db.User,
        attributes: ['id', 'name'],
      }]
    };
    return super.findOne(filter);
  }
}

export default ApprovalUserMappingController;
