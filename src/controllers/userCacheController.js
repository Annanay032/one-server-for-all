import BaseController from './baseController.js';
import { db } from '../models/index.js';


class UserCacheController extends BaseController {
  constructor(customerId, transaction) {
    super(db.UserCache, customerId, { transaction });
  }

  findOneByUserId(userId) {
    const filter = {
      where: {
        userId,
      },
    };
    return super.findOne(filter);
  }

  markInactiveByUserId(userId) {
    return super.update({ active: 0 }, {
      where: {
        userId,
      },
    });
  }

  bulkMarkInactiveByUserId(userIds) {
    return super.update({ active: 0 }, {
      where: {
        userId: userIds,
      },
    });
  }

  markInactiveByCustomerId(customerId) {
    return super.update({ active: 0 }, {
      where: {
        customerId,
      },
    });
  }
}

export default UserCacheController;
