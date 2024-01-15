import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class FieldController extends BaseController {
  constructor(customerId, transaction) {
    super(db.Field, customerId, { transaction });
  }

  findAllForListing(options) {
    const filter = {
      where: {
        delete: 0,
      },
    };
    const paginationOptions = {
      limit: options.limit,
      page: options.page,
    };
    return super.findAndCountAllWithPagination(filter, paginationOptions);
  }

  findOneByIdForView(fieldId) {
    const filter = {
      where: {
        id: fieldId,
      },
    };
    return super.findOne(filter);
  }

  findAllForSection(sectionId) {
    const filter = {
      where: {
        sectionId,
        delete: 0,
        active: 1,
      },
      attributes: ['id', 'label', 'labelSlug'],
    };
    return super.findAll(filter);
  }

  bulkMarkInactiveById(fieldIds) {
    return super.update(
      {
        active: 0,
      },
      {
        where: {
          id: fieldIds,
        },
      },
    );
  }

  findAllByKeys(keys) {
    const filter = {
      where: {
        key: keys,
      },
      attributes: ['id', 'key'],
    };
    return super.findAll(filter);
  }

  findAllBasedOnOptions(options = {}, attributes) {
    const filter = {
      where: options,
      attributes,
    };
    return super.findAll(filter);
  }

  findAllByValidationType(formId, validationType) {
    const filter = {
      where: {
        active: 1,
        delete: 0,
        validationType: {
          [Op.contains]: validationType,
        },
      },
      include: [
        {
          model: db.Section,
          where: {
            active: 1,
            delete: 0,
            formId,
          },
          attributes: ['id'],
        },
      ],
      attributes: [
        'id',
        'validation',
        'validationType',
        'isOrgLevel',
        'fieldKey',
        'tableReference',
        'label',
        'labelSlug',
      ],
    };
    return super.findAll(filter);
  }

  updateById(values, id) {
    // if (values.customerId) {
    //   throw new Error('cappController - Invalid customer ID update');
    // }
    const options = {
      where: {
        id,
        // customerId: this.customerId,
      },
      // individualHooks: this.individualHooks,
    };
    return this.model.update(values, options);
  }

  updateBySectionId(values, sectionId) {
    // if (values.customerId) {
    //   throw new Error('cappController - Invalid customer ID update');
    // }
    const options = {
      where: {
        sectionId,
        // customerId: this.customerId,
      },
      // individualHooks: this.individualHooks,
    };
    return this.model.update(values, options);
  }
}

export default FieldController;
