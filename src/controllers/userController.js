import { db, Op, sequelize } from '../models/index.js';
import BaseController from './baseController.js';

class UserController extends BaseController {
  constructor(customerId) {
    super(db.User, customerId);
    this.sequelize = sequelize;
  }

  findAllForListing(options = {}) {
    console.log('asasassasa', db);
    console.log('asasassasa2222222222', db);

    return super.findAll();
  }

  findOneByIdForView(userId) {
    const filter = {
      where: {
        id: userId,
      },
      include: [
        {
          model: db.User,
          as: 'Manager',
          attributes: ['id', 'email', 'name'],
          include: [
            {
              model: db.Role,
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: db.Role,
        },
        {
          model: db.UserAddressMapping,
          as: 'UAMs',
          separate: true,
          where: {
            active: 1,
          },
          required: false,
          include: [
            {
              model: db.Address,
              include: [
                {
                  model: db.CompanyAddressMapping,
                  as: 'CAMs',
                  where: {
                    active: 1,
                  },
                  required: false,
                  include: [
                    {
                      model: db.Company,
                      attributes: ['id', 'companyName'],
                    },
                  ],
                },
                {
                  model: db.BillingAddressMapping,
                  as: 'BAMs',
                  where: {
                    active: 1,
                  },
                  required: false,
                  include: [
                    {
                      model: db.Address,
                      as: 'BillingAddress',
                      attributes: ['id', 'keyword'],
                    },
                  ],
                },
                {
                  model: db.Address,
                  as: 'DefaultBillingAddress',
                  attributes: ['id', 'keyword'],
                },
              ],
              where: {
                status: ['active'],
              },
              // required: false,
            },
          ],
        },
      ],
    };
    return super.findOne(filter);
  }
}

export default UserController;
