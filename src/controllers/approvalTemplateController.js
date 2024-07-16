import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

import utils from '../helpers/utils.js';

class ApprovalTemplateController extends BaseController {
  constructor(customerId, transaction) {
    super(db.ApprovalTemplate, customerId, { transaction });
  }

  findAllForListing(options) {
    const filter = {
      where: {},
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        where: {
          active: 1,
        },
        required: false,
        include: [{
          model: db.ApprovalTemplateItemReminder,
          as: 'ATIRs',
          where: {
            active: 1,
          },
          required: false,
        }],
      }],
      order: [
        [{ model: db.ApprovalTemplateItem, as: 'ATIs' }, 'sno', 'ASC'],
      ],
    };
    if (options.module) {
      filter.where.module = options.module;
    }
    if (options.active) {
      filter.where.active = options.active;
    }
    if (options.moduleAction) {
      filter.where.moduleAction = options.moduleAction;
    }
    if (options.appId) {
      filter.where.appId = options.appId;
    }
    const paginationOptions = {
      limit: options.limit,
      page: options.page,
    };
    return super.findAndCountAllWithPagination(filter, paginationOptions);
  }

  findAllByModuleAction(options) {
    const filter = {
      where: {
        active: 1,
        moduleAction: options.moduleAction,
        module: options.module,
      },
    };
    return super.findAll(filter);
  }

  findOneByModuleAction(options) {
    const filter = {
      where: {
        active: 1,
        moduleAction: options.moduleAction,
        module: options.module,
      },
    };
    return super.findOne(filter);
  }

  findOneWithAllATIsForCount(approvalTemplateId) {
    const filter = {
      where: {
        id: approvalTemplateId,
      },
      attributes: ['id', 'module', 'moduleAction'],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        where: {
          active: 1,
        },
        required: false,
        attributes: ['id', 'sno', 'roleIds'],
      }],
      order: [
        [{ model: db.ApprovalTemplateItem, as: 'ATIs' }, 'sno', 'ASC'],
      ],
    };
    return super.findOne(filter);
  }

  findOneByModuleActionWithATIs(options) {
    const atiFilter = {
      active: 1,
    };
    if (options.atiId) {
      atiFilter.id = options.atiId;
    }
    if (options.varianceValue) {
      atiFilter.minimumValue = {
        [Op.or]: [{
          [Op.lte]: options.varianceValue,
        }, {
          [Op.eq]: null,
        }],
      };
      atiFilter.maximumValue = {
        [Op.or]: [{
          [Op.gte]: options.varianceValue,
        }, {
          [Op.eq]: null,
        }],
      };
    }
    if (options.enableIntegrationErrorFilter) {
      atiFilter.enableIntegrationErrorFilter = 1;
    }
    if (utils.hasKeys(options, ['isDomesticVendor']) && +options.isDomesticVendor) {
      atiFilter.enableForeignVendorFilter = 0;
    }
    const filter = {
      where: {
        active: 1,
        moduleAction: options.moduleAction,
        module: options.module,
      },
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        where: atiFilter,
        required: false,
        separate: true,
        order: [
          ['sno', 'ASC'],
        ],
      }],
    };
    return super.findOne(filter);
  }

  findOneByModuleActionWithApprovalTemplateItems(options) {
    const atiFilter = {
      active: 1,
    };
    if (options.atiId) {
      atiFilter.id = options.atiId;
    }
    if (options.enableIntegrationErrorFilter) {
      atiFilter.enableIntegrationErrorFilter = 1;
    }
    if (utils.hasKeys(options, ['isDomesticVendor']) && +options.isDomesticVendor) {
      atiFilter.enableForeignVendorFilter = 0;
    }
    const atFilter = {
      active: 1,
      moduleAction: options.moduleAction,
    };
    if (options.module) {
      atFilter.module = options.module;
    }
    if (options.appId) {
      atFilter.appId = options.appId;
    }
    const filter = {
      where: atFilter,
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        where: atiFilter,
        required: false,
        separate: true,
        order: [
          ['sno', 'ASC'],
        ],
      }],
    };
    return super.findOne(filter);
  }

  findAllForView(approvalTemplateId) {
    const filter = {
      where: {
        id: approvalTemplateId,
      },
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        where: {
          active: 1,
        },
        required: false,
        include: [{
          model: db.ApprovalTemplateItemReminder,
          as: 'ATIRs',
          where: {
            active: 1,
          },
          required: false,
        }],
      }],
      order: [
        [{ model: db.ApprovalTemplateItem, as: 'ATIs' }, 'sno', 'ASC'],
      ],
    };
    return super.findOne(filter);
  }

  findAllForMaxApprovals(options) {
    const filter = {
      where: {},
      attributes: ['id', 'module', 'moduleAction'],
      include: [{
        model: db.ApprovalTemplateItem,
        as: 'ATIs',
        attributes: ['id'],
        where: {
          active: 1,
        },
      }],
    };
    if (options.module) {
      filter.where.module = options.module;
    }
    return super.findAll(filter);
  }

  findByATIId(options = {}) {
    if (!options.atiId) {
      return;
    }
    
    const filter = {
      where: {
        id: options.atiId
      },
    };
    return super.findAll(filter);
  }
}

export default ApprovalTemplateController;
