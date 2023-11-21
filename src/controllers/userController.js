import { db, Op, sequelize } from '../models/index.js';
import BaseController from './baseController.js';

class UserController extends BaseController {
  constructor() {
    super(db.User);
    this.sequelize = sequelize;
  }

  findAllForListing(options = {}) {
    console.log('asasassasa', db);
    console.log('asasassasa2222222222', db);

    return super.findAll();
  }
}

export default UserController;
