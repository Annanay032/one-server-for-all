import _set from 'lodash/set.js';
import utils from '../helpers/utils.js';
import { ValidationError } from '../helpers/customError.js';
import UserController from '../controllers/userController.js';
import RoleController from '../controllers/roleController.js';
// import SectionController from '../controllers/sectionController';
import userCacheService from './userCacheService.js';
// import auditLogService from './auditLogService';
// import { AuditLogger } from '../../commons/services/AuditLogger';
import NotificationController from '../controllers/notificationController.js';

const roleService = {};

roleService.findAllForListing = async (options, auth) => {
  const roleController = new RoleController(auth.customerId);
  const roles = await roleController.findAllForListing(options);
  return {
    data: roles.rows,
    meta: {
      count: roles.count,
    },
  };
};

roleService.findAllForSearch = async (options, auth) => {
  const roleController = new RoleController(auth.customerId);
  return roleController.findAllForSearch(options);
};

roleService.findOneById = (roleId, auth) => {
  const roleController = new RoleController(auth.customerId);
  return roleController.findOneById(roleId);
};

roleService.findAllByOptions = auth => {
  const roleController = new RoleController(auth.customerId);
  return roleController.findAllForOptions();
};

roleService.create = async (values, auth) => {
  const allowedValuesForListingTypes = ['all', 'dimensions', 'collaborators'];
  if (!values.name) {
    throw new ValidationError('Name is mandatory');
  }
  if(!allowedValuesForListingTypes.includes(values.requisitionListingType)) {
    throw new ValidationError('Invalid listing type for Requisition');
  }
  if(!allowedValuesForListingTypes.includes(values.purchaseOrderListingType)) {
    throw new ValidationError('Invalid listing type for Purchase Order');
  }
  if(!allowedValuesForListingTypes.includes(values.invoiceListingType)) {
    throw new ValidationError('Invalid listing type for Invoice');
  }
  if(!allowedValuesForListingTypes.includes(values.stockInwardListingType)) {
    throw new ValidationError('Invalid listing type for Stock Inward');
  }

  const roleController = new RoleController(auth.customerId);
  const roleCheck = await roleController.findOneBySlug(utils.slugify(values.name));
  if (roleCheck) {
    throw new ValidationError('Role with the same name already exists');
  }
  // const seriesController = new SeriesController(auth.customerId);
  // const nextValue = await seriesController.findNextRolehierarchyValue();
  const rolehierarchy = 99999;
  _set(values, 'slug', utils.slugify(values.name));
  // _set(values, 'rolehierarchy', nextValue);
  _set(values, 'rolehierarchy', rolehierarchy);
  return roleController.create(values);
};

roleService.updateById = async (values, roleId, auth) => {
  const allowedValuesForListingTypes = ['all', 'dimensions', 'collaborators'];
  if (!values.name) {
    throw new ValidationError('Name is mandatory');
  }

  if(!allowedValuesForListingTypes.includes(values.requisitionListingType)) {
    throw new ValidationError('Invalid listing type for Requisition');
  }
  if(!allowedValuesForListingTypes.includes(values.purchaseOrderListingType)) {
    throw new ValidationError('Invalid listing type for Purchase Order');
  }
  if(!allowedValuesForListingTypes.includes(values.invoiceListingType)) {
    throw new ValidationError('Invalid listing type for Invoice');
  }
  if(!allowedValuesForListingTypes.includes(values.stockInwardListingType)) {
    throw new ValidationError('Invalid listing type for Stock Inward');
  }

  const roleController = new RoleController(auth.customerId);
  const userController = new UserController(auth.customerId);
  const oldRoleData = await roleController.findOneByIdForAuditLogs(roleId);
  const roleCheck = await roleController.findOneBySlug(utils.slugify(values.name));
  // const sectionController = new SectionController(auth.customerId);
  // if (roleCheck && roleCheck.id !== +roleId) {
  //   throw new ValidationError('Role with the same name already exists');
  // }
  // const sections = await sectionController.findOneByRoleId(roleId);
  // if (sections && sections.length && values.onboardSupplierView === 0) {
  //   throw new ValidationError('Invalid - Role is being used for internalUserUpdate on Vendor Oboboarding.');
  // }
  _set(values, 'slug', utils.slugify(values.name));
  const users = await userController.findAllByRoleId(roleId);
  const userIds = users.map(user => user.id);
  await userCacheService.bulkMarkInactiveByUserId(userIds, auth);
  await roleController.updateById(values, roleId);
  const newRoleData = await roleController.findOneByIdForAuditLogs(roleId);
  oldRoleData.slug = newRoleData.slug 
  // const auditLog = new AuditLogger(
  //   { customerId: auth.customerId, userId: auth.userId},
  //   'UPDATE',
  //   'roleUpdate',
  //   'Role',
  //   null,
  // );
  // auditLog.addRowId(roleId);
  // auditLog.addComment(values.comment);
  // auditLog.addIpAddress(values.ipAddress);
  // await auditLogService.pushChangesToAudits({ header: oldRoleData.toJSON() }, { header: newRoleData.toJSON() }, auditLog);
  // await auditLog.save();
  return roleController.findOneById(roleId);
};

roleService.updateHierarchy = async (values, auth) => {
  if (!values.roleHierarchyValues || !values.roleHierarchyValues.length > 0) {
    throw new ValidationError('Invalid Details');
  }
  const updateRecords = [];
  let rolehierarchy = 1;
  const roleController = new RoleController(auth.customerId);
  values.roleHierarchyValues.forEach((role) => {
    updateRecords.push({
      roleId: role,
      rolehierarchy,
    });
    rolehierarchy += 1;
  });
  await Promise.all(updateRecords.map(record => roleController.updateById({ rolehierarchy: record.rolehierarchy }, record.roleId)));
};

roleService.findAllForListingInTransactions = async (options, auth) => {
  const roleController = new RoleController(auth.customerId);
  return roleController.findAllForFilter(options);
};

roleService.deleteById = async (id, auth) => {
  const userController = new UserController(auth.customerId);
  const notificationController = new NotificationController(auth.customerId);

  const options = {
    where: {
      id,
    },
  };
  const user = await userController.delete(options);
  if (user) {
    const values = {
      type: 'Test2',
      Text: 'deleted',
      active: 1,
      read: 0,
      reference: 'outBound',
      code: 'test002',
      userId: 1,
    };
    await notificationController.create(values);
  }
  return user;
};

export default roleService;
