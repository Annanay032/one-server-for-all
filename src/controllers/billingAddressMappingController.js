import BaseController from './baseController.js';
import { db } from '../models/index.js';

class BillingAddressMappingController extends BaseController {
  constructor(customerId, transaction) {
    super(db.BillingAddressMapping, customerId, { transaction });
  }

  bulkMarkInactiveById(bamIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        id: bamIds,
      },
    });
  }

  bulkMarkActiveById(bamIds) {
    return super.update({
      active: 1,
    }, {
      where: {
        id: bamIds,
      },
    });
  }
}

export default BillingAddressMappingController;
