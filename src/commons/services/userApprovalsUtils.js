import * as BBPromise from 'bluebird';
import _set from 'lodash/set.js';
import _get from 'lodash/get.js';
import UserController from '../../controllers/userController.js';
import approvalTemplateService from '../../services/approvalTemplateService.js';
// import approvalValueBracketService from '../../services/approvalValueBracketService';

// import { DimensionalFields, ApprovalKeyFields } from '../../helpers/constants';
// import SupplierController from '../controllers/supplierController';
import { ValidationError } from '../../helpers/customError.js';

const userApprovalsUtils = {};

userApprovalsUtils.getApprovalTemplateItemsByApplyingUserFilters = async (approvalTemplate, auth, options) => {
  Object.keys(options).forEach(optionKey => {
    // if (optionKey === DimensionalFields.costCentre || optionKey === DimensionalFields.ledger || optionKey === DimensionalFields.department || optionKey === DimensionalFields.billingAddress) {
    //   const dimensionalFieldMappingKey = ApprovalKeyFields[optionKey];
    //   options[dimensionalFieldMappingKey] = !options[dimensionalFieldMappingKey] ? options[optionKey] : options[dimensionalFieldMappingKey];
    // }

    // if (optionKey === DimensionalFields.deliveryAddress) {
    //   options.addressId = !options.addressId ? options[optionKey] : options.addressId;
    // }
    if (optionKey === 'productCategory') {
      options.productCategoryId = !options.productCategoryId ? options.productCategory : options.productCategoryId;
    }
  });

  const managerIds = [];
  let managerMapping = [];
  const isManagerLevelApprovalHierarchyEnabled = approvalTemplate.ATIs.find(ati => ati.enableManagerLevelApprovalHierarchy);
  const isManagerLevelApprovalEnabled = approvalTemplate.ATIs.find(ati => ati.enableManagerLevelApproval);
  const enableCreatorLevelApprovalEnabled = approvalTemplate.ATIs.find(ati => ati.enableCreatorLevelApproval);
  let { userId } = auth;
  if (options.action === 'edit' && options.createdUserId) {
    userId = options.createdUserId;
  }
  if (isManagerLevelApprovalHierarchyEnabled || isManagerLevelApprovalEnabled) {
    const userController = new UserController(auth.customerId, auth.transaction);
    managerMapping = await userController.findAllManagerMapping(userId);
  }
  let currentUser = managerMapping.find(user => userId === user.id);
  const approvalValueBrackets = await approvalValueBracketService.findAllForSearch({}, auth);
  while (currentUser && currentUser.managerId) {
    const { managerId } = currentUser;
    managerIds.push(managerId);
    currentUser = managerMapping.find(user => user.id === managerId);
  }

  if (isManagerLevelApprovalEnabled) {
    userApprovalsUtils.filterApprovalTemplateItemsByManagerId(approvalTemplate, userId, managerMapping);
  }

  if (enableCreatorLevelApprovalEnabled && options.creatorId) {
    await userApprovalsUtils.filterApprovalTemplateItemsByCreatorId(approvalTemplate, auth, options.creatorId);
  }

  await BBPromise.mapSeries(approvalTemplate.ATIs, async ati => {
    if (ati.enableVendorApprovals) {
      if (!options.supplier) {
        throw new ValidationError('Invalid action - Supplier Not found');
      }
      // const supplierController = new SupplierController(auth.customerId);
      // const temp = await supplierController.findOneByIdWithXUserDetails(options.supplier);
      // const supplier = temp;
      // _set(ati, 'meta', { supplier });
    } else {
      if (ati.enableManagerLevelApproval || (ati.enableCreatorLevelApproval && options.creatorId)) {
        return;
      }
  
      let roles = await approvalTemplateService.getRoleDataForATIs(options, ati, 'transaction-level', auth);
  
      if (managerIds && roles && managerIds.length && roles.length && ati.enableManagerLevelApprovalHierarchy) {
        const isManagerialApprovalPresent = roles.some(role => role.Users.find(user => managerIds.includes((user.id))));
        roles = roles.map(role => {
          const temp = role.toJSON();
          const managerialUsers = role.Users.filter(user => managerIds.includes(user.id));
          _set(temp, 'Users', isManagerialApprovalPresent ? managerialUsers : role.Users);
          return temp;
        });
      }
  
      if (options.value && ati.enableValueFilter) {
        roles = roles.map(role => {
          const temp = JSON.parse(JSON.stringify(role));
          temp.Users.forEach(user => {
            const approvalValueBracket = approvalValueBrackets.find(approvalBracket => approvalBracket.id === user.approvalValueBracketId);
            if (approvalValueBracket && approvalValueBracket.minimum <= options.value && approvalValueBracket.maximum >= options.value) {
              user.isEligible = true;
            } else {
              user.isEligible = false;
            }
          });
          temp.Users = temp.Users.filter(user => !!user.isEligible);
          _set(temp, 'Users', temp.Users);
          return temp;
        });
      }
  
      if (options.subTotal && ati.enableSubTotalFilter) {
        roles = roles.map(role => {
          const temp = JSON.parse(JSON.stringify(role));
          temp.Users.forEach(user => {
            const approvalValueBracket = approvalValueBrackets.find(approvalBracket => approvalBracket.id === user.approvalValueBracketId);
            if (approvalValueBracket && approvalValueBracket.minimum <= options.subTotal && approvalValueBracket.maximum >= options.subTotal) {
              user.isEligible = true;
            } else {
              user.isEligible = false;
            }
          });
          temp.Users = temp.Users.filter(user => !!user.isEligible);
          _set(temp, 'Users', temp.Users);
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
      let users = [];
      roles.forEach(role => {
        users = users.concat(role.Users);
      });
  
      if (users && users.length === 0) {
        emptyAti = true;
      }
  
      if (emptyAti) {
        const removeIndex = approvalTemplate.ATIs.findIndex(item => item.id === ati.id);
        approvalTemplate.ATIs.splice(removeIndex, 1);
      } else {
        _set(ati, 'meta', { roles });
        if (roles && !roles.length) {
          const removeIndex = approvalTemplate.ATIs.findIndex(item => item.id === ati.id);
          approvalTemplate.ATIs.splice(removeIndex, 1);
        }
      }
    } 
  });
  return approvalTemplate;
};

userApprovalsUtils.filterApprovalTemplateItemsByManagerId = (approvalTemplate, userId, managerMapping) => {
  const currentUser = managerMapping.find(user => userId === user.id);
  const managerId = currentUser ? currentUser.managerId : null;
  const manager = managerMapping.find(user => managerId === user.id);
  approvalTemplate.ATIs.forEach((ati, index) => {
    if (!ati.enableManagerLevelApproval) {
      return;
    }
    approvalTemplate.ATIs[index].users = manager ? [manager] : [];
    _set(ati, 'meta', { roles: [{ Users: approvalTemplate.ATIs[index].users }] });
    if (!manager) {
      const removeIndex = approvalTemplate.ATIs.findIndex(item => item.id === ati.id);
      approvalTemplate.ATIs.splice(removeIndex, 1);
    }
  });
};

userApprovalsUtils.filterApprovalTemplateItemsByCreatorId = async (approvalTemplate, auth, creatorId) => {
  const userController = new UserController(auth.customerId, auth.transaction);
  const creator = await userController.findOneByIdWithAttributes(creatorId, ['id', 'name', 'managerId']);
  approvalTemplate.ATIs.forEach((ati, index) => {
    if (!ati.enableCreatorLevelApproval) {
      return;
    }
    approvalTemplate.ATIs[index].users = [creator];
    _set(ati, 'meta', { roles: [{ Users: approvalTemplate.ATIs[index].users }] });
  });
};

userApprovalsUtils.getEligibleOwners = async (transactionDetails, app, isAtiFilterNeeded, auth) => {
  const options = await approvalTemplateService.setOptionsToFilterUsers(transactionDetails, app, isAtiFilterNeeded, auth);
  const roles = await approvalTemplateService.applyModuleFilters(options, options.roleUsers, options.moduleFilters, auth);

  let eligibleOwners = [];
  roles.forEach(role => {
    const { Users = [] } = role;
    eligibleOwners.push(...Users);
  });
  if (transactionDetails.initiatedById === auth.userId) {
    eligibleOwners = eligibleOwners.filter(user => user.id !== auth.userId);
  } else {
    eligibleOwners = eligibleOwners.filter(user => user.id !== transactionDetails.initiatedById);
  }
  return eligibleOwners;
};

userApprovalsUtils.getEligibleApprovers = async (transactionDetails, app, isAtiFilterNeeded, auth) => {
  const options = await approvalTemplateService.setOptionsToFilterUsers(transactionDetails, app, isAtiFilterNeeded, auth);
  const roles = await approvalTemplateService.applyModuleFilters(options, options.roleUsers, options.moduleFilters, auth);

  const eligibleApprovers = [];
  if (options.approvalTemplateData && options.approvalTemplateData.AT && options.approvalTemplateData.AT.excludeTransactionCreator) {
    roles.forEach(role => {
      const findIndex = role.Users.findIndex(user => user.id === options.userId);
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

export default userApprovalsUtils;