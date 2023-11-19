import { db, Op, sequelize } from '../models/index.js';
import BaseController from './baseController.js';

class UserController extends BaseController {
    constructor() {
      super(db.user);
      this.sequelize = sequelize;
    }

    findAllForListing(options = {}) {
        console.log('asasassasa', db)
        const filter = {
          distinct: true,
          where: {},
        };
        return super.findAll(filter);
      }

}


export default UserController;
