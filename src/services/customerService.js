import jwt from 'jsonwebtoken';
import * as BBPromise from 'bluebird';
import utils from '../../helpers/utils';

import config from '../../config';
import CustomerController from '../controllers/customerController';
import AuthController from '../controllers/authController';
import SeriesController from '../controllers/seriesController';
import CompanyController from '../controllers/companyController';
import ModuleCodeConfigurationController from '../controllers/moduleCodeConfigurationController';
import { ValidationError } from '../../helpers/customError';

import userAuthHelper from '../../helpers/userAuthHelper';
import userService from './userService';

const customerService = {};

customerService.changeUserProfile = async (values, authUser, customerId) => {
  if (!values.email) {
    throw new ValidationError('Email or password not present');
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByEmailForLogin(values.email.trim());
  if (!uniqueUser) {
    throw new ValidationError('User Account does not exist - Please contact your System Admin');
  }
  if (!uniqueUser.registeredAt) {
    throw new ValidationError('User email address is not registered - Please check input correct emailAddress');
  }
  // Helper
  const userDetails = await userAuthHelper.getUserCredentials(uniqueUser.id, '', uniqueUser.defaultUserId, authUser);
  const auth = { customerId: userDetails.customerId };
  const timeStampHash = values.profileToken || '';

  const userProfile = await userService.findOneByIdWithCustomerForProfile(userDetails.id, timeStampHash, auth);
  let userInfo = userProfile.data;
  if (userProfile.data.notModified) {
    userInfo = userProfile.data.user;
    delete userProfile.user;
  }
  const token = jwt.sign({
    customerId: userInfo.customerId,
    userId: userInfo.id,
    User: {
      name: userInfo.name,
    },
    Customer: {
      name: userInfo.Customer.name,
      code: userInfo.Customer.code,
    },
  }, config.app.capp.auth.jwtSecret, {
    expiresIn: 10 * 24 * 60 * 60,
  });
  return {
    auth: true,
    token,
    user: userProfile.data,
    userId: userInfo.id,
  };
};

customerService.getAllUserDefinedFields = customerId => {
  const customerController = new CustomerController();
  return customerController.findOneByIdForUserDefinedFields(customerId);
};

customerService.getAllSupplierEnabledModules = async customerId => {
  const customerController = new CustomerController();
  let modules = await customerController.findOneByIdForSupplierEnabledModules(customerId);
  modules = modules.supplierEnabledModules;
  if (!modules.length) {
    modules = ['inwards', 'supplier-quote-requests', 'supplier-auction-requests', 'purchase-orders', 'rate-contracts', 'invoices', 'supplier-onboarding'];
  }
  modules.push('others');
  modules.push('admin');
  return modules;
};

const zeroPad = (num, places) => String(num).padStart(places, '0');

// eslint-disable-next-line consistent-return
customerService.getNextTransacationCode = async (transaction, companyId, method, auth) => {
  const seriesController = new SeriesController(auth.customerId);
  const customerController = new CustomerController();
  const customer = await customerController.findOneByIdForCustomeFields(auth.customerId, 'enableLineItemBillingAddress');
  const companyController = new CompanyController(auth.customerId, auth.transaction);
  const moduleCodeConfigurationController = new ModuleCodeConfigurationController(auth.customerId);
  const customCode = await moduleCodeConfigurationController.findOneCodeForTransaction(`${transaction}`);
  const customCodeMandatoryTransactions = ['rfq', 'bulk-rfq', 'rfi', 'auctions', 'requisition', 'prc', 'auction-comparison', 'quote-comparison'];
  if (customCodeMandatoryTransactions.includes(transaction) && customer.enableLineItemBillingAddress && !customCode) {
    throw new ValidationError('Invalid Action- Company Id not found');
  }
  if (method === 'SAVE') {
    if (transaction === 'purchaseOrder') return 'PO-DRAFT';
    if (['rfq', 'bulk-rfq'].includes(transaction)) return 'RFQ-DRAFT';
    if (transaction === 'auctions') return 'AUC-DRAFT';
    if (transaction === 'requisition') return 'PR-DRAFT';
    if (transaction === 'rateContract') {
      return 'RC-DRAFT';
    }
    if (transaction === 'rfi') {
      return 'RFI-DRAFT';
    }
    if (transaction === 'expense') return 'EXP-DRAFT';
    if (transaction === 'pettyCash') return 'PCE-DRAFT';
    if (transaction === 'travelExpense') return 'TE-DRAFT';
    if (transaction === 'travelRequest') return 'TRL-DRAFT';
  } else if (customCode) {
    let code = '';
    await BBPromise.mapSeries(customCode.CCSMs, async (item, index) => {
      if (index > 0 && index < customCode.CCSMs.length) {
        code += '-';
      }
      if (['module', 'customer', 'customField'].includes(item.CCMF.fieldType)) {
        code += item.label;
      } else if (item.CCMF.fieldType === 'company' && companyId) {
        const company = await companyController.findOneById(companyId);
        code += company.code;
      } else if (item.CCMF.fieldType === 'year') {
        let year = '';
        if (item.format === 'YY') {
          const date = new Date();
          year = utils.getShortYear(date);
        } else if (item.format === 'YYYY') {
          year = new Date().getFullYear();
        } else {
          year = utils.getCurrentFinancialYear();
        }
        code += year;
      } else if (item.CCMF.fieldType === 'number') {
        let nextValue = await moduleCodeConfigurationController.findNextValue(`${transaction}`, true);
        nextValue = zeroPad(nextValue, item.format);
        code += nextValue;
      }
    });
    return code;
  } else if (method === 'SUBMIT' && transaction === 'rateContract') {
    const nextValue = await seriesController.findNextRateContractValue();
    const company = await companyController.findOneById(companyId);
    const date = new Date();
    const year = utils.getShortYear(date);
    return `RC-${company ? `${company.code}-` : ''}${year}-${nextValue}`;
  } else if (method === 'SUBMIT' && transaction === 'purchaseOrder') {
    const date = new Date();
    const year = utils.getShortYear(date);
    const nextValue = await seriesController.findNextPurchaseOrderValue();
    const company = await companyController.findOneById(companyId);
    return `PO-${company.code}-${year}-${nextValue}`;
  } else if (method === 'SUBMIT' && transaction === 'auctions') {
    const date = new Date();
    const year = utils.getShortYear(date);
    const nextValue = await seriesController.findNextAuctionRequestValue();
    const company = await companyController.findOneById(companyId);
    return `AUC-${company.code}-${year}-${nextValue}`;
  } else if (method === 'SUBMIT' && ['rfq', 'bulk-rfq'].includes(transaction)) {
    const date = new Date();
    const year = utils.getShortYear(date);
    const nextValue = await seriesController.findNextQuoteRequestValue();
    const company = await companyController.findOneById(companyId);
    return `RFQ-${company.code}-${year}-${nextValue}`;
  } else if (method === 'SUBMIT' && transaction === 'requisition') {
    const date = new Date();
    const year = utils.getShortYear(date);
    const nextValue = await seriesController.findNextRequisitionValue();
    const company = await companyController.findOneById(companyId);
    return `PR-${company.code}-${year}-${nextValue}`;
  } else if (transaction === 'prc') {
    const nextValue = await seriesController.findNextRequisitionConversionValue();
    const company = await companyController.findOneById(companyId);
    const date = new Date();
    const year = utils.getShortYear(date);
    return `PRC-${company.code}-${year}-${nextValue}`;
  } else if (transaction === 'quote-comparison') {
    const nextValue = await seriesController.findNextQuoteComparisonValue();
    const company = await companyController.findOneById(companyId);
    const date = new Date();
    const year = utils.getShortYear(date);
    return `QCA-${company.code}-${year}-${nextValue}`;
  } else if (transaction === 'auction-comparison') {
    const nextValue = await seriesController.findNextAuctionComparisonValue();
    const company = await companyController.findOneById(companyId);
    const date = new Date();
    const year = utils.getShortYear(date);
    return `ACA-${company.code}-${year}-${nextValue}`;
  } else if (transaction === 'payment-voucher') {
    const seriesController = new SeriesController(auth.customerId);
    const nextValue = await seriesController.findNextPaymentVoucherValue();
    const date = new Date();
    const year = utils.getShortYear(date);
    return `PV-${auth.Customer.code}-${year}-${nextValue}`;
  } else if (transaction === 'expense') {
    const seriesController = new SeriesController(auth.customerId);
    const nextValue = await seriesController.findNextSeriesValue('Expense');
    const date = new Date();
    const year = utils.getShortYear(date);
    return `EXP-${auth.Customer.code}-${year}-${nextValue}`;
  } else if (transaction === 'pettyCash') {
    const seriesController = new SeriesController(auth.customerId);
    const nextValue = await seriesController.findNextSeriesValue('PettyCash');
    const date = new Date();
    const year = utils.getShortYear(date);
    return `PCE-${auth.Customer.code}-${year}-${nextValue}`;
  } else if (transaction === 'travelExpense') {
    const seriesController = new SeriesController(auth.customerId);
    const nextValue = await seriesController.findNextSeriesValue('TravelExpense');
    const date = new Date();
    const year = utils.getShortYear(date);
    return `TE-${auth.Customer.code}-${year}-${nextValue}`;
  } else if (transaction === 'travelRequest') {
    const seriesController = new SeriesController(auth.customerId);
    const nextValue = await seriesController.findNextSeriesValue('TravelRequest');
    const date = new Date();
    const year = utils.getShortYear(date);
    return `TRL-${auth.Customer.code}-${year}-${nextValue}`;
  } else if (method === 'SUBMIT' && transaction === 'rfi') {
    const date = new Date();
    const year = utils.getShortYear(date);
    const nextValue = await seriesController.findNextSeriesValue('InformationRequest');
    const company = await companyController.findOneById(companyId);
    return `RFI-${company.code}-${year}-${nextValue}`;
  }
};

export default customerService;
