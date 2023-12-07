import _set from 'lodash/set.js';

class BaseController {
  constructor(model, customerId = null, individualHooks = false) {
    console.log('hgfdsds', model, customerId);
    if (!model) {
      throw new Error('Base Controller - Cannot initialize without model');
    }
    if (!customerId) {
      throw new Error(
        'Base Controller - Cannot initialize without customer ID',
      );
    }
    this.customerId = customerId;
    this.model = model;
    this.individualHooks = individualHooks;
  }

  create(values, options = {}) {
    if (!values.customerId) {
      _set(values, 'customerId', this.customerId);
    }
    // _set(options, 'individualHooks', this.individualHooks);
    console.log('hgfdd444444444444444444444', values)
    return this.model.create(values, options);
  }

  delete(options = {}) {
    // _set(values, 'customerId', this.customerId);
    // _set(options, 'individualHooks', this.individualHooks);
    return this.model.destroy(options);
  }

  bulkCreate(records, options = {}) {
    const bulkCreateArray = records.map(record => {
      _set(record, 'customerId', this.customerId);
      return record;
    });
    _set(options, 'individualHooks', this.individualHooks);
    return this.model.bulkCreate(bulkCreateArray, options);
  }

  findOne(options = {}) {
    _set(options, 'where.customerId', this.customerId);
    return this.model.findOne(options);
  }

  findOneById(id) {
    console.log('hgfdsds33333333333333333333333333', this.customerId);

    const options = {
      where: {
        id,
        customerId: this.customerId,
      },
    };
    return this.model.findOne(options);
  }

  getInstanceById(id) {
    const options = {
      attributes: ['id'],
      where: {
        id,
        customerId: this.customerId,
      },
    };
    return this.model.findOne(options);
  }

  findAll(options = {}) {
    _set(options);
    // if (!options.order) {
    //   _set(options, 'order', [['id', 'DESC']]);
    // }
    return this.model.findAll(options);
  }

  findAllWithPagination(options = {}, paginationOptions = {}) {
    _set(options, 'where.customerId', this.customerId);
    if (!options.order) {
      _set(options, 'order', [['id', 'DESC']]);
    }
    // Pagination options processing
    let queryLimit = 20;
    let queryOffset = 0;
    if (
      paginationOptions.limit
      && paginationOptions.limit > 0
      && paginationOptions.limit <= 100
    ) {
      queryLimit = paginationOptions.limit;
    }
    if (paginationOptions.page && paginationOptions.page > 1) {
      queryOffset = (paginationOptions.page - 1) * queryLimit;
    }
    if (!options.limit) {
      _set(options, 'limit', queryLimit);
    }
    if (!options.offset) {
      _set(options, 'offset', queryOffset);
    }

    return this.model.findAll(options);
  }

  findAndCountAll(options = {}) {
    _set(options, 'where.customerId', this.customerId);
    if (!options.order) {
      _set(options, 'order', [['id', 'DESC']]);
    }
    return this.model.findAndCountAll(options);
  }

  findAndCountAllWithPagination(options = {}, paginationOptions = {}) {
    _set(options, 'where.customerId', this.customerId);
    if (!options.order) {
      _set(options, 'order', [['id', 'DESC']]);
    }
    // Pagination options processing
    let queryLimit = 20;
    let queryOffset = 0;
    if (
      paginationOptions.limit
      && paginationOptions.limit > 0
      && paginationOptions.limit <= 100
    ) {
      queryLimit = paginationOptions.limit;
    }
    if (paginationOptions.page && paginationOptions.page > 1) {
      queryOffset = (paginationOptions.page - 1) * queryLimit;
    }
    if (!options.limit) {
      _set(options, 'limit', queryLimit);
    }
    if (!options.offset) {
      _set(options, 'offset', queryOffset);
    }

    return this.model.findAndCountAll(options);
  }

  update(values, options = {}) {
    if (!values.customerId) {
      throw new Error('Base Controller - Invalid customer ID update');
    }
    _set(options, 'where.customerId', this.customerId);
    // _set(options, 'individualHooks', this.individualHooks);
    return this.model.update(values, options);
  }

  upsert(values, options = {}) {
    _set(options, 'where.customerId', this.customerId);
    _set(options, 'individualHooks', this.individualHooks);
    return this.model.upsert(values, options);
  }

  updateById(values, id) {
    // if (values.customerId) {
    //   throw new Error('cappController - Invalid customer ID update');
    // }
    const options = {
      where: {
        id,
        customerId: this.customerId,
      },
      // individualHooks: this.individualHooks,
    };
    return this.model.update(values, options);
  }

  count(options = {}) {
    _set(options, 'where.customerId', this.customerId);
    return this.model.count(options);
  }

  aggregate(attribute, aggregateFn, options = {}) {
    _set(options, 'where.customerId', this.customerId);
    return this.model.aggregate(attribute, aggregateFn, options);
  }
}

export default BaseController;
