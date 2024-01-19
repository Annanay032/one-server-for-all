/* eslint-disable @typescript-eslint/no-explicit-any */
// import { mapSeries } from 'bluebird';
import uuid4 from 'uuid4';

import utils from '../helpers/utils.js';
import FieldController from '../controllers/fieldController.js';
// import SectionController from '../controllers/sectionController';
import { ValidationError } from '../helpers/customError.js';
// import fieldHelper from '../helpers/fieldsHelper';
// import transactionTemplateService from './transactionTemplateService';
import CustomModuleController from '../controllers/customModuleController.js';
import CustomTransactionController from '../controllers/customTransactionController.js';
import CustomTransactionFrController from '../controllers/customTransactionFrController.js';

// const Joi = require('joi');

const customTransactionService = {};

customTransactionService.findAllForListing = async (options, auth) => {
  console.log('reeeeeeeeeeeeefdededssdsd', options);
  const customModuleController = new CustomModuleController(auth.customerId);
  const customModuleSlug = await customModuleController.findOneBySlugForView(
    options.slugName,
  );
  const customTransactionController = new CustomTransactionController(
    auth.customerId,
  );
  const customTransactions = await customTransactionController.findAllForListing(customModuleSlug.id);

  const customTransactionsData = customTransactions.map(ct => {
    const data = {
      ...ct.toJSON(),
    };
    data.CustomTransactionFrs.forEach(ctfr => {
      Object.entries(ctfr.fieldsResponses).forEach(([key, value]) => {
        data[key] = value;
      });
    });
    delete data.CustomTransactionFrs;

    return data;
  });

  return {
    data: customTransactionsData,
  };
};

customTransactionService.create = async (values, auth) => {
  console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeevalues', values);

  const customTransactionController = new CustomTransactionController(
    auth.customerId,
  );
  const customTransactionFrController = new CustomTransactionFrController(
    auth.customerId,
  );

  const newCustomTransactionValues = utils.copyKeys(values, [
    'sectionsMap',
    'customModuleId',
    'customTransactionFr',
    'userId',
    'sectionOrderMap',
  ]);
  const customTransaction = await customTransactionController.create(
    newCustomTransactionValues,
  );
  if (!customTransaction) {
    throw new ValidationError();
  }

  const frData = [];
  Object.entries(newCustomTransactionValues.customTransactionFr).forEach(
    ([key, value]) => {
      frData.push({ ...value, customTransactionId: customTransaction.id });
    },
  );

  customTransactionFrController.bulkCreate(frData);

  return customTransaction;
};


customTransactionService.findOneByIdForView = async (ctId, auth) => {
  const customTransactionController = new CustomTransactionController(auth.customerId);
  const customTransaction = await customTransactionController.findOneByIdForView(
    ctId,
  );
  return customTransaction;
};

export default customTransactionService;
