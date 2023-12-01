import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class RoleController extends BaseController {
  constructor(customerId, transaction) {
    super(db.Role, customerId, { transaction });
  }

  findAllForListing(options = {}) {
    const filter = {
      where: {
        active: 1,
      },
      order: [
        ['rolehierarchy', 'ASC'],
      ],
    };
    if (options.query) {
      filter.where.name = {
        [Op.iLike]: `%${options.query}%`,
      };
    }

    if (options.approvalRole) {
      filter.where[options.approvalRole] = 1;
    }

    const paginationOptions = {
      limit: options.limit,
      page: options.page,
    };
    return super.findAndCountAllWithPagination(filter, paginationOptions);
  }

  findAllForSearch(options = {}) {
    const filter = {
      where: {
        active: 1,
      },
      attributes: ['id', 'name'],
      order: [
        ['rolehierarchy', 'ASC'],
      ],
    };
    if (options.query) {
      filter.where.name = {
        [Op.iLike]: `%${options.query}%`,
      };
    }
    return super.findAll(filter);
  }

  findAllByIdsForApprovals(options = {}) {
    const filter = {
      where: {
        id: options.roleIds,
      },
      include: [],
      attributes: ['id', 'name'],
      order: [
        ['rolehierarchy', 'ASC'],
      ],
    };
    if (options.type === 'transaction-level') {
      const userInclude = {
        model: db.User,
        where: {
          id: options.getUserIds,
          active: 1,
        },
        attributes: ['id', 'name', 'delegateUserId', 'approvalValueBracketId'],
        include: [{
          model: db.User,
          as: 'DelegateUser',
          attributes: ['id', 'name', 'email'],
        }],
      };
      if (options.value && options.enableValueFilter) {
        userInclude.include.push({
          model: db.ApprovalValueBracket,
          as: 'AVB',
          where: {
            minimum: {
              [Op.or]: [{
                [Op.lte]: options.value,
              }, {
                [Op.eq]: null,
              }],
            },
            maximum: {
              [Op.or]: [{
                [Op.gte]: options.value,
              }, {
                [Op.eq]: null,
              }],
            },
          },
        });
      }
      filter.include.push(userInclude);
    }

    return super.findAll(filter);
  }

  findAllByIds(options = {}) {
    const filter = {
      where: {
        id: options.roleIds,
      },
      include: [],
      attributes: ['id', 'name'],
      order: [
        ['rolehierarchy', 'ASC'],
      ],
    };
    if (options.type === 'transaction-level') {
      const userInclude = {
        model: db.User,
        where: {
          active: 1,
        },
        attributes: ['id', 'name', 'delegateUserId', 'approvalValueBracketId'],
        include: [{
          model: db.User,
          foreignKey: 'delegateUserId',
          as: 'DelegateUser',
          attributes: ['id', 'name', 'email'],
        }, {
          model: db.ApprovalValueBracket,
          as: 'AVB',
        }],
      };
      if (options.departmentId && options.enableDepartmentFilter) {
        userInclude.include.push({
          model: db.UserDepartmentMapping,
          as: 'UDMs',
          where: {
            active: 1,
            departmentId: options.departmentId,
          },
        });
      }
      if (options.costCentreId && options.enableCostCentreFilter) {
        userInclude.include.push({
          model: db.UserCostCentreMapping,
          as: 'UCCMs',
          where: {
            active: 1,
            costCentreId: options.costCentreId,
          },
        });
      }
      /* if (options.value && options.enableValueFilter) {
        userInclude.include.push({
          model: db.ApprovalValueBracket,
          as: 'AVB',
          required: false,
          where: {
            minimum: {
              [Op.or]: [{
                [Op.lte]: options.value,
              }, {
                [Op.eq]: null,
              }],
            },
            maximum: {
              [Op.or]: [{
                [Op.gte]: options.value,
              }, {
                [Op.eq]: null,
              }],
            },
          },
        });
      } */
      if (options.ledgerId && options.enableLedgerFilter) {
        userInclude.include.push({
          model: db.UserLedgerMapping,
          as: 'ULMs',
          where: {
            active: 1,
            ledgerId: options.ledgerId,
          },
        });
      }
      if (options.addressId && options.enableDeliveryAddressFilter) {
        userInclude.include.push({
          model: db.UserAddressMapping,
          as: 'UAMs',
          where: {
            active: 1,
            addressId: options.addressId,
          },
        });
      }
      filter.include.push(userInclude);
    }

    if (options.transactionViewAccess && options.transactionApproveAccess) {
      filter.where = {
        [options.transactionViewAccess]: 1,
        [options.transactionApproveAccess]: 1,
      };
    }
    return super.findAll(filter);
  }

  findRoleNames(roleIds) {
    const filter = {
      where: {
        id: roleIds,
      },
      attributes: ['id', 'name'],
      order: [
        ['id', 'ASC'],
      ],
    };
    return super.findAll(filter);
  }

  findOneBySlug(slug) {
    const filter = {
      where: {
        slug,
      },
    };
    return super.findOne(filter);
  }

  findOneByAccess(id, options) {
    const filter = {
      where: {
        id,
      },
    };
    if (options.stockInwardCreate === 1) {
      filter.where.stockInwardCreate = 1;
    }
    return super.findOne(filter);
  }

  findAllForFilter() {
    const filter = {
      where: {
        active: 1,
      },
      attributes: ['id', 'name', 'requisitionCreate', 'quoteRequestCreate', 'purchaseOrderCreate',
        'requisitionApprove', 'purchaseOrderApprove', 'invoiceApprove', 'invoiceAccountingApprove',
        'invoiceCreate', 'requisitionAmendApprove', 'purchaseOrderAmendApprove', 'stockInwardCreate',
        'stockInwardApprove', 'cndnApprove', 'poShortCloseApprove', 'invoiceAccountingCreate',
        'quoteRequestApprove', 'auctionRequestApprove', 'auctionRequestCreate', 'quoteComparisonApprove', 'stockInwardView', 'invoiceView',
        'pettyCashCreate', 'pettyCashView', 'pettyCashApprove','pettyCashEdit', 'pettyCashCancel', 'paymentVoucherCreate', 'paymentVoucherView', 'paymentVoucherApprove',
        'budgetCreate', 'budgetView', 'budgetEdit', 'budgetApprove', 'admin', 'supplierTicketView'],
    };
    return super.findAll(filter);
  }

  findRolesBySlugsWithUsers(slugs) {
    const filter = {
      where: {
        slug: slugs,
      },
      attributes: ['id'],
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'email', 'roleId'],
        separate: true,
        required: false,
      }]
    };
    return super.findAll(filter);
  }
  findOneByIdForAnalyticsBuilder(id) {
    const filter = {
      where: {
        id,
      },
      attributes: ['analyticsBuilderCreate'],
    };
    return super.findOne(filter);
  }
  findOneByIdForAuditLogs(roleId) {
    const filter = {
      where: {
        id: roleId,
      },
    };
    return super.findOne(filter)
  }
  findOneByIdWithAttributes(roleId, attributes) {
    const filter = {
      where: {
        id: roleId,
      },
      attributes,
    };
    return super.findOne(filter);
  }

  findAllForReportGeneration() {
    const filter = {
      where: {
        active: 1,
      },
      attributes: { exclude: ['customerId', 'slug', 'auto', 'active'] },
      order: [
        ['rolehierarchy', 'ASC'],
      ],
    };
    return super.findAll(filter);
  }

  findAttributesForReportGeneration() {
    const filter = {
      where: {
        active: 1,
      },
      attributes: { exclude: ['customerId', 'id', 'slug', 'auto', 'active'] },
    };
    return super.findOne(filter);
  }

  findAllByAccess(options) {
    const filter = {
      where: {
        active: 1,
        [options.transactionViewAccess]: 1,
        [options.transactionApproveAccess]: 1,
      },
      attributes: ['id'],
    };
    return super.findAll(filter);
  }
}

export default RoleController;
