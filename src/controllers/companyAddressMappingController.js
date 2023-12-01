import BaseController from './baseController.js';
import { db } from '../models/index.js';

class CompanyAddressMappingController extends BaseController {
  constructor(customerId, transaction) {
    super(db.CompanyAddressMapping, customerId, { transaction });
  }

  bulkMarkInactiveById(camIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        id: camIds,
      },
    });
  }

  bulkMarkActiveById(camIds) {
    return super.update({
      active: 1,
    }, {
      where: {
        id: camIds,
      },
    });
  }

  bulkDeleteByIds(camIds) {
    return super.update({
      active: 0,
    }, {
      where: {
        id: camIds,
      },
    });
  }
}

export default CompanyAddressMappingController;
