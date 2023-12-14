import * as BBPromise from 'bluebird';
import _set from 'lodash/set.js';
import utils from '../helpers/utils.js';
import { ResourceNotFoundError, ValidationError } from '../helpers/customError.js';

import userAddressMappingService from './userAddressMappingService.js';
import companyAddressMappingService from './companyAddressMappingService.js';
import billingAddressMappingService from './billingAddressMappingService.js';
// import grootService from './grootService';
import userService from './userService.js';
// import approvalService from './approvalService';
// import entityUserMappingService from './entityUserMappingService';
import notificationService from './notificationService.js';
import userCacheService from './userCacheService.js';

import AddressController from '../controllers/addressController.js';
import UserController from '../controllers/userController.js';
import CompanyController from '../controllers/companyController.js';
import UserAddressMappingController from '../controllers/userAddressMappingController.js';
import CompanyAddressMappingController from '../controllers/companyAddressMappingController.js';
import CustomerController from '../controllers/customerController.js';

const addressService = {};

// const bulkCreateApprovals = async (records, addressId, auth) => {
//   const approvalRecords = records.map((record, index) => {
//     const newRecord = utils.copyKeys(record, ['approvers']);
//     newRecord.sequence = index + 1;
//     newRecord.addressId = addressId;
//     return newRecord;
//   });
//   // await approvalService.bulkCreate(approvalRecords, auth);
//   // const currentApproval = await approvalService.findCurrentApproval({ addressId }, auth);
//   const addressController = new AddressController(auth.customerId);
//   await addressController.updateById({
//     currentApprovalId: currentApproval.id,
//   }, addressId);
// };

// const clearAndBulkCreateApprovals = async (records, addressId, auth) => {
//   await approvalService.updateAsInactive({ addressId }, auth);
//   return bulkCreateApprovals(records, addressId, auth);
// };

// const getUserDefinedFieldsData = async (values, auth) => {
//   const customerController = new CustomerController();
//   const { addressUserDefinedFields } = await customerController.findOneByIdWithAttributes(auth.customerId, ['addressUserDefinedFields']);
//   const currentUserDefinedFields = [];
//   if (addressUserDefinedFields) {
//     Object.keys(addressUserDefinedFields).forEach((key) => {
//       if (addressUserDefinedFields[key] && addressUserDefinedFields[key].active === 1) {
//         currentUserDefinedFields.push(key);
//       }
//     });
//   }
//   const userDefinedFields = {};
//   Object.keys(values).forEach((key) => {
//     if (currentUserDefinedFields.includes(key)) {
//       userDefinedFields[key] = values[key];
//     }
//   });
//   return userDefinedFields;
// };

addressService.findAllForListing = async (options, auth) => {
  const addressController = new AddressController(auth.customerId);
  const ret = await addressController.findAllForListing(options, auth);
  const distinctCityNames = await addressController.findAllDistinctCityNames(options);
  const distinctStateNames = await addressController.findAllDistinctStateNames(options);
  const cityNames = distinctCityNames.map(cn => cn.DISTINCT);
  const stateNames = distinctStateNames.map(cn => cn.DISTINCT);
  const counts = await addressController.findAllForStatusCount(options);
  const statusCount = {
    active: 0,
    'pending-approval': 0,
    rejected: 0,
    'in-active': 0,
  };
  counts.forEach(count => {
    statusCount[count.status] = +count.count;
  });
  return {
    data: ret.rows,
    meta: {
      count: ret.count,
      cityNames,
      stateNames,
      statusCount,
    },
  };
};

addressService.findAllForOptions = (options, auth) => {
  const addressController = new AddressController(auth.customerId);
  return addressController.findAllForOptions(options);
};

addressService.create = async (values, auth) => {
  const addressController = new AddressController(auth.customerId);
  const addressCheck = await addressController.findOneBySlug(utils.slugify(values.keyword));
  if (addressCheck) {
    throw new ValidationError('Address with the same keyword already exists');
  }
  if (values.isBillingAddress) {
    if (!values.companyId) {
      throw new ValidationError('Invalid Action - Company must be associated for this billing address!');
    }
  }
  const newValues = utils.copyKeys(values, ['keyword', 'reference', 'line1', 'line2', 'landmark',
    'city', 'state', 'pincode', 'isBillingAddress', 'legalName', 'gstin', 'defaultBillingAddressId', 'country']);
  newValues.keywordSlug = utils.slugify(values.keyword);
  newValues.userId = auth.userId;
  newValues.status = 'active';
  // newValues.userDefinedFields = await getUserDefinedFieldsData(values, auth);
  // added for integration
  // newValues.active = (values.approvals.length || (values.active !== undefined && !values.active)) ? 0 : 1;
  newValues.active = 1;
  // if (!values.approvals.length && utils.hasKeys(values, ['active']) && !values.active) {
  //   newValues.status = 'in-active';
  // }
  const address = await addressController.create(newValues);
  if (values.isDefaultBillingAddress || (!address.defaultBillingAddressId && address.isBillingAddress)) {
    await addressController.updateById({ defaultBillingAddressId: address.id }, address.id);
  }
  // const entityUserMappingSet = new Set();
  // entityUserMappingSet.add(auth.userId);
  // if (values.approvals && values.approvals.length > 0) {
  //   values.approvals.forEach((approval) => {
  //     approval.approvers.forEach((approver) => {
  //       entityUserMappingSet.add(approver.userId);
  //     });
  //   });
  //   await bulkCreateApprovals(values.approvals, address.id, auth);
  // }
  // const entityUserMappings = [...entityUserMappingSet].map(userId => ({ userId }));
  // await entityUserMappingService.bulkCreateForAddress(entityUserMappings, address.id, auth);
  const approversExist = 1;
  if (values.userIds && values.userIds.length > 0) {
  // newValues.active = (values.approvals.length || (values.active !== undefined && !values.active)) ? 0 : 1;
    // await userAddressMappingService.bulkCreateForAddressId(values.userIds, address.id, auth, approversExist);
    await userAddressMappingService.bulkCreateForAddressId(values.userIds, address.id, auth);
    await userCacheService.bulkMarkInactiveByUserId(values.userIds, auth);
  }
  if (values.companyId) {
    const companyAddressMapping = [{ companyId: values.companyId, gstin: values.gstin, corporateIdentificationNumber: values.gstin }];
    await companyAddressMappingService.bulkCreateForAddressId(companyAddressMapping, address.id, auth, approversExist);
  }
  await billingAddressMappingService.bulkCreateForAddressId(values.billingAddressIds, address.id, auth);
  const addressRetObj = await addressController.findOneByIdForView(address.id);
  // if (addressRetObj.currentApprovalId) {
  //   const userIds = addressRetObj.CurrentApproval.approvers.map(a => a.userId);
  //   await notificationService.bulkCreateForUsers({
  //     text: `${addressRetObj.keyword}: Address has been sent for approval by ${addressRetObj.User.name}`,
  //     reference: {
  //       addressId: addressRetObj.id,
  //     },
  //     redirectionEntity: 'Address',
  //   }, userIds);
  // }
  return { id: addressRetObj.id };
};

// addressService.update = async (values, addressId, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const addressCheck = await addressController.findOneBySlug(utils.slugify(values.keyword));
//   if (addressCheck && addressCheck.id !== +addressId) {
//     throw new ValidationError('Facility with the same keyword already exists');
//   }
//   const newValues = utils.copyKeys(values, ['name', 'keyword', 'reference', 'locationCode', 'line1', 'line2', 'landmark',
//     'city', 'state', 'pincode', 'isBillingAddress', 'legalName', 'gstin', 'defaultBillingAddressId', 'country']);
//   newValues.keywordSlug = utils.slugify(values.keyword);
//   newValues.userId = auth.userId;
//   newValues.status = values.approvals.length ? 'pending-approval' : 'active';
//   newValues.userDefinedFields = await getUserDefinedFieldsData(values, auth);
//   // added for integration
//   newValues.active = (values.approvals.length || (values.active !== undefined && !values.active)) ? 0 : 1;
//   if (!values.approvals.length && utils.hasKeys(values, ['active']) && !values.active) {
//     newValues.status = 'in-active';
//   }
//   await addressController.updateById(newValues, addressId);
//   if (values.userIds && values.userIds.length > 0) {
//     await userAddressMappingService.bulkCheckAndCreateForAddressId(values.userIds, addressId, auth);
//   }
//   await billingAddressMappingService.bulkCheckAndCreateForAddressId(values.billingAddressIds, addressId, auth);
//   if (values.companyAddressMapping && values.companyAddressMapping.length > 0) {
//     await companyAddressMappingService.bulkCheckandCreateForAddressId(values.companyAddressMapping, addressId, auth);
//   }
//   const userAddressMappings = await userAddressMappingService.findAllByAddressId(addressId, auth);
//   const userIdsMapped = userAddressMappings.map(mapping => mapping.userId);
//   await userCacheService.bulkMarkInactiveByUserId(userIdsMapped, auth);
//   const entityUserMappingSet = new Set();
//   entityUserMappingSet.add(auth.userId);
//   if (values.approvals && values.approvals.length > 0) {
//     values.approvals.forEach((approval) => {
//       approval.approvers.forEach((approver) => {
//         entityUserMappingSet.add(approver.userId);
//       });
//     });
//     await clearAndBulkCreateApprovals(values.approvals, addressId, auth);
//   }
//   const entityUserMappings = [...entityUserMappingSet].map(userId => ({ userId }));
//   await entityUserMappingService.checkAndBulkCreateForAddress(entityUserMappings, addressId, auth);
//   const addressRetObj = await addressController.findOneByIdForView(addressId);
//   if (addressRetObj.currentApprovalId) {
//     const userIds = addressRetObj.CurrentApproval.approvers.map(a => a.userId);
//     await notificationService.bulkCreateForUsers({
//       text: `${addressRetObj.keyword}: Address has been sent for approval by ${addressRetObj.User.name}`,
//       reference: {
//         addressId: addressRetObj.id,
//       },
//       redirectionEntity: 'Address',
//     }, userIds);
//   }
//   return addressRetObj;
// };

addressService.findOneByIdForView = async (addressId, auth, options) => {
  const addressController = new AddressController(auth.customerId);
  const adrs = await addressController.findOneByIdForView(addressId, options);
  if (!adrs) {
    throw new ResourceNotFoundError('Address');
  }
  const address = adrs.toJSON();
  // const approvalUsers = await approvalService.findAllApprovalUsers(address.Approvals, auth);
  // _set(address, 'approvalUsers', approvalUsers);
  return address;
};

addressService.findOneById = (addressId, auth) => {
  const addressController = new AddressController(auth.customerId);
  return addressController.findOneById(addressId);
};

addressService.markInactiveById = async (addressId, auth) => {
  const addressController = new AddressController(auth.customerId);
  const userController = new UserController(auth.customerId);
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const companyAddressMappingController = new CompanyAddressMappingController(auth.customerId);
  const userMappingData = await addressController.findAllUamById(addressId);
  const userIds = new Set();
  if (userMappingData && userMappingData.UAMs.length > 0) {
    userMappingData.UAMs.forEach(uam => {
      userIds.add(uam.userId);
    });
    const uamIds = userMappingData.UAMs.map(uam => uam.id);
    const userUAMData = await userController.findOneByIdWithUAMs([...userIds]);
    const addressName = userMappingData.keyword;
    userUAMData.forEach(user => {
      if (user.UAMs.length === 1) {
        throw new ValidationError(`Cannot Mark Inactive. "${user.name}" has ONLY ONE AddressMapping and with "${addressName}"`);
      }
    });
    await userAddressMappingController.bulkMarkInactiveById(uamIds);
  }
  if (userMappingData && userMappingData.CAMs.length > 0) {
    userMappingData.CAMs.forEach(cam => {
      userIds.add(cam.userId);
    });
    const camIds = userMappingData.CAMs.map(cam => cam.id);
    await companyAddressMappingController.bulkMarkInactiveById(camIds);
  }
  await userCacheService.bulkMarkInactiveByUserId(Array.from(userIds), auth);
  return addressController.updateById({ active: 0, status: 'in-active' }, addressId);
};

addressService.markActiveById = async (addressId, auth) => {
  const addressController = new AddressController(auth.customerId);
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const companyAddressMappingController = new CompanyAddressMappingController(auth.customerId);
  const userMappingData = await addressController.findAllInactiveUamAndActiveUserById(addressId);
  const userIds = new Set();
  if (userMappingData && userMappingData.UAMs.length > 0) {
    userMappingData.UAMs.forEach(uam => {
      userIds.add(uam.userId);
    });
    const uamIds = userMappingData.UAMs.map(uam => uam.id);
    await userAddressMappingController.bulkMarkActiveById(uamIds);
  }
  if (userMappingData && userMappingData.CAMs.length > 0) {
    userMappingData.CAMs.forEach(cam => {
      userIds.add(cam.userId);
    });
    const camIds = userMappingData.CAMs.map(cam => cam.id);
    await companyAddressMappingController.bulkMarkActiveById(camIds);
  }
  await userCacheService.bulkMarkInactiveByUserId(Array.from(userIds), auth);
  return addressController.updateById({ active: 1, status: 'active' }, addressId);
};

addressService.getGSTIN = async (addressId, companyId, auth) => {
  const addressController = new AddressController(auth.customerId, auth.transaction);
  const address = await addressController.findOneByIdWithCustomer(addressId);
  const companyGSTIN = address.CAMs.find(cam => cam.companyId === companyId);
  if (!companyGSTIN) {
    throw new ValidationError('Invalid Company GSTIN not identified');
  }
  return companyGSTIN.gstin.trim();
};

addressService.findAllByIdsForRequisitionApproval = (addressIds, auth) => {
  const addressController = new AddressController(auth.customerId);
  return addressController.findAllByIdsForRequisitionApproval(addressIds);
};

// function removeDups(names) {
//   const unique = {};
//   names.forEach((i) => {
//     if (!unique[i]) {
//       unique[i] = true;
//     }
//   });
//   return Object.keys(unique);
// }

// const bulkUploadNotificationAndMailHelper = async (addressId, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const addressRetObj = await addressController.findOneByIdForView(addressId);
//   if (addressRetObj.currentApprovalId) {
//     const userIds = addressRetObj.CurrentApproval.approvers.map(a => a.userId);
//     await notificationService.bulkCreateForUsers({
//       text: `${addressRetObj.keyword}: Address has been sent for approval by ${addressRetObj.User.name}`,
//       reference: {
//         addressId: addressRetObj.id,
//       },
//       redirectionEntity: 'Address',
//     }, userIds);
//   }
// };

// const getApproversForBulkUpload = async (options, auth) => {
//   const approversListByHierarchies = await userService.findAllForApprovalsOnMasters(options, auth);
//   const approvals = [];
//   approversListByHierarchies.forEach((approversInHierarchy) => {
//     const approverUserIds = [];
//     approversInHierarchy.users.forEach((user) => {
//       approverUserIds.push({
//         userId: user.id,
//       });
//     });
//     approvals.push({
//       approvers: approverUserIds,
//     });
//   });
//   return approvals;
// };

// addressService.bulkUpload = async (values, auth) => {
//   const addressKeywordslugs = values.bulkUploadAddresses.filter(record => record.keyword !== null).map(record => utils.slugify(record.keyword));
//   const distinctaddressKeywordslugs = removeDups(addressKeywordslugs);
//   const addressController = new AddressController(auth.customerId);
//   const addressData = await addressController.findAllAddressesByKeywords(distinctaddressKeywordslugs);
//   const addressKeywordSlugData = addressData.map(address => address.keywordSlug);
//   const companyController = new CompanyController(auth.customerId);
//   const companiesData = await companyController.findAllWithCustomerId(auth.customerId);
//   const companies = companiesData.map(company => company.slug);
//   const companyAddressMappingController = new CompanyAddressMappingController(auth.customerId);

//   const bulkaddressKeywords = [];
//   const bulkaddressSnos = [];
//   let addressErrorcount = 0;
//   const errorLogs = [];
//   const successLogs = {};
//   let addressSuccessCount = 0;

//   values.bulkUploadAddresses.forEach((record) => {
//     let recordStatus = true;
//     const errorMeta = {
//       errorCount: 0,
//     };
//     const meta = [];
//     if (!record.id || bulkaddressSnos.includes(record.id)) {
//       errorMeta.sno = 'Address with the same SNo already exists or it is empty in Uploaded Excel File';
//       meta.push(errorMeta.sno);
//       errorMeta.errorCount += 1;
//       recordStatus = false;
//     } else {
//       errorMeta.addressId = record.id;
//     }
//     // errorMeta.addressId = record.id;
//     if (record.keyword === null) {
//       errorMeta.keyword = 'keyword field is blank';
//       errorMeta.errorCount += 1;
//       meta.push(errorMeta.keyword);
//       recordStatus = false;
//     }
//     if (record.keyword !== null) {
//       if (addressKeywordSlugData.includes(utils.slugify(record.keyword))) {
//         errorMeta.keyword = 'Address with the same Keyword already exists';
//         errorMeta.errorCount += 1;
//         meta.push(errorMeta.keyword);
//         recordStatus = false;
//       }
//     }
//     if (record.keyword !== null) {
//       if (bulkaddressKeywords.includes(utils.slugify(record.keyword))) {
//         errorMeta.keyword = 'Address Wwth the same Keyword already exists in Uploaded Excel File';
//         meta.push(errorMeta.keyword);
//         errorMeta.errorCount += 1;
//         recordStatus = false;
//       }
//     }
//     if (!record.isBillingAddress || !['yes', 'no'].includes(record.isBillingAddress.toLowerCase())) {
//       errorMeta.isBillingAddress = 'isBillingAddress field entry is not either yes/no';
//       errorMeta.errorCount += 1;
//       meta.push(errorMeta.isBillingAddress);
//       recordStatus = false;
//     }
//     if (record.isBillingAddress && record.isBillingAddress.toLowerCase() === 'yes') {
//       if (!record.company || record.company === null) {
//           errorMeta.company = 'Company field entry is empty';
//           meta.push(errorMeta.company);
//           errorMeta.errorCount += 1;
//           recordStatus = false;
//       } else if (record.company) {
//         if (!companies.includes(utils.slugify(record.company))) {
//           errorMeta.company = 'Company does not exist';
//           meta.push(errorMeta.company);
//           errorMeta.errorCount += 1;
//           recordStatus = false;
//         }
//         if (!record.gstin || record.gstin === null) {
//           errorMeta.gstin = 'No GSTIN value entered';
//           meta.push(errorMeta.gstin);
//           errorMeta.errorCount += 1;
//           recordStatus = false;
//         }
//         if (record.gstin && record.gstin.length !== 15) {
//           errorMeta.gstin = 'Wrong GSTIN value entry';
//           meta.push(errorMeta.gstin);
//           errorMeta.errorCount += 1;
//           recordStatus = false;
//         }
//       }
//     }
//     if (!record.line1 && !record.line2) {
//       errorMeta.line1 = 'Address Line Field is empty';
//       meta.push(errorMeta.line1);
//       errorMeta.errorCount += 1;
//       recordStatus = false;
//     }
//     if (!record.city || record.city === null) {
//       errorMeta.city = 'City Field is empty';
//       meta.push(errorMeta.city);
//       errorMeta.errorCount += 1;
//       recordStatus = false;
//     }
//     if (!record.state || record.state === null) {
//       errorMeta.state = 'State Field is empty';
//       meta.push(errorMeta.state);
//       errorMeta.errorCount += 1;
//       recordStatus = false;
//     }
//     if (!record.pincode || record.pincode === null) {
//       errorMeta.pincode = 'Pincode Field is empty';
//       meta.push(errorMeta.pincode);
//       errorMeta.errorCount += 1;
//       recordStatus = false;
//       if (!utils.isNumeric(record.pincode) || record.pincode <= 0) {
//         errorMeta.pinCodeValue = 'Incorrect Pincode value';
//         meta.push(errorMeta.pinCodeValue);
//         errorMeta.errorCount += 1;
//         recordStatus = false;
//       }
//     }
//     if (recordStatus === true) {
//       successLogs[record.id] = 'All Address Details are in desired format';
//       addressSuccessCount += 1;
//     }
//     if (record.keyword !== null) {
//       bulkaddressKeywords.push(utils.slugify(record.keyword));
//     }
//     bulkaddressSnos.push(record.id);
//     addressErrorcount += errorMeta.errorCount;
//     errorMeta.meta = meta;
//     errorLogs.push(errorMeta);
//   });

//   if (Object.keys(successLogs).length === values.bulkUploadAddresses.length) {
//     const bulkAddressRecords = [];
//     const approvers = await getApproversForBulkUpload({ access: 'facilityApprove' }, auth);
//     await BBPromise.mapSeries(values.bulkUploadAddresses, async (record) => {
//       const newAddressValues = utils.copyKeys(record, ['name', 'keyword', 'reference', 'locationCode', 'line1', 'line2', 'landmark',
//         'city', 'state', 'pincode', 'isBillingAddress']);
//       if (record.keyword) {
//         newAddressValues.keywordSlug = utils.slugify(newAddressValues.keyword);
//       }
//       if (record.isBillingAddress.toLowerCase() === 'yes') {
//         newAddressValues.isBillingAddress = 1;
//       }
//       if (record.isBillingAddress.toLowerCase() === 'no') {
//         newAddressValues.isBillingAddress = 0;
//       }
//       newAddressValues.userId = auth.userId;
//       newAddressValues.status = approvers.length ? 'pending-approval' : 'active';
//       newAddressValues.active = approvers.length ? 0 : 1;
//       bulkAddressRecords.push(newAddressValues);
//     });
//     const addresses = await addressController.bulkCreate(bulkAddressRecords);
//     const addressObject = {};
//     addresses.forEach((address) => {
//       addressObject[address.keyword] = address.id;
//     });
//     const cams = [];
//     // values.bulkUploadAddresses.forEach(async (record) => {
//     await BBPromise.mapSeries(values.bulkUploadAddresses, async (record) => {
//       if (record.isBillingAddress.toLowerCase() === 'yes') {
//         cams.push({
//           companyId: companiesData.find(company => company.slug === utils.slugify(record.company)).id,
//           gstin: record.gstin,
//           addressId: addressObject[record.keyword],
//         });
//       }
//       const address = await addressController.findOneBySlug(utils.slugify(record.keyword));
//       const entityUserMappingSet = new Set();
//       entityUserMappingSet.add(auth.userId);
//       if (approvers && approvers.length > 0) {
//         approvers.forEach((approval) => {
//           approval.approvers.forEach((approver) => {
//             entityUserMappingSet.add(approver.userId);
//           });
//         });
//         await bulkCreateApprovals(approvers, address.id, auth);
//         await bulkUploadNotificationAndMailHelper(address.id, auth);
//       }
//       const entityUserMappings = [...entityUserMappingSet].map(userId => ({ userId }));
//       await entityUserMappingService.bulkCreateForAddress(entityUserMappings, address.id, auth);
//     });
//     companyAddressMappingController.bulkCreate(cams);
//     return {
//       meta: {
//         addressErrorcount: 0,
//         bulkAddressRecords,
//       },
//     };
//   }

//   return {
//     meta: { addressSuccessCount, addressErrorcount, errorLogs },
//   };
// };

// addressService.getApprovers = async (options, auth) => {
//   _set(options, 'access', 'facilityApprove');
//   return userService.findAllForApprovalsOnMasters(options, auth);
// };

// addressService.approve = async (addressId, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const address = await addressController.findOneByIdWithApprovals(addressId);
//   if (address.status !== 'pending-approval') {
//     throw new ValidationError('Invalid action - Address status is not pending approval');
//   }
//   const pendingApprovals = address.Approvals.filter(approval => approval.status === 'pending' && approval.active === 1);
//   let currentApproval;
//   let nextApproval;
//   if (pendingApprovals.length === 0) {
//     throw new ValidationError('Invalid action - No pending approvals on Address');
//   } else {
//     [currentApproval, nextApproval = null] = pendingApprovals;
//   }
//   const userInCurrentApproval = currentApproval.approvers.find(a => a.userId === auth.userId);
//   if (!userInCurrentApproval) {
//     throw new ValidationError('Invalid action - Logged in user is not current approver');
//   }
//   await approvalService.updateByIdAsApproved(currentApproval.id, auth);
//   const updateValues = {};
//   if (nextApproval) {
//     updateValues.currentApprovalId = nextApproval.id;
//   } else {
//     updateValues.status = 'active';
//     updateValues.currentApprovalId = null;
//     await addressService.markActiveById(addressId, auth);
//   }
//   await addressController.updateById(updateValues, addressId);
//   const userAddressMappings = await userAddressMappingService.findAllByAddressId(addressId, auth);
//   const userIdsMapped = userAddressMappings.map(mapping => mapping.userId);
//   await userCacheService.bulkMarkInactiveByUserId(userIdsMapped, auth);
//   await notificationService.createForUser({
//     text: `${address.keyword}: Address has been approved by ${auth.User.name}`,
//     reference: {
//       addressId,
//     },
//     redirectionEntity: 'Address',
//   }, address.userId);
//   const addressRetObj = await addressService.findOneByIdForView(addressId, auth);
//   if (addressRetObj.currentApprovalId) {
//     const userIds = addressRetObj.CurrentApproval.approvers.map(a => a.userId);
//     await notificationService.bulkCreateForUsers({
//       text: `${addressRetObj.keyword}: Address has been sent for approval by ${addressRetObj.User.name}`,
//       reference: {
//         addressId: addressRetObj.id,
//       },
//       redirectionEntity: 'Address',
//     }, userIds);
//   }
//   return { id: addressRetObj.id };
// };

// addressService.reject = async (values, addressId, auth) => {
//   if (!values.rejectionReason || values.rejectionReason.trim() === '') {
//     throw new ValidationError('Rejection reason is mandatory');
//   }
//   const addressController = new AddressController(auth.customerId);
//   const address = await addressController.findOneByIdWithApprovals(addressId);
//   if (address.status !== 'pending-approval') {
//     throw new ValidationError('Invalid action - Address status is not pending approval');
//   }
//   const pendingApprovals = address.Approvals.filter(approval => approval.status === 'pending' && approval.active === 1);
//   let currentApproval;
//   if (pendingApprovals.length === 0) {
//     throw new ValidationError('Invalid action - No pending approvals on Address');
//   } else {
//     [currentApproval] = pendingApprovals;
//   }
//   const userInCurrentApproval = currentApproval.approvers.find(a => a.userId === auth.userId);
//   if (!userInCurrentApproval) {
//     throw new ValidationError('Invalid action - Logged in user is not current approver');
//   }
//   await approvalService.updateByIdAsRejected(values, currentApproval.id, auth);
//   await addressService.markInactiveById(addressId, auth);
//   const updateValues = {
//     status: 'rejected',
//     currentApprovalId: null,
//     rejectionReason: values.rejectionReason,
//     active: 0,
//   };
//   await addressController.updateById(updateValues, addressId);
//   const userAddressMappings = await userAddressMappingService.findAllByAddressId(addressId, auth);
//   const userIdsMapped = userAddressMappings.map(mapping => mapping.userId);
//   await userCacheService.bulkMarkInactiveByUserId(userIdsMapped, auth);
//   const addressRetObj = await addressService.findOneByIdForView(addressId, auth);
//   await notificationService.createForUser({
//     text: `${addressRetObj.keyword}: Address has been rejected by ${auth.User.name}`,
//     reference: {
//       addressId,
//     },
//     redirectionEntity: 'Address',
//   }, addressRetObj.userId);
//   return { id: addressRetObj.id };
// };

// addressService.findOneByReference = (reference, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   return addressController.findOneByReference(reference);
// };

// addressService.findAllByReferences = (references, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   return addressController.findAllByReferences(references);
// };

// addressService.findAllForListingInTransactions = async (options, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const ret = await addressController.findAllForListingInTransactions(options);
//   return ret;
// };

// addressService.findAllwithUserMappings = async (auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const userController = new UserController(auth.customerId);
//   const attributes = ['addressAdmin'];
//   const user = await userController.findOneByIdWithAttributes(auth.userId, attributes);
//   const ret = await addressController.findAllwithUserMappings(auth, user.addressAdmin);
//   return ret;
// };

// addressService.findAllActiveAndInactiveAddresses = async (options, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const attributes = ['id', 'keyword', 'isBillingAddress'];
//   return addressController.findAllWithAttributes({}, attributes);
// };

// addressService.findAllForBulkUpload = async (distinctAddressesNames, auth) => {
//   const addressController = new AddressController(auth.customerId);
//   const userController = new UserController(auth.customerId);
//   const addressMap = {};
//   const user = await userController.findOneByIdWithAttributes(auth.userId, ['addressAdmin']);
//   const addresses = await addressController.findAllForBulkUpload(distinctAddressesNames, auth, user.addressAdmin);
//   addresses.forEach(address => {
//     addressMap[address.keyword] = address;
//   });
//   return addressMap;
// };

export default addressService;
