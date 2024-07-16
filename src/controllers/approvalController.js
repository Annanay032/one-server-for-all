import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class ApprovalController extends BaseController {
  constructor(customerId, transaction) {
    super(db.Approval, customerId, { transaction });
  }

  findAllForListing(options = {}) {
    const filter = {
      where: {
        active: 1,
      },
    };
    if (options.requisitionId) {
      filter.where.requisitionId = options.requisitionId;
    }
    if (options.quoteRequestId) {
      filter.where.quoteRequestId = options.quoteRequestId;
    }
    if (options.auctionRequestId) {
      filter.where.auctionRequestId = options.auctionRequestId;
    }
    if (options.purchaseOrderId) {
      filter.where.purchaseOrderId = options.purchaseOrderId;
    }
    if (options.supplierId) {
      filter.where.supplierId = options.supplierId;
    }
    return super.findAll(filter);
  }

  findOnePendingApprovalByTransactionId(params = {}) {
    if (!Object.keys(params).length) {
      return {};
    }
    const filter = {
      where: {
        active: 1,
        status: 'approved',
      },
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        where: {
          active: 1,
        },
        attributes: ['id', 'userId', 'status', 'actionAt', 'approvalId', 'delegatedByUserId'],
        required: false,
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }],
      order: [['sequence', 'DESC']],
      attributes: ['id', 'sequence', 'status', 'approvers', 'actionAt']
    };
    if (params.requisitionId) {
      filter.where.requisitionId = params.requisitionId;
    }
    if (params.purchaseOrderId) {
      filter.where.purchaseOrderId = params.purchaseOrderId;
    }
    return super.findOne(filter);
  }

  findOnePendingByBudgetId(budgetId) {
    const filter = {
      where: {
        active: 1,
        budgetId,
        status: 'pending',
      },
      include: [{
        model: db.User,
      }],
      order: [['sequence', 'ASC'], ['createdAt', 'ASC']],
    };
    return super.findOne(filter);
  }

  findRolesForGoodDataS3UploadforAbInbev(condition) {
    const filter = {
      where: {
        active: 1,
        supplierId: {
          [Op.ne]: null,
        },
      },
      order: [['sequence', 'ASC']],
      include: [{
        model: db.Supplier,
      }],
    };
    if (condition === 'hourly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000)),
      };
    }
    if (condition === 'weekly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000 * 48)),
      };
    }
    if (condition === 'monthly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000 * 744)),
      };
    }
    return super.findAll(filter);
  }

  findOnePendingByQuoteRequestId(quoteRequestId) {
    const filter = {
      where: {
        active: 1,
        quoteRequestId,
        status: 'pending',
      },
      include: [{
        model: db.User,
      }],
      order: [['sequence', 'ASC'], ['createdAt', 'ASC']],
    };
    return super.findOne(filter);
  }

  findOnePendingByAuctionRequestId(auctionRequestId) {
    const filter = {
      where: {
        active: 1,
        auctionRequestId,
        status: 'pending',
      },
      include: [{
        model: db.User,
      }],
      order: [['sequence', 'ASC'], ['createdAt', 'ASC']],
    };
    return super.findOne(filter);
  }

  findOnePendingBySupplierId(supplierId) {
    const filter = {
      where: {
        active: 1,
        supplierId,
        status: 'pending',
      },
      include: [{
        model: db.User,
      }],
      order: [['sequence', 'ASC'], ['createdAt', 'ASC']],
    };
    return super.findOne(filter);
  }

  findOnePendingByInvoiceIdForAccounts(invoiceId) {
    const filter = {
      where: {
        active: 1,
        invoiceId,
        status: 'pending',
      },
      include: [{
        model: db.User,
      }],
      order: [['sequence', 'ASC'], ['createdAt', 'ASC']],
    };
    return super.findOne(filter);
  }

  findAllWithPendingToApprove(userId) {
    const filter = {
      where: {
        active: 1,
        status: 'pending',
        approvers: { [Op.contains]: [{ userId: +userId }] },
      },
      include: [{
        model: db.Requisition,
        as: 'Requisition',
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.Requisition,
        as: 'AmendRequisition',
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.QuoteRequest,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        as: 'QuoteRequest',
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.PurchaseOrder,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        as: 'PurchaseOrder',
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.AuctionRequest,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.Invoice,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        as: 'Invoice',
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.PurchaseOrder,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        as: 'AmendPurchaseOrder',
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }, {
        model: db.Invoice,
        attributes: ['id', 'code', 'subject', 'status', 'createdAt'],
        as: 'AccountingInvoice',
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }],
      order: [
        ['id', 'DESC'],
      ],
    };
    return super.findAll(filter);
  }

  findOneByCurrentApprovalId(id) {
    const filter = {
      where: {
        id,
        status: 'pending',
      },
    };
    return super.findOne(filter);
  }

  findAllActiveApprovalsForTransaction(options) {
    const filter = {
      where: options,
      attributes: ['id', 'active'],
    };
    return super.findAll(filter);
  }

  findOneByIdWithTemplateItemAndUsers(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['id', 'status', 'approvalStartTime', 'approvalTemplateItemId', 'approvers'],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATI',
        attributes: ['id', 'deadlineValue', 'deadlineType', 'reminderSettingType', 'moveTonextApproval', 'reassignRoleId'],
        include: [{
          model: db.ApprovalTemplateItemReminder,
          as: 'ATIRs',
          where: {
            active: 1,
          },
          required: false,
        }],
      }, {
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        where: {
          active: 1,
        },
        required: false,
      }],
    };
    return super.findOne(filter);
  }


  findOneWithAUMs(id, userId) {
    const filter = {
      where: {
        id,
        approvalTemplateItemDetails: {
          approvalType: 'anyone'
        },
      },
      attributes: ['id', 'approvalTemplateItemDetails'],
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        attributes: ['id', 'userId', 'status'],
        where: {
          active: 1,
          userId: {
            [Op.ne]: userId,
          },
          status: {
            [Op.ne]: 'skipped',
          },
        },
      }],
    };
    return super.findOne(filter);
  }

  findOneByIdWithTemplateItem(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['id', 'status', 'approvalStartTime', 'approvalTemplateItemId', 'approvers'],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATI',
        attributes: ['id', 'deadlineValue', 'deadlineType', 'reminderSettingType', 'moveTonextApproval', 'reassignRoleId', 'enableVendorApprovals'],
        include: [{
          model: db.ApprovalTemplateItemReminder,
          as: 'ATIRs',
          where: {
            active: 1,
          },
          required: false,
        }],
      }],
    };
    return super.findOne(filter);
  }

  findAllApprovalsForCache(options) {
    options.active = 1;
    const filter = {
      where: options,
      attributes: ['id', 'active', 'status'],
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        attributes: ['id', 'userId', 'status'],
        where: {
          active: 1,
        },
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }]
      }],
    };
    return super.findAll(filter);
  }

  findOneByIdForApprovalReminders(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['id'],
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        where: {
          active: 1,
          status: 'pending',
        },
        required: false,
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'email'],
          include: [{
            model: db.User,
            as: 'Manager',
            attributes: ['id', 'name', 'email'],
          }],
        }],
      }],
    };
    return super.findOne(filter);
  }

  findAllApprovalsForTransactionIdsAndUser(options) {
    const transactionsIdColumns = options.columnNames.map(columnName => ({ [columnName]: options.transactionIds }));
    const filter = {
      where: {
        [Op.or]: transactionsIdColumns,
        status: 'pending',
        active: 1,
      },
      attributes: ['id', 'currentApprovalUserIds', ...options.columnNames, 'approvers'],
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        where: {
          active: 1,
          status: 'pending',
          userId: options.userId,
        },
        attributes: ['id', 'userId'],
      }],
    };
    return super.findAll(filter);
  }

  findSupplierApprovalDataForS3Upload(condition) {
    const filter = {
      where: {
        [Op.or]: [
          { blackListSupplierId: { [Op.not]: null } },
          { whiteListSupplierId: { [Op.not]: null } },
          { createSupplierId: { [Op.not]: null } },
          { supplierId: { [Op.not]: null } },
        ],
      },
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATI',
        attributes: ['id'],
        include: [{
          model: db.ApprovalTemplate,
          as: 'AT',
          attributes: ['id', 'module', 'moduleAction'],
        }],
      }],
    };

    if (condition === 'hourly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000)),
      };
    }
    if (condition === 'daily') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000 * 24)),
      };
    }
    if (condition === 'bidiurnal') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 48)),
      };
    }
    if (condition === 'weekly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000 * 168)),
      };
    }
    if (condition === 'monthly') {
      filter.where.updatedAt = {
        [Op.gte]: new Date(Date.now() - (60 * 60 * 1000 * 744)),
      };
    }
    return super.findAll(filter);
  }

  findOneWithAUMsForTransactionLog(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['id', 'approvers'],
      include: [{
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        attributes: ['id', 'userId', 'approvalId'],
        where: {
          active: 1,
          status: 'pending',
        },
        required: false,
        separate: true,
      }],
    };
    return super.findOne(filter);
  }

  findOneForRevert(options) {
    const filter = {
      where: options,
      attributes: ['id', 'approvalTemplateItemDetails'],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATI',
        attributes: ['id', 'deadlineValue', 'deadlineType', 'reminderSettingType', 'moveTonextApproval', 'reassignRoleId', 'statusText'],
      }]
    }
    return super.findOne(filter);
  };

  findOneByCurrentApprovalIdForEligibleApprovers(id) {
    const filter = {
      where: {
        id,
        active: 1,
      },
      attirbutes: ['id', 'sequenceKey', 'sequence'],
      order: [['sequence', 'ASC']],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATI',
        attributes: ['id', 'reassignApprovalSettings'],
      }, {
        model: db.ApprovalUserMapping,
        as: 'AUMs',
        where: {
          active: 1,
        },
        required: false,
        separate: true,
        attributes: ['id', 'userId', 'status', 'actionAt', 'approvalId'],
        include: [{
          model: db.User,
          attributes: ['id', 'name'],
        }],
      }],
    };
    return super.findOne(filter);
  }
}

export default ApprovalController;
