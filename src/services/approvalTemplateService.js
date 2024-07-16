import * as BBPromise from 'bluebird';
import _set from 'lodash/set.js';
import _get from 'lodash/get.js';

// import { DimensionalFields, DimensionalKeyFields, RequisitionTransactionFieldKeyMappings, TransactionSystemFields, TravelRequestTransactionFieldKeyMappings, ExpenseTransactionFieldKeyMappings, TransactionTypes, FieldTypes, StockInwardTransactionFieldKeyMappings, TransactionLogIdentifier, ProductTransactionFieldKeyMappings, RateContractTransactionFieldKeyMappings, InvoiceTransactionFieldKeyMappings, BudgetTransactionFieldKeyMappings, AppTransactionFieldKeyMappings, BoqTransactionFieldKeyMappings } from '../../helpers/constants';
import { db } from '../models/index.js';
import { ResourceNotFoundError, ValidationError } from '../helpers/customError.js';
import utils from '../helpers/utils.js';
// import atiRuleHelper from '../../helpers/atiRuleHelper';
// import { getTransactionFields } from '../../helpers/quoteRequestUtils';

import ApprovalTemplateController from '../controllers/approvalTemplateController.js';
import RoleController from '../controllers/roleController.js';
// import InvoiceController from '../controllers/invoiceController';
import ApprovalController from '../controllers/approvalController.js';
import ApprovalTemplateItemController from '../controllers/approvalTemplateItemController.js';
import UserController from '../controllers/userController.js';
import ApprovalUserMappingController from '../controllers/approvalUserMappingController.js';

// import entityUserMappingService from './entityUserMappingService';
import approvalService from './approvalService.js';
import approvalTemplateItemService from './approvalTemplateItemService.js';
import approvalUserMappingService from './approvalUserMappingService.js';
// import eventService from '../../commons/services/eventService';
// import transactionLogService from '../../commons/services/transactionLogService';
// import grootService from './grootService';
// import notificationService from '../../commons/services/notificationService';
import masterCurrencyService from '../commons/services/currencyService.js';
import CustomerController from '../controllers/customerController.js';
// import UserDepartmentMappingController from '../controllers/userDepartmentMappingController';
// import UserCostCentreMappingController from '../controllers/userCostCentreMappingController';
// import UserLedgerMappingController from '../controllers/userLedgerMappingController';
// import UserAddressMappingController from '../controllers/userAddressMappingController';
// import UserDimensionOneMappingController from '../controllers/userDimensionOneMappingController';
// import UserDimensionTwoMappingController from '../controllers/userDimensionTwoMappingController';
// import UserDimensionThreeMappingController from '../controllers/userDimensionThreeMappingController';
import userApprovalsUtils from '../commons/services/userApprovalsUtils.js';
// import { getTransactionalFieldsForApprovalTemplates } from '../../helpers/purchaseOrderUtils';
// import FormController from '../controllers/formController';
// import UserSupplierCategoryMappingController from '../controllers/userSupplierCategoryMappingController';
// import PurchaserCategoryMappingController from '../controllers/purchaserCategoryMappingController';

const approvalTemplateService = {};

// const createEvent = (values, auth) => eventService.create(values, auth);

approvalTemplateService.validateModuleApprovalPayload = async approvals => {
  if (!approvals.moduleAction) {
    throw new ValidationError('Module Action is mandatory');
  }
  if (!approvals.sequences) {
    throw new ValidationError('Approval Seqeunces are mandatory');
  }
  if (approvals.sequences.length === 0) {
    throw new ValidationError('Invalid - approval sequences cannot be empty');
  }
  approvals.sequences.forEach(approval => {
    if (!approval.approvers || approval.approvers.length === 0) {
      throw new ValidationError('Approvers missing in approval');
    }
    approval.approvers.forEach(approver => {
      if (!approver.userId) {
        throw new ValidationError('User id missing for approver');
      }
    });
    if (approval.moduleActionAttributes && approval.moduleActionAttributes.length === 0) {
      throw new ValidationError('Invalid - moduleActionAttributes are mandatory for an approval sequence');
    }
    if (!approval.approvalTemplateItemId) {
      throw new ValidationError('Invalid action - Missing Approval Template configuration item');
    }
  });
};

const bulkCreateApprovals = async (records, transactionId, type, action, auth) => {
  const approvalController = new ApprovalController(auth.customerId);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
  const userController = new UserController(auth.customerId);
  await BBPromise.mapSeries(records, async (record, index) => {
    const approvalTemplateItem = await approvalTemplateItemController.findOneByIdWithReminders(record.approvalTemplateItemId);
    const newRecord = utils.copyKeys(record, ['approvers']);
    newRecord.sequence = index + 1;
    const roleIdSet = new Set();
    const userIdSet = new Set();
    record.approvers.forEach(app => {
      userIdSet.add(app.userId);
    });
    newRecord.approvalTemplateItemId = record.approvalTemplateItemId;
    if (index === 0) {
      newRecord.approvalStartTime = new Date();
    }
    if (type === 'invoice' && action === 'dispute') {
      newRecord.disputeInvoiceId = transactionId;
      newRecord.moduleActionAttributes = record.moduleActionAttributes ? record.moduleActionAttributes : [];
    }
    newRecord.userIds = [...userIdSet];
    const attributes = ['id', 'roleId'];
    const users = await userController.findAllWithAttributes(newRecord.userIds, attributes);
    users.forEach(user => {
      roleIdSet.add(user.roleId);
    });
    newRecord.roleIds = [...roleIdSet];
    newRecord.approvalTemplateItemDetails = {
      commentRequired: approvalTemplateItem.commentRequired,
      approvalType: approvalTemplateItem.approvalType,
      minimumApprovalCount: approvalTemplateItem.minimumApprovalCount,
      deadlineValue: approvalTemplateItem.deadlineValue,
    };
    const approval = await approvalController.create(newRecord);
    await approvalUserMappingService.bulkCreateForApproval(newRecord.approvers, approval.id, auth);
  });
  let currentApproval;
  // if (type === 'invoice') {
  //   const invoiceController = new InvoiceController(auth.customerId);
  //   if (action === 'dispute') {
  //     currentApproval = await approvalService.findCurrentApproval({ disputeInvoiceId: transactionId }, auth);
  //     await invoiceController.updateById({ currentApprovalId: currentApproval.id }, transactionId);
  //   }
  // }
  if (currentApproval && currentApproval.approvalTemplateItemDetails && currentApproval.approvalTemplateItemDetails.deadlineValue) {
    const approvalObj = await approvalController.findOneByIdWithTemplateItemAndUsers(currentApproval.id);
    const approvalUserMappingIds = approvalObj.AUMs.map(aum => aum.id);
    await approvalUserMappingService.bulkCreateApprovalReminders(approvalObj.ATI, approvalUserMappingIds, 'invoice', auth);
  }
};

const clearAndBulkCreateApprovals = async (records, transactionId, type, action, auth) => {
  if (type === 'invoice' && action === 'dispute') {
    await approvalService.updateAsInactive({ disputeInvoiceId: transactionId }, auth, action);
  }
  return bulkCreateApprovals(records, transactionId, type, action, auth);
};

approvalTemplateService.createModuleLevelApprovals = async (approvals, transactionId, type, auth) => {
  const entityUserMappingSet = new Set();
  entityUserMappingSet.add(auth.userId);
  approvals.sequences.forEach(approval => {
    approval.approvers.forEach(approver => {
      entityUserMappingSet.add(approver.userId);
    });
  });
  await clearAndBulkCreateApprovals(approvals.sequences, transactionId, type, approvals.moduleAction, auth);
  const entityUserMappings = [...entityUserMappingSet].map(userId => ({ userId }));
  // if (type === 'invoice') {
  //   await entityUserMappingService.checkAndBulkCreateForInvoice(entityUserMappings, transactionId, auth);
  // }
};

approvalTemplateService.findAllForListing = async (options, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const approvalTemplates = await approvalTemplateController.findAllForListing(options);
  return {
    data: approvalTemplates.rows,
    meta: {
      count: approvalTemplates.count,
    },
  };
};

const validationForCreateAndUpdate = async values => {
  if (values.approvalTemplateItems && values.approvalTemplateItems.length === 0) {
    throw new ValidationError('Invalid - Approval Template Sequence cannot be empty');
  }

  values.approvalTemplateItems.forEach(ati => {
    if (values.moduleAction === 'dispute') {
      if (!ati.moduleActionAttributes || ati.moduleActionAttributes.length === 0) {
        throw new ValidationError('Invalid - moduleActionAttributes cannot be emtpty for an approval sequence');
      }
    }

    if ((!ati.roleIds || ati.roleIds.length === 0) && !ati.enableManagerLevelApproval) {
      throw new ValidationError('Invalid - roleIds cannot be emtpty for an approval sequence');
    }
  });
};

approvalTemplateService.update = async (values, approvalTemplateId, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const approvalTemplate = await approvalTemplateController.findOneById(approvalTemplateId);
  if (!approvalTemplate) {
    throw new ResourceNotFoundError('Approval Template');
  }
  validationForCreateAndUpdate(values);
  await approvalTemplateController.updateById(values, approvalTemplateId);
  await approvalTemplateItemService.updateForApprovalTemplate(values.approvalTemplateItems, approvalTemplateId, auth);
  return { id: approvalTemplateId };
};

approvalTemplateService.create = async (values, approvalTemplateId, auth) => {
  const sequence = [];
  const customerRoles = await db.Role.findAll({
    where: {
      customerId: auth.customerId,
    },
    attributes: ['id', 'rolehierarchy'],
    order: [
      ['rolehierarchy', 'DESC'],
    ],
  });
  customerRoles.forEach((role, index) => {
    sequence.push({
      sequence: index + 1,
      roleId: role.id,
    });
  });
  const approvalCategory = ['addressId', 'costCentreId', 'ledgerId', 'departmentId', 'value', 'billingAddressId'];
  const approvalTemplateData = [{
    module: values.module,
    sequence,
    moduleAction: values.moduleAction,
    customerId: auth.customerId,
    approvalCategory,
    appId: values.appId,
  }];
  const approvalTemplate = await db.ApprovalTemplate.bulkCreate(approvalTemplateData, {
    individualHooks: true,
  });
  validationForCreateAndUpdate(values);
  approvalTemplateId = approvalTemplate[0].id;
  await approvalTemplateItemService.updateForApprovalTemplate(values.approvalTemplateItems, approvalTemplateId, auth);
  return { id: approvalTemplateId };
};

const updateTransactionalFieldsOptions = (transactionalFields, transactionalFieldsNeedToBeSent) => {
  // const transactionalFieldsEnum = Object.keys(TransactionSystemFields);
  // const dimensionalFieldsEnum = Object.keys(DimensionalFields);
  // transactionalFields.forEach(transactionField => {
  //   if (!transactionalFieldsNeedToBeSent.find(field => field.key === transactionField.key)) {
  //     const fieldData = JSON.parse(JSON.stringify(transactionField));
  //     if (transactionalFieldsEnum.indexOf(transactionField.key) > -1) {
  //       fieldData.transactionType = 'transactional';
  //       fieldData.type = FieldTypes.STRING;
  //       fieldData.options = null;
  //       transactionalFieldsNeedToBeSent.push(fieldData);
  //     } else if (dimensionalFieldsEnum.indexOf(transactionField.key) > -1) {
  //       fieldData.fieldMappingKey = DimensionalKeyFields[transactionField.key];
  //       fieldData.transactionType = 'dimensional';
  //       transactionalFieldsNeedToBeSent.push(fieldData);
  //     }
  //   }
  // });
};

approvalTemplateService.getTransactionalFields = async (transactionType, auth) => {
  let transactionalFields = [];
  // if ([
  //   TransactionTypes.REQUISITION,
  // ].includes(transactionType)) {
  //   transactionalFields = RequisitionTransactionFieldKeyMappings;
  // } else if ([TransactionTypes.STOCK_INWARD].includes(transactionType)) {
  //   transactionalFields = StockInwardTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.FINANCE) {
  //   transactionalFields = ExpenseTransactionFieldKeyMappings;
  // // } else if (transactionType === 'source-comparison') {
  // //   transactionalFields = await getTransactionFields(auth, 'quote-request');
  // // } else if (transactionType === 'quote-request' || transactionType === 'auction-request') {
  // //   transactionalFields = await getTransactionFields(auth, transactionType);
  // } else if (transactionType === TransactionTypes.TRAVEL_REQUEST) {
  //   transactionalFields = TravelRequestTransactionFieldKeyMappings;
  // // } else if ([TransactionTypes.PURCHASE_ORDER, TransactionTypes.SCHEDULE].includes(transactionType)) {
  // //   transactionalFields = await getTransactionalFieldsForApprovalTemplates(auth);
  // } else if (transactionType === TransactionTypes.PRODUCT) {
  //   return ProductTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.RATE_CONTRACT) {
  //   transactionalFields = RateContractTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.INVOICE) {
  //   transactionalFields = InvoiceTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.BUDGETS) {
  //   transactionalFields = BudgetTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.APP) {
  //   transactionalFields = AppTransactionFieldKeyMappings;
  // } else if (transactionType === TransactionTypes.BOQ) {
  //   transactionalFields = BoqTransactionFieldKeyMappings;
  // }
  const transactionalFieldsNeedToBeSent = [];
  // if ([
  //   TransactionTypes.REQUISITION,
  //   TransactionTypes.FINANCE,
  //   TransactionTypes.TRAVEL_REQUEST,
  //   TransactionTypes.STOCK_INWARD,
  //   TransactionTypes.PURCHASE_ORDER,
  //   TransactionTypes.PRODUCT,
  //   TransactionTypes.RATE_CONTRACT,
  //   TransactionTypes.SCHEDULE,
  //   TransactionTypes.INVOICE,
  //   TransactionTypes.BUDGETS,
  //   TransactionTypes.APP,
  //   TransactionTypes.BOQ,
  // ].includes(transactionType)) {
  //   updateTransactionalFieldsOptions(transactionalFields, transactionalFieldsNeedToBeSent);
  // } else if (transactionType === 'quote-request' || transactionType === 'auction-request' || transactionType === 'source-comparison') {
  //   updateTransactionalFieldsOptions(transactionalFields.headerFields, transactionalFieldsNeedToBeSent);
  // }

  // if (transactionType === 'source-comparison') {
  //   const customerController = new CustomerController(auth.customerId);
  //   const customer = await customerController.findOneByIdWithAttributes(auth.customerId, ['enableQCTemplate']); 
  //   if (customer.enableQCTemplate) {
  //     transactionalFieldsNeedToBeSent.push({
  //       key: 'numberOfQuotationReceived', label: 'Number Of Quotation Received', type: 'number', options: null,
  //     });
  //   }
  // }
  // if (transactionType === 'supplier') {
  //   const formController = new FormController(auth.customerId);
  //   const forms = await formController.findAllActiveForms(['vendor-onboarding-master', 'vendor-onboarding']);
  //   transactionalFieldsNeedToBeSent.push({
  //     key: 'formId',
  //     label: 'Form',
  //     type: 'form-select',
  //     options: forms,
  //   });
  // }
  return transactionalFieldsNeedToBeSent;
};

const getManagerId = async (userId, managerIds, auth) => {
  const userController = new UserController(auth.customerId);
  const userDetails = await userController.findOneForUserManagerMapping(userId);
  if (userDetails && userDetails.managerId) {
    managerIds.push(userDetails.managerId);
    return getManagerId(userDetails.managerId, managerIds, auth);
  }
  return managerIds;
};

approvalTemplateService.getApprovalUsersForTransactions = async (options, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const approvalDataValues = await approvalTemplateController.findOneWithAttributes({
    where: {
      active: 1,
      module: options.module,
      moduleAction: options.moduleAction,
    },
  }, ['id', 'enableSubTotalApproval', 'module']);
  if (options.value) {
    if (approvalDataValues && approvalDataValues.enableSubTotalApproval) {
      options.value = options.subTotal;
    }
    if (options.transactionCurrencyExchangeRate && options.exchangeCalculatedBy) {
      options.value = masterCurrencyService.getValueInBasePrice(
        options.value,
        options.transactionCurrencyExchangeRate,
        options.exchangeCalculatedBy,
      );
    }
    _set(options, 'varianceValue', options.value);
  }
  const retObj = await approvalTemplateController.findOneByModuleActionWithATIs(options);
  if (!retObj) {
    return {};
  }
  const approvalTemplate = retObj.toJSON();
  let managerIds = [];
  if (approvalTemplate.enableManagerLevelApproval) {
    managerIds = await getManagerId(auth.userId, [], auth);
  }
  await BBPromise.mapSeries(approvalTemplate.ATIs, async (ati, index) => {
    let roles = [];
    roles = await approvalTemplateService.getRoleDataForATIs(options, ati, 'transaction-level', auth);
    if (managerIds.length && roles.length) {
      const isManagerialApprovalPresent = roles.some(role => role.Users.find(user => managerIds.includes((user.id))));
      roles = roles.map(role => {
        const temp = role.toJSON();
        const managerialUsers = role.Users.filter(user => managerIds.includes(user.id));
        _set(temp, 'Users', isManagerialApprovalPresent ? managerialUsers : role.Users);
        return temp;
      });
    }
    let emptyAti = false;
    if (approvalTemplate.excludeTransactionCreator) {
      roles.forEach(role => {
        const findIndex = role.Users.findIndex(user => user.id === auth.userId);
        if (findIndex > -1) {
          if (ati.approvalType === 'anyone' || (ati.approvalType === 'partial' && ati.minimumApprovalCount < 2)) {
            emptyAti = true;
          }
          role.Users.splice(findIndex, 1);
        }
      });
    }
    if (emptyAti) {
      const removeIndex = approvalTemplate.ATIs.findIndex(item => item.id === ati.id);
      approvalTemplate.ATIs.splice(removeIndex, 1);
    } else {
      _set(ati, 'meta', { roles });
      if (!roles.length) {
        const removeIndex = approvalTemplate.ATIs.findIndex(item => item.id === ati.id);
        approvalTemplate.ATIs.splice(removeIndex, 1);
      }
    }
  });
  return approvalTemplate;
};

approvalTemplateService.getTransactionApprovalUsers = async (options, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId, auth.transaction);
  if (options.value) {
    if (options.transactionCurrencyExchangeRate && options.exchangeCalculatedBy) {
      options.value = masterCurrencyService.getValueInBasePrice(
        options.value,
        options.transactionCurrencyExchangeRate,
        options.exchangeCalculatedBy,
      );
    }
  }
  const retObj = await approvalTemplateController.findOneByModuleActionWithApprovalTemplateItems(options);
  if (!retObj) {
    return {};
  }
  let approvalTemplate = retObj.toJSON();
  approvalTemplate.ATIs.forEach(ATI => {
    // const { groupRules, operator } = ATI.transactionFilterRules;
    // if (groupRules && groupRules.length > 0) {
    //   ATI.isEligible = atiRuleHelper.evaluateGroupRules(groupRules, operator, options);
    // } else {

      ATI.isEligible = true;
    // }
  });
  approvalTemplate.ATIs = approvalTemplate.ATIs.filter(ATI => ATI.isEligible);
  approvalTemplate = await userApprovalsUtils.getApprovalTemplateItemsByApplyingUserFilters(approvalTemplate, auth, options);
  return approvalTemplate;
};

approvalTemplateService.getAllUsersWithRoleIdsForEscalationEmail = async (approvalTemplateItemId, options, auth) => {
  const userController = new UserController(auth.customerId);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
  const approvalTemplateItem = await approvalTemplateItemController.findOneById(approvalTemplateItemId);
  _set(options, 'enableDeliveryAddressFilter', approvalTemplateItem.enableDeliveryAddressFilter);
  _set(options, 'enableCostCentreFilter', approvalTemplateItem.enableCostCentreFilter);
  _set(options, 'enableLedgerFilter', approvalTemplateItem.enableLedgerFilter);
  _set(options, 'enableDepartmentFilter', approvalTemplateItem.enableDepartmentFilter);
  _set(options, 'enableValueFilter', approvalTemplateItem.enableValueFilter);
  return userController.findAllUsersWithRoleIdsForEscalation(options);
};

approvalTemplateService.getRoleDataForATIs = async (options, ati, type, auth) => {
  const roleController = new RoleController(auth.customerId, auth.transaction);
  const userController = new UserController(auth.customerId, auth.transaction);
  _set(options, 'roleIds', ati.roleIds);
  _set(options, 'type', type);
  _set(options, 'enableDeliveryAddressFilter', ati.enableDeliveryAddressFilter);
  _set(options, 'enableBillingAddressFilter', ati.enableBillingAddressFilter);
  _set(options, 'enableCostCentreFilter', ati.enableCostCentreFilter);
  _set(options, 'enableLedgerFilter', ati.enableLedgerFilter);
  _set(options, 'enableDepartmentFilter', ati.enableDepartmentFilter);
  _set(options, 'enableDimensionOneFilter', ati.enableDimensionOneFilter);
  _set(options, 'enableDimensionTwoFilter', ati.enableDimensionTwoFilter);
  _set(options, 'enableDimensionThreeFilter', ati.enableDimensionThreeFilter);
  _set(options, 'enableValueFilter', ati.enableValueFilter);
  _set(options, 'enableIntegrationErrorFilter', ati.enableIntegrationErrorFilter);
  _set(options, 'enableExceptionFilter', ati.enableExceptionFilter);
  _set(options, 'enableTransactionHold', ati.enableTransactionHold);
  _set(options, 'enableSupplierCategoryFilter', ati.enableSupplierCategoryFilter);
  _set(options, 'enableProductCategoryFilter', ati.enableProductCategoryFilter);
  const roleUsers = ati.roleIds.length > 0 ? await userController.findAllUsersWithRoleIds(ati.roleIds) : [];
  let roles = [];
  if (roleUsers.length) {
    const roleUserIds = roleUsers.map(user => user.id);
    let distinctUserIds = [...new Set(roleUserIds)];
    if (distinctUserIds.length) {
      // if (options.departmentId && options.enableDepartmentFilter) {
      //   const userDepartmentMappingController = new UserDepartmentMappingController(auth.customerId, auth.transaction);
      //   const departmentData = await userDepartmentMappingController.findAllActiveByUserIdsForDepartment(distinctUserIds, options.departmentId);
      //   distinctUserIds = departmentData.map(udm => udm.userId);
      // }
      // if (distinctUserIds.length && options.costCentreId && options.enableCostCentreFilter) {
      //   const userCostCentreMappingController = new UserCostCentreMappingController(auth.customerId, auth.transaction);
      //   const costCentreData = await userCostCentreMappingController.findAllActiveByUserIdsForCostCentre(distinctUserIds, options.costCentreId);
      //   distinctUserIds = costCentreData.map(uccm => uccm.userId);
      // }
      // if (distinctUserIds.length && options.ledgerId && options.enableLedgerFilter) {
      //   const userLedgerMappingController = new UserLedgerMappingController(auth.customerId, auth.transaction);
      //   const ledgerData = await userLedgerMappingController.findAllActiveByUserIdsForLedger(distinctUserIds, options.ledgerId);
      //   distinctUserIds = ledgerData.map(ulm => ulm.userId);
      // }
      // if (distinctUserIds.length && options.addressId && options.enableDeliveryAddressFilter) {
      //   const userAddressMappingController = new UserAddressMappingController(auth.customerId, auth.transaction);
      //   const addressData = await userAddressMappingController.findAllActiveByUserIdsForAddress(distinctUserIds, options.addressId);
      //   distinctUserIds = addressData.map(uam => uam.userId);
      // }
      // if (distinctUserIds.length && options.billingAddressId && options.enableBillingAddressFilter) {
      //   const userAddressMappingController = new UserAddressMappingController(auth.customerId, auth.transaction);
      //   const addressData = await userAddressMappingController.findAllActiveByUserIdsForAddress(distinctUserIds, options.billingAddressId);
      //   distinctUserIds = addressData.map(uam => uam.userId);
      // }
      // if (distinctUserIds.length && options.supplierCategoryId && options.enableSupplierCategoryFilter) {
      //   const userSupplierCategoryMappingController = new UserSupplierCategoryMappingController(auth.customerId, auth.transaction);
      //   const uscmData = await userSupplierCategoryMappingController.findAllActiveByUserIdsForSupplierCategory(distinctUserIds, options.supplierCategoryId);
      //   distinctUserIds = uscmData.map(uscm => uscm.userId);
      // }
      // if (distinctUserIds.length && options.dimensionOneId && options.enableDimensionOneFilter) {
      //   const userDimensionOneMappingController = new UserDimensionOneMappingController(auth.customerId, auth.transaction);
      //   const dimensionOneData = await userDimensionOneMappingController.findAllActiveByUserIdsForDimensionOne(distinctUserIds, options.dimensionOneId);
      //   distinctUserIds = dimensionOneData.map(udom => udom.userId);
      // }
      // if (distinctUserIds.length && options.dimensionTwoId && options.enableDimensionTwoFilter) {
      //   const userDimensionTwoMappingController = new UserDimensionTwoMappingController(auth.customerId, auth.transaction);
      //   const dimensionTwoData = await userDimensionTwoMappingController.findAllActiveByUserIdsForDimensionTwo(distinctUserIds, options.dimensionTwoId);
      //   distinctUserIds = dimensionTwoData.map(udtm => udtm.userId);
      // }
      // if (distinctUserIds.length && options.dimensionThreeId && options.enableDimensionThreeFilter) {
      //   const userDimensionThreeMappingController = new UserDimensionThreeMappingController(auth.customerId, auth.transaction);
      //   const dimensionThreeData = await userDimensionThreeMappingController.findAllActiveByUserIdsForDimensionThree(distinctUserIds, options.dimensionThreeId);
      //   distinctUserIds = dimensionThreeData.map(udtm => udtm.userId);
      // }
      // if (distinctUserIds.length && options.productCategoryId && options.enableProductCategoryFilter) {
      //   const purchaserCategoryMappingController = new PurchaserCategoryMappingController(auth.customerId, auth.transaction);
      //   const productCategoryData = await purchaserCategoryMappingController.findAllActiveByUserIdsForCategory(distinctUserIds, options.productCategoryId);
      //   distinctUserIds = productCategoryData.map(upcm => upcm.userId);
      // }
      _set(options, 'getUserIds', distinctUserIds);
      if (distinctUserIds.length) {
        roles = await roleController.findAllByIdsForApprovals(options);
      }
    }
  }
  return roles;
};

const validateTransactionApprovalCreateAndUpdate = async values => {
  if (!values.module) {
    throw new ValidationError('Invalid action - specify the module');
  }
  values.sequence.forEach(s => {
    if (!s.roleId) {
      throw new ValidationError('Invalid - role is mandatory on all approver sequence');
    }
    if (!s.sequence) {
      throw new ValidationError('Invalid - sequence number is also mandatory');
    }
  });
};

approvalTemplateService.updateTransactionApprovalTemplate = async (values, approvalTemplateId, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const approvalTemplate = await approvalTemplateController.findOneById(approvalTemplateId);
  if (!approvalTemplate) {
    throw new ResourceNotFoundError('Approval Template');
  }
  await validateTransactionApprovalCreateAndUpdate(values);
  await approvalTemplateController.updateById(values, approvalTemplateId);
  return { id: approvalTemplateId };
};

approvalTemplateService.getApprovers = async (options, auth) => {
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const roleController = new RoleController(auth.customerId);
  const approvalTemplate = await approvalTemplateController.findOneByModuleAction(options);
  if (!approvalTemplate) {
    return {};
  }
  const approvalOptions = {};
  approvalTemplate.approvalCategory.forEach(category => {
    approvalOptions[category] = options[category];
  });
  const roleIds = approvalTemplate.sequence.map(seq => seq.roleId);
  _set(approvalOptions, 'roleIds', roleIds);
  _set(approvalOptions, 'type', 'transaction-level');
  if (approvalOptions.value) {
    _set(approvalOptions, 'enableValueFilter', 1);
  }
  if (approvalOptions.addressId) {
    _set(approvalOptions, 'enableDeliveryAddressFilter', 1);
  }
  if (approvalOptions.departmentId) {
    _set(approvalOptions, 'enableDepartmentFilter', 1);
  }
  if (approvalOptions.costCentreId) {
    _set(approvalOptions, 'enableCostCentreFilter', 1);
  }
  if (approvalOptions.integrationError) {
    _set(approvalOptions, 'enableIntegrationErrorFilter', 1);
  }
  if (approvalOptions.enableExceptionFilter) {
    _set(approvalOptions, 'enableExceptionFilter', 1);
  }
  if (approvalOptions.enableTransactionHold) {
    _set(approvalOptions, 'enableTransactionHold', 1);
  }
  const roleData = await roleController.findAllByIds(approvalOptions);
  const approvalTemplateObj = approvalTemplate.toJSON();
  const approvalObj = [];
  approvalTemplateObj.sequence.forEach(seq => {
    const role = roleData.find(item => item.id === seq.roleId);
    if (role && role.Users && role.Users.length) {
      if (options.module === 'requisition') {
        const array = role.Users.filter(usr => usr.id !== auth.userId);
        if (array.length) {
          _set(seq, 'users', array);
          approvalObj.push(seq);
        }
      } else {
        _set(seq, 'users', role.Users);
        approvalObj.push(seq);
      }
    }
  });
  return approvalObj;
};

const checkAVB = (user, approvalOptions) => {
  if (user.approvalValueBracketId) {
    if (approvalOptions.enableValueFilter && approvalOptions.value) {
      if (approvalOptions.value <= user.AVB.maximum && approvalOptions.value >= user.AVB.minimum) {
        return true;
      }
      return false;
    }
  }
  return true;
};

approvalTemplateService.getEligibleApprovers = async (options = {}, auth = {}) => {
  const customerController = new CustomerController();
  const roleController = new RoleController(auth.customerId);
  const userController = new UserController(auth.customerId);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
  const requiredCustomerAttributes = ['isLedgerRequired', 'isCostCenterRequired', 'isDepartmentRequired'];
  const customer = await customerController.findOneByIdWithAttributes(auth.customerId, requiredCustomerAttributes);
  if (!options.moduleName) {
    throw new ValidationError('Module name is required');
  }

  const moduleName = utils.getSanitizedModuleName(options.moduleName, options.moduleAction);

  const requiredTransactionKeys = utils.getTransactionKeysForRoleCheck(moduleName);
  if (!(Array.isArray(requiredTransactionKeys) && requiredTransactionKeys.length)) {
    throw new ValidationError('Required module not found');
  }
  _set(options, 'transactionViewAccess', requiredTransactionKeys[0]);
  _set(options, 'transactionApproveAccess', requiredTransactionKeys[1]);
  _set(options, 'type', 'transaction-level');

  const roleIdsWithAcces = await roleController.findAllByAccess(options);
  const roleIds = roleIdsWithAcces.map(role => role.id);
  options.roleIds = roleIds;
  const roleUsers = await userController.findAllUsersWithRoleIds(roleIds);
  let roles = [];
  const approvalTemplateData = await approvalTemplateItemController.findOneWithApprovalTemplate(options.atiId);
  if (roleUsers.length) {
    const roleUserIds = roleUsers.map(user => user.id);
    let distinctUserIds = [...new Set(roleUserIds)];
    if (distinctUserIds.length) {
      // if (customer.isDepartmentRequired && Array.isArray(options.departmentId) && options.departmentId.length) {
      //   const userDepartmentMappingController = new UserDepartmentMappingController(auth.customerId);
      //   const departmentData = await userDepartmentMappingController.findAllActiveByUserIdsForDepartment(distinctUserIds, options.departmentId);
      //   distinctUserIds = departmentData.map(udm => udm.userId);
      // }
      // if (customer.isCostCenterRequired && distinctUserIds.length && Array.isArray(options.costCentreId) && options.costCentreId.length) {
      //   const userCostCentreMappingController = new UserCostCentreMappingController(auth.customerId);
      //   const costCentreData = await userCostCentreMappingController.findAllActiveByUserIdsForCostCentre(distinctUserIds, options.costCentreId);
      //   distinctUserIds = costCentreData.map(uccm => uccm.userId);
      // }
      // if (customer.isLedgerRequired && distinctUserIds.length && Array.isArray(options.ledgerId) && options.ledgerId.length) {
      //   const userLedgerMappingController = new UserLedgerMappingController(auth.customerId);
      //   const ledgerData = await userLedgerMappingController.findAllActiveByUserIdsForLedger(distinctUserIds, options.ledgerId);
      //   distinctUserIds = ledgerData.map(ulm => ulm.userId);
      // }
      // if (distinctUserIds.length && Array.isArray(options.addressId) && options.addressId.length) {
      //   const userAddressMappingController = new UserAddressMappingController(auth.customerId);
      //   const addressData = await userAddressMappingController.findAllActiveByUserIdsForAddress(distinctUserIds, options.addressId);
      //   distinctUserIds = addressData.map(uam => uam.userId);
      // }
      // if (distinctUserIds.length && Array.isArray(options.billingAddressId) && options.billingAddressId.length) {
      //   const userAddressMappingController = new UserAddressMappingController(auth.customerId);
      //   const addressData = await userAddressMappingController.findAllActiveByUserIdsForAddress(distinctUserIds, options.billingAddressId);
      //   distinctUserIds = addressData.map(uam => uam.userId);
      // }
    }
    _set(options, 'getUserIds', distinctUserIds);
    if (distinctUserIds.length) {
      _set(options, 'enableValueFilter', approvalTemplateData.enableValueFilter);
      if (options.value) {
        _set(options, 'value', options.value);
      }
      roles = await roleController.findAllByIdsForApprovals(options);
    }
  }

  const eligibleApprovers = [];
  if (approvalTemplateData && approvalTemplateData.AT && approvalTemplateData.AT.excludeTransactionCreator) {
    roles.forEach(role => {
      const findIndex = role.Users.findIndex(user => user.id === options.creatorId);
      if (findIndex > -1) {
        role.Users.splice(findIndex, 1);
      }
    });
  }
  for (const role of roles) {
    const { Users = [] } = role;
    eligibleApprovers.push(...Users.filter(user => !options.userIds.includes(user.id)));
  }
  return eligibleApprovers;
};

const getEventDetails = async (values, auth) => {
  const userController = new UserController(auth.customerId);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId);
  const toUser = await userController.findOneByIdWithAttributes(values.approverId, ['id', 'name']);
  const currentAUM = await approvalUserMappingController.findOneById(values.currentAUMId);
  const fromUser = await userController.findOneByIdWithAttributes(currentAUM.userId, ['id', 'name']);
  const eventDetails = {
    text: `Approver reassigned from ${fromUser.name} to ${toUser.name}`,
    userId: auth.userId,
    reasonType: 'reassigned',
  };
  switch (values.moduleName) {
    case 'requisition':
      _set(eventDetails, 'requisitionId', values.transactionId);
      break;
    case 'quoteComparision':
      _set(eventDetails, 'quoteComparisonId', values.transactionId);
      break;
    case 'creditDebitNote':
      _set(eventDetails, 'invoiceId', values.transactionId);
      break;
    case 'auctionRequest':
      _set(eventDetails, 'auctionRequestId', values.transactionId);
      break;
    case 'budget':
      _set(eventDetails, 'budgetId', values.transactionId);
      break;
    case 'expense':
      _set(eventDetails, 'expenseId', values.transactionId);
      break;
    case 'invoice':
      _set(eventDetails, 'invoiceId', values.transactionId);
      break;
    case 'paymentRun':
      _set(eventDetails, 'paymentRunId', values.transactionId);
      break;
    case 'products':
      _set(eventDetails, 'productId', values.transactionId);
      break;
    case 'quote-requests':
      _set(eventDetails, 'quoteRequestId', values.transactionId);
      break;
    case 'rate-contract':
      _set(eventDetails, 'rateContractId', values.transactionId);
      break;
    case 'stock-inward':
      _set(eventDetails, 'stockInwardId', values.transactionId);
      break;
    case 'purchaseOrder':
      _set(eventDetails, 'purchaseOrderId', values.transactionId);
      break;
    case 'proforma-invoice':
      _set(eventDetails, 'proFormaInvoiceId', values.transactionId);
      break;
    default:
      break;
  }
  return eventDetails;
};

// const moduleNameTransactionLogMapping = {
//   'purchase-order': TransactionLogIdentifier.PURCHASE_ORDER,
//   requisition: TransactionLogIdentifier.REQUISITION,
//   'proforma-invoice-non-po': TransactionLogIdentifier.PROFORMA_INVOICE,
//   'proforma-invoice-po': TransactionLogIdentifier.PROFORMA_INVOICE,
//   'non-po-invoice': TransactionLogIdentifier.INVOICE,
//   'rc-invoice': TransactionLogIdentifier.INVOICE,
//   invoice: TransactionLogIdentifier.INVOICE,
//   'invoice-accounting': TransactionLogIdentifier.INVOICE,
//   schedule: TransactionLogIdentifier.PURCHASE_ORDER,
//   'quote-request': TransactionLogIdentifier.QUOTE_REQUEST,
//   'auction-request': TransactionLogIdentifier.AUCTION_REQUEST,
//   'quote-comparison': TransactionLogIdentifier.QUOTE_COMPARISON,
//   'auction-comparison': TransactionLogIdentifier.AUCTION_COMPARISON,
//   expenses: TransactionLogIdentifier.EXPENSES,
//   'travel-expenses': TransactionLogIdentifier.TRAVEL_EXPENSES,
//   'travel-request': TransactionLogIdentifier.TRAVEL_REQUEST,
//   'payment-run': TransactionLogIdentifier.PAYMENT_RUN,
//   'budget': TransactionLogIdentifier.BUDGET,
//   'rate-contract': TransactionLogIdentifier.RATE_CONTRACT,
//   'grn': TransactionLogIdentifier.GRN,
//   'requisition-conversion': TransactionLogIdentifier.REQUISITION_CONVERSION,
//   boqs: TransactionLogIdentifier.BOQ,
//   // add prc and qc
// };

approvalTemplateService.reassignApprovers = async (options = {}, auth = {}) => {
  if (Number.isNaN(options.approvalId)) {
    throw new ValidationError('Invalid - approvalId is required');
  }

  if (Number.isNaN(options.approvalUserMappingId)) {
    throw new ValidationError('Invalid - approvalUserMappingId is required');
  }

  if (Number.isNaN(options.approverId)) {
    throw new ValidationError('Invalid - approverId is required');
  }

  if (Number.isNaN(options.transactionId)) {
    throw new ValidationError('Invalid - transactionId is required');
  }

  const approvalController = new ApprovalController(auth.customerId);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId);
  const oldApprovals = await approvalController.findOneByIdWithAttributes(options.approvalId, ['id', 'approvers']);
  const currentApprovalUserMapping = await approvalUserMappingController.findOneByIdForReassignApprovers(options.approvalUserMappingId);
  await approvalUserMappingController.bulkMarkInactiveById(options.approvalUserMappingId);

  await approvalUserMappingController.create({
    active: 1,
    status: 'pending',
    userId: options.approverId,
    approvalId: options.approvalId,
  });
  const approvers = [];
  oldApprovals.approvers.forEach(approver => {
    if (Array.isArray(options.userIds) && currentApprovalUserMapping.userId !== approver.userId) {
      approvers.push({ userId: approver.userId });
    } else {
      approvers.push({ userId: options.approverId });
    }
  });
  await approvalController.updateById({ currentApprovalUserIds: [options.approverId], approvers }, options.approvalId);

  const moduleName = utils.getSanitizedModuleName(options.moduleName, options.moduleAction);
  _set(options, 'moduleName', moduleName);
  // grootService.sendApprovalReAssignEmailToUser(options, auth);
  const moduleId = utils.gettransactionIdKeyMapping(moduleName);
  if (!moduleId) {
    return;
  }

  let sanitizedCurrentApproverId = currentApprovalUserMapping.userId;

  if (Number.isNaN(sanitizedCurrentApproverId)) {
    return;
  }

  const userController = new UserController(auth.customerId);
  const currentUser = await userController.findOneByIdWithAttributes(sanitizedCurrentApproverId, ['name']);
  const newUser = await userController.findOneByIdWithAttributes(options.approverId, ['name']);
  // const requiredTransaction = await grootService.getTransactionInfo({
  //   transactionId: options.transactionId,
  //   moduleName: options.moduleName,
  // }, auth);
  const userIdSet = new Set();
  userIdSet.add(sanitizedCurrentApproverId);
  userIdSet.add(options.approverId);
  // userIdSet.add(requiredTransaction.userId);
  userIdSet.delete(auth.userId);
  // const { sanitizedTransactionName } = requiredTransaction;
  // const transactionCode = _get(requiredTransaction, 'code') || _get(requiredTransaction, 'reference');
  const reference = {
    [moduleId]: options.transactionId,
  };

  if (options.appKey) {
    reference.appKey = options.appKey;
  }
  // await notificationService.bulkCreateForUsers({
  //   text: `${transactionCode} ${sanitizedTransactionName} has been Reassigned from ${_get(currentUser, 'name')} to ${_get(newUser, 'name')}`,
  //   reference,
  //   redirectionEntity: sanitizedTransactionName,
  // }, [...userIdSet]);

  // await createEvent({
  //   text: `${sanitizedTransactionName} approval has been Reassigned from ${_get(currentUser, 'name')} to ${_get(newUser, 'name')}`,
  //   userId: auth.userId,
  //   [moduleId]: options.transactionId,
  //   additionalText: options.reassignReason,
  // }, auth);
  // const transactionLogIdentifier = moduleNameTransactionLogMapping[options.moduleName];
  // if (transactionLogIdentifier) {
  //   await transactionLogService.updatePendingActionUsers(requiredTransaction, transactionLogIdentifier, auth);
  // }
};

approvalTemplateService.bulkReassignApprovers = async (options = {}, taskId, auth = {}) => {
  const approvalController = new ApprovalController(auth.customerId);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId);
  const userController = new UserController(auth.customerId);
  const currentUser = await userController.findOneByIdWithAttributes(options.userId, ['name']);
  const newUser = await userController.findOneByIdWithAttributes(options.reassignId, ['name']);
  const transactionIds = options.transactions.map(transaction => transaction.id);
  const approvals = await approvalController.findAllApprovalsForTransactionIdsAndUser({ columnNames: options.columnNames, transactionIds, userId: options.userId });
  await BBPromise.mapSeries(approvals, async (approval) => {
    await approvalUserMappingController.bulkMarkInactiveByApprovalIdAndUserId(approval.id, options.userId);
    await approvalUserMappingController.create({
      active: 1,
      status: 'pending',
      userId: options.reassignId,
      approvalId: approval.id,
      approvalStartTime: new Date(),
    });
    const updatedCurrentApprovalUserIdsSet = new Set(approval.currentApprovalUserIds);
    updatedCurrentApprovalUserIdsSet.delete(options.userId);
    updatedCurrentApprovalUserIdsSet.add(options.reassignId);
    const currentApprovalUserIds = Array.from(updatedCurrentApprovalUserIdsSet);
    const approvers = [];
    approval.approvers.forEach(approver => {
      if (approver.userId !== options.userId) {
        approvers.push({ userId: approver.userId });
      } else {
        approvers.push({ userId: options.reassignId });
      }
    });
    await approvalController.updateById({ currentApprovalUserIds, approvers }, approval.id);
    const transactionId = approval[options.columnNames.find(columnName => approval[columnName])];
    const moduleId = utils.gettransactionIdKeyMapping(options.module);
    // await createEvent({
    //   text: `Approver has been Reassigned from ${_get(currentUser, 'name')} to ${_get(newUser, 'name')} via Bulk Reassign`,
    //   userId: auth.userId,
    //   [moduleId]: transactionId,
    //   reasonType: 'reassigned',
    // }, auth);
  });
  // await notificationService.createForUser({
  //   text: `Bulk ${options.module} approver Reassign from ${_get(currentUser, 'name')} to you by ${auth.User.name}.`,
  // }, options.reassignId);
  // grootService.sendEmailForBulkReassignment({
  //   userId: options.userId,
  //   reassignId: options.reassignId,
  //   module: options.module,
  //   moduleAction: 'approver',
  //   transactions: options.transactions,
  //   taskId,
  // }, auth);
};

approvalTemplateService.applyModuleFilters = async (options, roleUsers, moduleFilters, auth) => {
  let roles = [];
  const roleController = new RoleController(auth.customerId);
  if (roleUsers.length) {
    const roleUserIds = roleUsers.map(user => user.id);
    let distinctUserIds = [...new Set(roleUserIds)];
    // if (distinctUserIds.length) {
    //   if (moduleFilters.enableDepartmentFilter && options.departmentId) {
    //     const userDepartmentMappingController = new UserDepartmentMappingController(auth.customerId);
    //     const departmentData = await userDepartmentMappingController.findAllActiveByUserIdsForDepartment(distinctUserIds, options.departmentId);
    //     distinctUserIds = departmentData.map(udm => udm.userId);
    //   }
    //   if (moduleFilters.enableCostCentreFilter && distinctUserIds.length && options.costCentreId) {
    //     const userCostCentreMappingController = new UserCostCentreMappingController(auth.customerId);
    //     const costCentreData = await userCostCentreMappingController.findAllActiveByUserIdsForCostCentre(distinctUserIds, options.costCentreId);
    //     distinctUserIds = costCentreData.map(uccm => uccm.userId);
    //   }
    //   if (moduleFilters.enableLedgerFilter && distinctUserIds.length && options.ledgerId) {
    //     const userLedgerMappingController = new UserLedgerMappingController(auth.customerId);
    //     const ledgerData = await userLedgerMappingController.findAllActiveByUserIdsForLedger(distinctUserIds, options.ledgerId);
    //     distinctUserIds = ledgerData.map(ulm => ulm.userId);
    //   }
    //   if (moduleFilters.enableDeliveryAddressFilter && distinctUserIds.length && options.deliveryAddressId) {
    //     const userAddressMappingController = new UserAddressMappingController(auth.customerId);
    //     const addressData = await userAddressMappingController.findAllActiveByUserIdsForAddress(distinctUserIds, options.deliveryAddressId);
    //     distinctUserIds = addressData.map(uam => uam.userId);
    //   }
    // }
    _set(options, 'getUserIds', distinctUserIds);
    if (distinctUserIds.length) {
      _set(options, 'enableValueFilter', moduleFilters.enableValueFilter);
      if (options.value) {
        _set(options, 'value', options.value);
      }
      roles = await roleController.findAllByIdsForApprovals(options);
    }
  }

  return roles;
};

approvalTemplateService.setOptionsToFilterUsers = async (options, app, isAtiFilterNeeded, auth) => {
  // here in params optoions we get dependency filter data
  // here on options we need to set  moduleFilters, roleIds, roleUsers to apply dependency filters
  const userController = new UserController(auth.customerId);

  _set(options, 'type', 'transaction-level');

  if (isAtiFilterNeeded) {
    _set(options, 'atiId', options.CurrentApproval && options.CurrentApproval.ATI ? options.CurrentApproval.ATI.id : null);

    if (!options.atiId) {
      throw new ValidationError('Transaction is not in pending approval state');
    }

    const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
    const approvalTemplateData = await approvalTemplateItemController.findOneWithApprovalTemplate(options.atiId);
    options.roleIds = approvalTemplateData.reassignApprovalSettings && approvalTemplateData.reassignApprovalSettings.roleIds ? approvalTemplateData.reassignApprovalSettings.roleIds : [];

    options.moduleFilters = approvalTemplateData.reassignApprovalSettings && approvalTemplateData.reassignApprovalSettings.moduleFilters ? approvalTemplateData.reassignApprovalSettings.moduleFilters : {};

    options.approvalTemplateData = approvalTemplateData;

    options.userIds = options.CurrentApproval && options.CurrentApproval.AUMs ? options.CurrentApproval.AUMs.map(AUM => AUM.userId) : [];
  } else {
    options.moduleFilters = app.reassignOwnerSettings && app.reassignOwnerSettings.moduleFilters ? app.reassignOwnerSettings.moduleFilters : {};
    options.roleIds = app.reassignOwnerSettings && app.reassignOwnerSettings.roleIds ? app.reassignOwnerSettings.roleIds : [];
  }

  if (options.roleIds && options.roleIds.length === 0) {
    throw new ValidationError('Unable to fetch Roles');
  }

  const roleUsers = await userController.findAllUsersWithRoleIds(options.roleIds);
  options.roleUsers = roleUsers;
  return options;
};

approvalTemplateService.getEligibleApproversBasedOnATI = async (transactionDetails, auth) => {
  const transactionData = JSON.parse(JSON.stringify(transactionDetails));
  _set(transactionData, 'value', transactionData.value);
  const transactionFilters = {
    reassignOwnerSettings: {},
  };

  const options = await approvalTemplateService.setOptionsToFilterUsers(transactionData, transactionFilters, true, auth);
  const roles = await approvalTemplateService.applyModuleFilters(options, options.roleUsers, options.moduleFilters, auth);

  const eligibleApprovers = [];
  if (options.approvalTemplateData && options.approvalTemplateData.AT && options.approvalTemplateData.AT.excludeTransactionCreator) {
    roles.forEach(role => {
      const findIndex = role.Users.findIndex(user => user.id === options.initiatedById);
      if (findIndex > -1) {
        role.Users.splice(findIndex, 1);
      }
    });
  }

  roles.forEach(role => {
    const { Users = [] } = role;
    eligibleApprovers.push(...Users.filter(user => !(options.userIds && options.userIds.includes(user.id))));
  });
  return eligibleApprovers;
};

export default approvalTemplateService;
