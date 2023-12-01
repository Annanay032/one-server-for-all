import _set from 'lodash/set.js';
import { db, Op } from '../models/index.js';

class UniqueUserController {
  constructor() {
    this.model = db.UniqueUser;
  }

  findOneByEmail(email) {
    const filter = {
      where: {
        email: {
          [Op.iLike]: email,
        },
      },
    };
    return this.model.findOne(filter);
  }

  create(values, options = {}) {
    _set(options, 'individualHooks', true);
    return this.model.create(values, options);
  }

  findAllUserCustomerMappings(uniqueId) {
    const filter = {
      where: {
        id: uniqueId,
      },
      include: [{
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'uniqueIdentifier'],
      }, {
        model: db.User,
        attributes: ['id', 'name', 'customerId', 'active', 'uniqueUserId', 'uniqueIdentifier'],
        include: [{
          model: db.Customer,
          attributes: ['id', 'name', 'logoUrl', 'code', 'disableLoginwithPassword'],
        }],
      }],
    };
    return this.model.findOne(filter);
  }

  updateById(values, id) {
    const options = {
      where: {
        id,
      },
      individualHooks: true,
    };
    return this.model.update(values, options);
  }

  findAllActiveUserCustomerMappings(uniqueId) {
    const filter = {
      where: {
        id: uniqueId,
      },
      include: [{
        model: db.User,
        where: {
          active: 1,
        },
        required: false,
        attributes: ['id', 'name', 'customerId'],
      }],
    };
    return this.model.findOne(filter);
  }

  findAllActiveUsersOfCustomerWithSurvey(uniqueId) {
    const filter = {
      where: {
        id: uniqueId,
      },
      include: [{
        model: db.User,
        where: {
          active: 1,
        },
        attributes: ['id', 'name', 'customerId'],
        include: [{
          model: db.Customer,
          where: {
            enableSurvey: 1,
          },
          attributes: ['id', 'name', 'enableSurvey'],
        }],
      }],
    };
    return this.model.findOne(filter);
  }
}

export default UniqueUserController;
