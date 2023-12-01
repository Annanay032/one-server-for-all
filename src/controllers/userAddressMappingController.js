import BaseController from './baseController.js';
import { db } from '../models/index.js';

class UserAddressMappingController extends BaseController {
  constructor(customerId, transaction) {
    super(db.UserAddressMapping, customerId, { transaction });
  }

  bulkMarkInactiveById(uamIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        id: uamIds,
      },
    });
  }

  bulkMarkActiveById(uamIds) {
    return super.update({
      active: 1,
    }, {
      where: {
        id: uamIds,
      },
    });
  }

  bulkMarkInactiveByUserId(userId) {
    return super.update({
      active: 0,
    }, {
      where: {
        userId,
        active: 1,
      },
    });
  }

  bulkMarkActiveByUserId(userId) {
    return super.update({
      active: 1,
    }, {
      where: {
        userId,
        active: 0,
      },
    });
  }

  findAllActiveByUserId(userId) {
    const filter = {
      where: {
        userId,
        active: 1,
      },
      attributes: ['id'],
      include: [{
        model: db.Address,
        attributes: ['id', 'name', 'keyword', 'isBillingAddress', 'defaultBillingAddressId'],
        include: [{
          model: db.BillingAddressMapping,
          as: 'BAMs',
          where: {
            active: 1,
          },
          required: false,
        }],
      }],
    };
    return super.findAll(filter);
  }

  findAllActiveByUserIdsForAddress(userIds, addressId) {
    const filter = {
      where: {
        userId: userIds,
        active: 1,
        addressId,
      },
    };
    return super.findAll(filter);
  }

  findAllActiveByRoleWithAddressId(roleIds, addressIds) {
    const filter = {
      where: {
        active: 1,
        addressId: addressIds,
      },
      attributes: ['userId', 'addressId'],
      include: [{
        model: db.User,
        where: {
          roleId: roleIds,
          addressAdmin: 0,
        },
        attributes: [],
      }],
    };
    return super.findAll(filter);
  }

  findAllByUserId(userId) {
    const filter = {
      where: {
        userId,
        active: 1,
      },
      attributes: ['id', 'addressId'],
    };
    return super.findAll(filter);
  }
}

export default UserAddressMappingController;
