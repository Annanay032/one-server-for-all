import _set from 'lodash/set.js';
import { db, Op, sequelize } from '../models/index.js';

class CustomerController {
  constructor() {
    this.model = db.Customer;
  }

  create(values, options = {}) {
    // _set(options, 'individualHooks', this.individualHooks);
    return this.model.create(values, options);
  }

  findOne(options = {}) {
    return this.model.findOne(options);
  }

  findOneById(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
    };
    return this.model.findOne(filter);
  }

  findNextModuleValue(customerId, config) {
    return sequelize.transaction(async t => {
      const customer = await this.model.findOne({
        where: {
          id: customerId,
        },
        // attributes: ['id', config], // if we add attribute save won't work and with out transaction lock we can not complete the task
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      const moduleConfig = customer[config];
      const nextSeries = moduleConfig.currentSerialNumber + 1;
      _set(moduleConfig, 'currentSerialNumber', nextSeries);
      _set(customer, config, moduleConfig);
      await customer.save({
        transaction: t,
      });
      return nextSeries;
    });
  }

  findOneByIdForUser(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      attributes: [
        'id',
        'name',
        'gstin',
        'code',
        'primaryContactName',
        'primaryContactMobile',
        'primaryContactLandline',
        'domain',
        'logoUrl',
        'registeredAddressId',
        'primaryCompanyId',
        'chatVisibility',
        'supportChatVisibility',
        'defaultCountryCode',
        // 'defaultNumberConvention',
        'disableLoginwithPassword',
      ],
      include: [
        {
          model: db.Company,
          include: [
            {
              model: db.CompanyAddressMapping,
              as: 'CAMs',
              attributes: ['id', 'active'],
              include: [
                {
                  model: db.Address,
                  attributes: ['id', 'keyword'],
                },
              ],
            },
          ],
        },
        {
          model: db.Company,
          as: 'PrimaryCompany',
        },
        // {
        //   model: db.Currency,
        //   required: false,
        //   where: {
        //     active: 1,
        //   },
        // },
        // {
        //   model: db.Currency,
        //   as: 'BaseCurrency',
        // },
      ],
    };
    return this.model.findOne(filter);
  }

  updateById(values, customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      individualHooks: true,
    };
    return this.model.update(values, filter);
  }

  findAllCurrenciesForListing(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      include: [
        {
          model: db.Currency,
        },
      ],
    };
    return this.model.findAll(filter);
  }

  findAllCompaniesAndAddress(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      include: [
        {
          model: db.Company,
          attributes: ['id', 'name'],
        },
        {
          model: db.Address,
          // as: 'DeliveryAddress',
          attributes: ['id', 'keyword', 'name'],
        },
      ],
      attributes: ['id', 'name', 'code'],
    };
    return this.model.findOne(filter);
  }

  findAllWithIds() {
    const filter = {
      where: {},
      attributes: ['id'],
    };
    return this.model.findAll(filter);
  }

  findOneByIdWithPrimaryCompany(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      include: [
        {
          model: db.Company,
          as: 'PrimaryCompany',
          attributes: ['id', 'code'],
        },
      ],
      attributes: ['id', 'primaryCompanyId'],
    };
    return this.model.findOne(filter);
  }

  findOneByIdWithIpGenerationDate(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      attributes: ['id', 'ipGenerationDate'],
    };
    return this.model.findOne(filter);
  }

  findOneByIdForCustomeFields(customerId, type) {
    const filter = {
      where: {
        id: customerId,
      },
      attributes: ['id', `${type}`],
    };
    return this.model.findOne(filter);
  }

  findOneByIdWithAttributes(customerId, attributes) {
    const filter = {
      where: {
        id: customerId,
      },
      attributes,
    };
    return this.model.findOne(filter);
  }

  findOneWithDomain(domain) {
    const filter = {
      where: {
        domain,
        disableLoginwithPassword: 1,
      },
      attributes: ['disableLoginwithPassword'],
    };
    return this.model.findOne(filter);
  }

  fineOneWithBaseCurrency(customerId) {
    const filter = {
      where: {
        id: customerId,
      },
      attributes: ['id'],
      include: [
        {
          model: db.Currency,
          as: 'BaseCurrency',
          attributes: ['symbol'],
        },
      ],
    };
    return this.model.findOne(filter);
  }
}

export default CustomerController;
