import { db, Op, sequelize } from '../models/index.js';
import BaseController from './baseController.js';

class NotificationController extends BaseController {
  constructor(customerId) {
    super(db.Notification, customerId);
    this.sequelize = sequelize;
  }

  updateById(values, id) {
    // if (values.customerId) {
    //   throw new Error('cappController - Invalid customer ID update');
    // }
    const options = {
      where: {
        id,
      },
      // individualHooks: this.individualHooks,
    };
    return this.model.update(values, options);
  }


  findAllForListing(options = {}) {
    return super.findAll();
  }

  updateAll(values, options = {}) {
    return super.update(values, options);
  }
}

export default NotificationController;
