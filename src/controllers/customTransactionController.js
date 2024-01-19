import BaseController from './baseController.js';
import { db, Op } from '../models/index.js';

class CustomTransactionController extends BaseController {
  constructor(customerId, transaction) {
    super(db.CustomTransaction, customerId, { individualHooks: true, transaction });
  }

  findAllForListing(customModuleId) {
    const filter = {
      where: {
        active: true,
        customModuleId,
      },
      include: [{
        model: db.CustomTransactionFr,
        where: {
          sectionType: 'nonTableSection',
        },
        attributes:['fieldsResponses'],
      },
      {
        model: db.User,
        attributes:['id', 'name'],
      }],
      attributes: ['id', 'customModuleId', 'active'],
    };
    return super.findAll(filter);
  }

  findOneByIdForView(customTransactionId) {
    const filter = {
      where: {
        active: true,
        id: customTransactionId,
      },
      include: [{
        model: db.CustomTransactionFr,
        // where: {
        //   sectionType: 'nonTableSection',
        // },
        // attributes: ['fieldsResponses'],
      },
      // {
      //   model: db.User,
      //   attributes: ['id', 'name'],
      // }
    ],
      // attributes: ['id', 'customModuleId', 'active'],
    };
    return this.model.findOne(filter);
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
export default CustomTransactionController;
