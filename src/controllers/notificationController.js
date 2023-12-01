import { db, Op, sequelize } from '../models/index.js';
import BaseController from './baseController.js';

class NotificationController extends BaseController {
  constructor() {
    super(db.Notification);
    this.sequelize = sequelize;
  }

  findAllForListing(options = {}) {
    return super.findAll();
  }

  updateAll(values, options = {}) {
    return super.update(values, options);
  }
}

export default NotificationController;
