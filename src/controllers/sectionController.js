import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class SectionController extends BaseController {
  constructor(customerId, transaction) {
    super(db.Section, customerId, { individualHooks: true, transaction });
  }

  findAllForListing(options) {
    const filter = {
      where: {
        active: 1,
      },
    };
    if (options.startswith) {
      filter.where.name = {
        [Op.ilike]: `%${options.startswith}%`,
      };
    }
    if (options.query) {
      filter.where.name = {
        [Op.iLike]: `%${options.query}%`,
      };
    }
    return super.findAndCountAll(filter);
  }

  findAllForSearch(options) {
    const filter = {
      where: {
        active: 1,
      },
      attributes: [['id', 'value'], ['companyName', 'label'], 'code'],
    };
    if (options.query) {
      filter.where.name = {
        [Op.iLike]: `%${options.query}%`,
      };
    }
    return super.findAll(filter);
  }

  findAllWithCustomerId(customerId) {
    const filter = {
      where: {
        customerId,
      },
    };
    return super.findAll(filter);
  }

  findOneByReference(reference) {
    const filter = {
      where: {
        reference,
      },
      // attributes: ['id', 'name'],
    };
    return super.findOne(filter);
  }

  findAllByReferences(references) {
    const filter = {
      where: {
        reference: references,
      },
    };
    return super.findAll(filter);
  }

  findOneByCustomerId(customerId) {
    const filter = {
      where: {
        customerId,
      },
      // attributes: ['id', 'name'],
    };
    return super.findOne(filter);
  }

  findOneByIdWithAttributes(companyId, attributes) {
    const filter = {
      where: {
        id: companyId,
      },
      attributes,
    };
    return super.findOne(filter);
  }

  findAllBySlugs(distintSlugs) {
    const filter = {
      where: {
        slug: distintSlugs,
        active: 1,
      },
      attributes: ['id', 'slug', 'name', 'code'],
    };
    return super.findAll(filter);
  }
}
export default SectionController;
