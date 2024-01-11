import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class CustomModuleController extends BaseController {
  constructor(customerId, transaction) {
    super(db.CustomModule, customerId, { individualHooks: true, transaction });
  }

  findAllForListing(options) {
    const filter = {
      where: {
        active: true,
      },
      include: [{
        model: db.User,
        attributes: ['id', 'name'],
      },
      {
        model: db.Section,
        attributes: ['id', 'sectionName'],
      }],
    };
    // if (options.startswith) {
    //   filter.where.name = {
    //     [Op.ilike]: `%${options.startswith}%`,
    //   };
    // }
    // if (options.query) {
    //   filter.where.name = {
    //     [Op.iLike]: `%${options.query}%`,
    //   };
    // }
    return super.findAll(filter);
  }

  findAllForSearch(options) {
    const filter = {
      where: {
        active: true,
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

  findOneByIdWithAttributes(cmId, attributes) {
    const filter = {
      where: {
        id: cmId,
      },
      attributes,
    };
    return super.findOne(filter);
  }

  findAllBySlugs(distintSlugs) {
    const filter = {
      where: {
        slug: distintSlugs,
        active: true,
      },
      attributes: ['id', 'slug', 'name', 'code'],
    };
    return super.findAll(filter);
  }

  findOneByIdForView(cmId, options = {}) {
    const modalAccessFilter = {
      active: true,
      [Op.or]: [
        {
          roleId: +options.roleId,
        },
        {
          userId: +options.userId,
        },
      ],
    };
    const filter = {
      where: {
        id: cmId,
      },
      include: [
        {
          model: db.Section,
          where: {
            active: true,
          },
          required: false,
          separate: true,
          include: [
            {
              model: db.Field,
              required: false,
              separate: true,
              where: {
                active: true,
              },
            },
          ],
        },
        {
          model: db.ModuleAccess,
          where: modalAccessFilter,
          required: false,
          separate: true,
        },
      ],
    };
    return super.findOne(filter);
  }
}

export default CustomModuleController;

// required -- true if section - empty then cm will not come
// required -- false if section - empty then cm : section : [] will come
// separate -- works simmilar to Prosime, promise.all
// seprate true , required true not possible
