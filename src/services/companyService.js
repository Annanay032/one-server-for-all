import utils from '../helpers/utils.js';
import { ValidationError } from '../helpers/customError.js';
import userCacheService from './userCacheService.js';

import CompanyController from '../controllers/companyController.js';

const companyService = {};

companyService.findAllForListing = async (options, auth) => {
  const companyController = new CompanyController(auth.customerId);
  const ret = await companyController.findAllForListing(options);
  return {
    data: ret.rows,
    meta: {
      count: ret.count,
    },
  };
};

companyService.findOneByIdForView = (companyId, auth) => {
  const companyController = new CompanyController(auth.customerId);
  return companyController.findOneById(companyId);
};

companyService.create = async (values, auth) => {
  if ((!values.name || values.name === '') || (!values.code || values.code === '')) {
    throw new ValidationError('Invalid action - Mandatory fields not present');
  }
  const companyController = new CompanyController(auth.customerId);
  const newValues = utils.copyKeys(values, ['name', 'code', 'logoUrl', 'primary', 'reference']);
  const company = await companyController.create(newValues);
  await userCacheService.markInactiveByCustomerId(auth.customerId);
  return companyController.findOneById(company.id);
};

companyService.update = async (values, companyId, auth) => {
  if ((!values.name || values.name === '') || (!values.code || values.code === '')) {
    throw new ValidationError('Invalid action - Mandatory fields not present');
  }
  const companyController = new CompanyController(auth.customerId);
  const updateValues = utils.copyKeys(values, ['name', 'code', 'logoUrl', 'primary', 'reference']);
  await companyController.updateById(updateValues, companyId);
  await userCacheService.markInactiveByCustomerId(auth.customerId);
  return companyController.findOneById(companyId);
};

companyService.findAllForAddress = async (options, auth) => {
  const companyController = new CompanyController(auth.customerId);
  const comOptions = await companyController.findAllForSearch(options);
  return comOptions.map(comData => {
    const com = comData.toJSON();
    return ({
      ...com,
      label: `${com.label} (${com.code})`,
    });
  });
}

companyService.findOneByReference = (reference, auth) => {
  const companyController = new CompanyController(auth.customerId);
  return companyController.findOneByReference(reference);
};

companyService.findAllByReferences = (references, auth) => {
  const companyController = new CompanyController(auth.customerId);
  return companyController.findAllByReferences(references);
};

companyService.findOneByCustomerId = auth => {
  const companyController = new CompanyController(auth.customerId);
  return companyController.findOneByCustomerId(auth.customerId);
};

companyService.findAllWithCustomerId = auth => {
  const companyController = new CompanyController(auth.customerId);
  return companyController.findAllWithCustomerId(auth.customerId);
};

export default companyService;
