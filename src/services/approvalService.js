import _set from 'lodash/set.js';

import { Op } from 'sequelize';
import ApprovalController from '../controllers/approvalController.js';
import UserController from '../controllers/userController.js';
import ApprovalUserMappingController from '../controllers/approvalUserMappingController.js';
import ApprovalTemplateItemController from '../controllers/approvalTemplateItemController.js';

import approvalUserMappingService from './approvalUserMappingService.js';

import { ValidationError } from '../helpers/customError.js';
import utils from '../helpers/utils.js';
// import approvalXUserMappingService from '../../sapp/services/approvalXuserMappingService';
// import ApprovalXUserMappingController from '../../sapp/controllers/approvalXuserMappingController';

const approvalService = {};

approvalService.bulkCreate = (records, auth) => {
  const approvalController = new ApprovalController(auth.customerId);
  return approvalController.bulkCreate(records);
};

approvalService.updateAsInactive = async (options, auth, action) => {
  _set(options, 'active', 1);
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const activeApprovals = await approvalController.findAllActiveApprovalsForTransaction(options);
  const approvalIds = activeApprovals.map(app => app.id);
  await approvalUserMappingController.bulkMarkInactiveByApprovalIds(approvalIds);
  await approvalController.update({
    active: 0,
    currentApprovalUserIds: [],
  }, {
    where: {
      id: approvalIds,
    },
  });
};

approvalService.updateByIdAsApproved = async (id, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  await approvalController.updateById({
    status: 'approved',
    actionAt: new Date(),
    actionById: auth.userId,
    isCurrentApprovalSequence: 0,
    currentApprovalUserIds: [],
  }, id);
};

approvalService.updateByIdAsRejected = async (values, id, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  await approvalController.updateById({
    status: 'rejected',
    reason: values.reason,
    actionAt: new Date(),
    actionById: auth.userId,
    currentApprovalUserIds: [],
  }, id);
};

approvalService.updateByIdAsUpdated = (id, auth) => {
  const approvalController = new ApprovalController(auth.customerId);
  return approvalController.updateById({
    status: 'updated',
    actionAt: new Date(),
    actionById: auth.userId,
  }, id);
};

approvalService.findCurrentApproval = (options, auth) => {
  _set(options, 'active', 1);
  _set(options, 'status', 'pending');
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  return approvalController.findOne({
    where: options,
    order: [['sequence', 'ASC']],
  });
};

approvalService.findAllApprovalUsers = (approvals, auth) => {
  if (approvals.length === 0) {
    return [];
  }
  const userIdSet = new Set();
  approvals.forEach((approval) => {
    approval.approvers.forEach((approver) => {
      userIdSet.add(approver.userId);
      if (approver.delegatedByUserId) {
        userIdSet.add(approver.delegatedByUserId);
      }
    });
  });
  const userController = new UserController(auth.customerId);
  return userController.findAllByIdsForApprovalDisplay([...userIdSet]);
};

approvalService.updateAsInactiveWithSequence = async (options, sequence, auth) => {
  _set(options, 'active', 1);
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvals = await approvalController.findAll({
    where: options,
  });
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalIds = approvals.filter(approval => (approval.sequence >= sequence)).map(approval => approval.id);
  // When used generally we can remove this if condition
  await approvalUserMappingController.bulkMarkInactiveByApprovalIds(approvalIds);
  return approvalController.update({
    active: 0,
  }, {
    where: {
      id: approvalIds,
    },
  });
};

approvalService.findAllCurrentApprovalUsers = async (approval, auth) => {
  const userIdSet = new Set();
  approval.approvers.forEach((approver) => {
    userIdSet.add(approver.userId);
    if (approver.delegatedByUserId) {
      userIdSet.add(approver.delegatedByUserId);
    }
  });
  const userController = new UserController(auth.customerId, auth.transaction);
  const users = await userController.findAllByIdsForApprovalDisplay([...userIdSet]);
  return users;
};

approvalService.updateIndividualAUMById = async (values = {}, approvalId, type, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const currentApproval = await approvalController.findOneWithAUMs(approvalId, auth.userId);
  if(currentApproval) {
    const aumIds = currentApproval.AUMs.map(aum => aum.id);
    await approvalUserMappingController.update({
      status: 'void',
      actionAt: new Date(),
    }, {
      where: {
        id: aumIds,
      },
    });
  }
  return approvalUserMappingController.update({
    status: type === 'approve' ? 'approved' : 'rejected',
    actionAt: new Date(),
    comments: values.reason,
  }, {
    where: {
      approvalId,
      userId: auth.userId,
    },
  });
};

approvalService.updateStartTimeForReminders = async (nextApproval, module, auth) => {
  const approvalUserMappingIds = nextApproval.AUMs.map(aum => aum.id);
  await approvalUserMappingService.bulkCreateApprovalReminders(nextApproval.ATI, approvalUserMappingIds, module, auth);
};

approvalService.updateStartTimeForRemindersByApprovalId = async (approvalId, module, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithTemplateItem(approvalId);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: {
      approvalId,
      active: 1,
    },
  }, ['id']);
  const approvalUserMappingIds = approvalUserMappings.map(aum => aum.id);
  await approvalUserMappingService.bulkCreateApprovalReminders(approval.ATI, approvalUserMappingIds, module, auth);
};

approvalService.updateNextSelectedApprovalsById = async (values, approvalId, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: {
      approvalId,
      active: 1,
    },
  }, ['id', 'userId']);

  const aumIdsToMarkAsSkipped = [];
  approvalUserMappings.forEach(aumData => {
    if (!(values.nextSelectedApprovers || []).includes(aumData.userId)) {
      aumIdsToMarkAsSkipped.push(aumData.id);
    }
  });

  await approvalUserMappingController.update({
    status: 'skipped',
  }, {
    where: {
      active: 1,
      id: aumIdsToMarkAsSkipped,
    },
  });
};

approvalService.updateAsCurrentApprovalByIdforSupplier = async (approvalId, module, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalXUserMappingController = new ApprovalXUserMappingController(auth.customerId, auth.transaction);
  const approvalUserIds = await approvalService.getApprovalUserIds(approvalId, auth);
  await approvalController.updateById({
    isCurrentApprovalSequence: 1,
    approvalStartTime: new Date(),
    currentApprovalUserIds: approvalUserIds,
  }, approvalId);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'approvalTemplateItemDetails']);
  await approvalXUserMappingController.update({
    approvalStartTime: new Date(),
  }, {
    where: {
      approvalId,
      active: 1,
    },
  });
  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.deadlineValue) {
    await approvalService.updateStartTimeForRemindersByApprovalId(approval.id, module, auth);
  }
};


approvalService.updateAsCurrentApprovalById = async (approvalId, module, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalUserIds = await approvalService.getApprovalUserIds(approvalId, auth);
  await approvalController.updateById({
    isCurrentApprovalSequence: 1,
    approvalStartTime: new Date(),
    currentApprovalUserIds: approvalUserIds,
  }, approvalId);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'approvalTemplateItemDetails']);
  await approvalUserMappingController.update({
    approvalStartTime: new Date(),
  }, {
    where: {
      approvalId,
      active: 1,
    },
  });
  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.deadlineValue) {
    await approvalService.updateStartTimeForRemindersByApprovalId(approval.id, module, auth);
  }
};

const updateAsCurrentApproval = async (approvalId, options, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'approvalTemplateItemDetails']);
  const updateValues = { isCurrentApprovalSequence: 1 };
  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.deadlineValue) {
    updateValues.approvalStartTime = new Date();
  }
  await approvalController.updateById(updateValues, approvalId);
  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.deadlineValue) {
    await approvalService.updateStartTimeForRemindersByApprovalId(approval.id, options.moduleName, auth);
  }
};

approvalService.createRecordForTransactions = async (newRecord = {}, record = {}, approvalWithoutTemplateFlag = false, index, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId, auth.transaction);
  const userController = new UserController(auth.customerId, auth.transaction);
  newRecord.approvers = record.approvers;
  const roleIdSet = new Set();
  const userIdSet = new Set();
  record.approvers.forEach((app) => {
    userIdSet.add(app.userId);
  });
  newRecord.userIds = [...userIdSet];
  const attributes = ['id', 'roleId'];
  const users = await userController.findAllWithAttributes(newRecord.userIds, attributes);
  users.forEach((user) => {
    roleIdSet.add(user.roleId);
  });
  newRecord.roleIds = [...roleIdSet];
  if (approvalWithoutTemplateFlag) {
    newRecord.approvalTemplateItemDetails = {
      commentRequired: 0,
      approvalType: 'anyone',
      rejectionReasonRequired: 1,
    };
  } else {
    const approvalTemplateItem = await approvalTemplateItemController.findOneByIdWithReminders(record.approvalTemplateItemId);
    newRecord.approvalTemplateItemId = record.approvalTemplateItemId;
    if (index === 0) {
      newRecord.approvalStartTime = new Date();
    }

    newRecord.approvalTemplateItemDetails = {
      commentRequired: approvalTemplateItem.commentRequired,
      rejectionReasonRequired: approvalTemplateItem.rejectionReasonRequired,
      approvalType: approvalTemplateItem.approvalType,
      minimumApprovalCount: approvalTemplateItem.minimumApprovalCount,
      deadlineValue: approvalTemplateItem.deadlineValue,
      enableTransactionEditing: approvalTemplateItem.enableTransactionEditing,
      rejectionType: approvalTemplateItem.rejectionType,
      minimumRejectionCount: approvalTemplateItem.minimumRejectionCount,
      enableInternalUpdate: approvalTemplateItem.enableInternalUpdate,
      enableTransactionHold: approvalTemplateItem.enableTransactionHold,
      enableRejectBtn: approvalTemplateItem.enableRejectBtn,
      approveText: approvalTemplateItem.approveText,
      statusText: approvalTemplateItem.statusText,
      enableRevert: approvalTemplateItem.enableRevert,
      enableNextSequenceApprovers: approvalTemplateItem.enableNextSequenceApprovers,
      autoSelectApprovers: approvalTemplateItem.autoSelectApprovers,
    };
    if (!newRecord.type && approvalTemplateItem.enableInternalUpdate) {
      newRecord.type = 'updater';
    }
  }
  const approval = await approvalController.create(newRecord);
  // if (newRecord.enableVendorApprovals) {
  //   await approvalXUserMappingService.bulkCreateForApproval(newRecord.approvers, approval.id, auth, newRecord.approvalStartTime);
  // } else {

    await approvalUserMappingService.bulkCreateForApproval(newRecord.approvers, approval.id, auth, newRecord.approvalStartTime);
  // }
};

approvalService.createRecordForTransactionsBasedOnSequence = async (newRecord = {}, record = {}, index, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId, auth.transaction);
  const userController = new UserController(auth.customerId, auth.transaction);
  const approvalTemplateItem = await approvalTemplateItemController.findOneByIdWithReminders(record.approvalTemplateItemId);
  newRecord.approvers = record.approvers;
  const roleIdSet = new Set();
  const userIdSet = new Set();
  record.approvers.forEach((app) => {
    userIdSet.add(app.userId);
  });
  newRecord.userIds = [...userIdSet];
  const attributes = ['id', 'roleId'];
  const users = await userController.findAllWithAttributes(newRecord.userIds, attributes);
  users.forEach((user) => {
    roleIdSet.add(user.roleId);
  });
  newRecord.roleIds = [...roleIdSet];
  newRecord.approvalTemplateItemId = record.approvalTemplateItemId;
  if (index === 0) {
    newRecord.approvalStartTime = new Date();
  }
  newRecord.approvalTemplateItemDetails = {
    commentRequired: approvalTemplateItem.commentRequired,
    approvalType: approvalTemplateItem.approvalType,
    rejectionReasonRequired: approvalTemplateItem.rejectionReasonRequired,
    minimumApprovalCount: approvalTemplateItem.minimumApprovalCount,
    deadlineValue: approvalTemplateItem.deadlineValue,
    enableTransactionEditing: approvalTemplateItem.enableTransactionEditing,
    rejectionType: approvalTemplateItem.rejectionType,
    minimumRejectionCount: approvalTemplateItem.minimumRejectionCount,
    enableTransactionHold: approvalTemplateItem.enableTransactionHold,
    enableInternalUpdate: approvalTemplateItem.enableInternalUpdate,
    enableRejectBtn: approvalTemplateItem.enableRejectBtn,
    approveText: approvalTemplateItem.approveText,
    statusText: approvalTemplateItem.statusText,
    enableNextSequenceApprovers: approvalTemplateItem.enableNextSequenceApprovers,
    autoSelectApprovers: approvalTemplateItem.autoSelectApprovers,
    enableRevert: approvalTemplateItem.enableRevert,
  };
  const approval = await approvalController.create(newRecord);
  // if (newRecord.enableVendorApprovals) {
  //   await approvalXUserMappingService.bulkCreateForApproval(newRecord.approvers, approval.id, auth, newRecord.approvalStartTime);
  // } else {
    await approvalUserMappingService.bulkCreateForApproval(newRecord.approvers, approval.id, auth, newRecord.approvalStartTime);
  // }
};

approvalService.updateCurrentApprovalStatusById = async (id, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalUserIds = await approvalService.getApprovalUserIds(id, auth);
  await approvalController.updateById({
    isCurrentApprovalSequence: 1,
    approvalStartTime: new Date(),
    currentApprovalUserIds: approvalUserIds,
  }, id);
  await approvalUserMappingController.update({
    approvalStartTime: new Date(),
  }, {
    where: {
      approvalId: id,
      active: 1,
    },
  });
};

const updateApprovalXUserMappingAsApproved = async (values, approvalId, auth) => {
  const approvalXUserMappingController = new ApprovalXUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'approved',
    actionAt: new Date(),
    comments: values.reason,
  };
  const updateFilter = {
    approvalId,
    xUserId: auth.xUserId,
    active: 1,
  };
  await approvalXUserMappingController.update(updateValues, { where: updateFilter });
};

const updateApprovalXUserMappingAsRejected = async (values, approvalId, auth) => {
  const approvalXUserMappingController = new ApprovalXUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'rejected',
    actionAt: new Date(),
    comments: values.reason,
  };
  const updateFilter = {
    approvalId,
    xUserId: auth.xUserId,
    active: 1,
  };
  await approvalXUserMappingController.update(updateValues, { where: updateFilter });
};

const updateApprovalUserMappingAsApproved = async (values, approvalId, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'approved',
    actionAt: new Date(),
    comments: values.reason,
  };
  const updateFilter = {
    approvalId,
    userId: auth.userId,
    active: 1,
  };
  await approvalUserMappingController.update(updateValues, { where: updateFilter });
};

const updateApprovalUserMappingAsRejected = async (values, approvalId, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'rejected',
    actionAt: new Date(),
    comments: values.reason,
  };
  const updateFilter = {
    approvalId,
    userId: auth.userId,
    active: 1,
  };
  await approvalUserMappingController.update(updateValues, { where: updateFilter });
};

const updatePendingApprovalUserMappingsAsVoid = async (approvalId, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'void',
    actionAt: new Date(),
  };
  const updateFilter = { approvalId, status: 'pending', active: 1 };
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: updateFilter,
  }, ['id', 'userId']);
  let voidUserIds = [];
  if (approvalUserMappings.length) {
    voidUserIds = approvalUserMappings.map(aum => aum.userId);
    const aumIds = approvalUserMappings.map(aum => aum.id);
    await approvalUserMappingController.updateById(updateValues, aumIds);
  }
  return voidUserIds;
};

const validateApproveOrReject = async (values, approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const currentApproval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'status', 'approvalTemplateItemDetails']);
  if (!currentApproval || currentApproval.status !== 'pending') {
    throw new ValidationError('Invalid action - Approval not in pending status');
  }
  if (currentApproval.approvalTemplateItemDetails && currentApproval.approvalTemplateItemDetails.commentRequired && values && (!values.reason || values.reason.trim() === '')) {
    throw new ValidationError('Invalid action - Comment is required');
  }
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const currentApprovalUserMapping = await approvalUserMappingController.findOneWithAttributes({
    where: {
      approvalId,
      userId: auth.userId,
      active: 1,
    },
  }, ['id', 'approvalId', 'userId', 'status']);
  if (!currentApprovalUserMapping || currentApprovalUserMapping.status !== 'pending') {
    throw new ValidationError('Invalid action - Logged in user is not current approver');
  }
};

const validateReject = async (values, approvalId, auth, isBulk = false) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const currentApproval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'status', 'approvalTemplateItemDetails']);
  if (!currentApproval || currentApproval.status !== 'pending') {
    throw new ValidationError('Invalid action - Approval not in pending status');
  }
  if (!isBulk && currentApproval.approvalTemplateItemDetails && currentApproval.approvalTemplateItemDetails.rejectionReasonRequired && values && (!values.reason || values.reason.trim() === '')) {
    throw new ValidationError('Invalid action - Comment is required');
  }
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const currentApprovalUserMapping = await approvalUserMappingController.findOneWithAttributes({
    where: {
      approvalId,
      userId: auth.userId,
      active: 1,
    },
  }, ['id', 'approvalId', 'userId', 'status']);
  if (!currentApprovalUserMapping || currentApprovalUserMapping.status !== 'pending') {
    throw new ValidationError('Invalid action - Logged in user is not current approver');
  }
};

const checkIfApproved = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'approvalTemplateItemDetails']);
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: {
      approvalId,
      active: 1,
    },
  }, ['id', 'status']);
  let approvalType = 'anyone';
  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.approvalType) {
    approvalType = approval.approvalTemplateItemDetails.approvalType;
  }
  const approvedAUMsCount = approvalUserMappings.filter(aum => aum.status === 'approved').length;
  const nonSkippedAUMs = approvalUserMappings.filter(aum => aum.status !== 'skipped').length;

  if (approvalType === 'anyone' && approvedAUMsCount) {
    return true;
  }
  if (approvalType === 'all' && approvedAUMsCount === nonSkippedAUMs) {
    return true;
  }
  if (approvalType === 'partial') {
    const { minimumApprovalCount } = approval.approvalTemplateItemDetails;
    if (approvedAUMsCount >= minimumApprovalCount || approvedAUMsCount === nonSkippedAUMs) {
      return true;
    }
  }
  return false;
};

const actionStatusMap = {
  approve: 'approved',
  update: 'updated',
  reject: 'rejected',
};

const updateAsApproved = async (approvalId, auth, action = 'approve') => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const updateValues = {
    status: actionStatusMap[action],
    actionAt: new Date(),
    actionById: auth.userId,
    isCurrentApprovalSequence: 0,
    currentApprovalUserIds: [],
  };
  await approvalController.updateById(updateValues, approvalId);
};

const updateAsRejected = async (values, approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'rejected',
    reason: values.reason,
    actionAt: new Date(),
    actionById: auth.userId,
  };
  await approvalController.updateById(updateValues, approvalId);
};

const findNextApproval = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'sequence', 'sequenceKey']);
  const nextApprovalFilter = {
    sequenceKey: approval.sequenceKey,
    sequence: approval.sequence + 1,
    active: 1,
  };
  const nextApproval = await approvalController.findOneWithAttributes({ where: nextApprovalFilter }, ['id', 'approvalTemplateItemDetails']);
  return nextApproval;
};

approvalService.checkAndUpdateCurrentApprovalUserIdsOnApproval = async (approvalId, isRejectedOrApprovedFlag = false, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  let approvalUserIds = [];
  if (!isRejectedOrApprovedFlag) {
    const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
    const approvalUsers = await approvalUserMappingController.findAllWithAttributes({
      where: {
        approvalId,
        active: 1,
        status: 'pending',
      },
    }, ['id', 'status', 'userId']);
    approvalUserIds = approvalUsers.map(app => app.userId);
  }
  await approvalController.update({
    currentApprovalUserIds: approvalUserIds,
  }, {
    where: {
      id: approvalId,
    },
  });
};

approvalService.validateAndApproveforSupplier = async (values, approvalId, auth, action = 'approve') => {
  const approvalController = new ApprovalController(auth.customerId);
  const approval = await approvalController.findOneByIdWithTemplateItem(approvalId);
  if (!approval.ATI.enableVendorApprovals) {
    throw new ValidationError('Invalid action - Approval not pending on Vendor');
  }
  await updateApprovalXUserMappingAsApproved(values, approvalId, auth);
  const isApproved = true;
  const retObj = { isApproved, voidUserIds: [] };
  if (isApproved) {
    await updateAsApproved(approvalId, auth, action);
    const nextApproval = await findNextApproval(approvalId, auth);
    if (nextApproval) {
      retObj.nextApprovalId = nextApproval.id;
      retObj.nextApproval = nextApproval;
    }
  }
  await approvalService.checkAndUpdateCurrentApprovalUserIdsOnApproval(approvalId, isApproved, auth);
  return retObj;
};

const updateAsRejectedSupplier = async (values, approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'rejected',
    reason: values.reason,
    actionAt: new Date(),
  };
  await approvalController.updateById(updateValues, approvalId);
};

approvalService.validateAndRejectforSupplier = async (values, approvalId, auth, action = 'reject') => {
  await updateApprovalXUserMappingAsRejected(values, approvalId, auth);
  const isRejected = true;
  const retObj = { isRejected, voidUserIds: [] };
  if (isRejected) {
    await updateAsRejectedSupplier(values, approvalId, auth);
  }
  await approvalService.checkAndUpdateCurrentApprovalUserIdsOnApproval(approvalId, isRejected, auth);
  return retObj;
};


approvalService.validateAndApprove = async (values, approvalId, auth, action = 'approve') => {
  await validateApproveOrReject(values, approvalId, auth);
  await updateApprovalUserMappingAsApproved(values, approvalId, auth);
  const isApproved = await checkIfApproved(approvalId, auth);
  const retObj = { isApproved, voidUserIds: [] };
  if (isApproved) {
    await updateAsApproved(approvalId, auth, action);
    retObj.voidUserIds = await updatePendingApprovalUserMappingsAsVoid(approvalId, auth);
    const nextApproval = await findNextApproval(approvalId, auth);
    if (nextApproval) {
      retObj.nextApprovalId = nextApproval.id;
      retObj.nextApproval = nextApproval;
    }
  }
  await approvalService.checkAndUpdateCurrentApprovalUserIdsOnApproval(approvalId, isApproved, auth);
  return retObj;
};

const checkIfRejected = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'approvalTemplateItemDetails']);
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: {
      approvalId,
      active: 1,
    },
  }, ['id', 'status', 'active']);
  let approvalType = 'anyone';
  let rejectionType = 'anyone';
  const rejectedAUMsCount = approvalUserMappings.filter(aum => aum.status === 'rejected' && aum.active === 1).length;

  if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.rejectionType) {
    rejectionType = approval.approvalTemplateItemDetails.rejectionType;
    if (rejectionType === 'anyone' && rejectedAUMsCount) {
      return true;
    }
    if (rejectionType === 'all' && rejectedAUMsCount === approvalUserMappings.length) {
      return true;
    }
    if (rejectionType === 'partial') {
      const { minimumRejectionCount } = approval.approvalTemplateItemDetails;
      if (rejectedAUMsCount >= minimumRejectionCount || rejectedAUMsCount === approvalUserMappings.length) {
        return true;
      }
    }
  } else if (approval.approvalTemplateItemDetails && approval.approvalTemplateItemDetails.approvalType) {
    approvalType = approval.approvalTemplateItemDetails.approvalType;
    if (['anyone', 'all'].includes(approvalType) && rejectionType === 'anyone' && rejectedAUMsCount) {
      return true;
    }
    if (approvalType === 'partial') {
      const { minimumApprovalCount } = approval.approvalTemplateItemDetails;
      if (approvalUserMappings.length - rejectedAUMsCount < minimumApprovalCount) {
        return true;
      }
    }
  }
  return false;
};

approvalService.validateAndReject = async (values, approvalId, auth) => {
  await validateReject(values, approvalId, auth);
  await updateApprovalUserMappingAsRejected(values, approvalId, auth);
  const isRejected = await checkIfRejected(approvalId, auth);
  if (isRejected) {
    await updateAsRejected(values, approvalId, auth);
    await updatePendingApprovalUserMappingsAsVoid(approvalId, auth);
  }
  await approvalService.checkAndUpdateCurrentApprovalUserIdsOnApproval(approvalId, isRejected, auth);
  return isRejected;
};

approvalService.getApprovalUserIds = async (approvalId, auth) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: {
      approvalId,
      active: 1,
    },
  }, ['id', 'userId']);
  return approvalUserMappings.map(aum => aum.userId);
};

approvalService.createCacheForApproval = async (options, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvals = await approvalController.findAllApprovalsForCache(options);
  let approvalCache = {};
  approvals.forEach(app => {
    approvalCache[app.id] = {};
    approvalCache[app.id].aums = [];
    approvalCache[app.id].approvalStatus = app.status;
    app.AUMs.forEach(aum => {
      approvalCache[app.id].aums.push({
        id: aum.id,
        userId: aum.User.id,
        userName: aum.User.name,
        status: aum.status,
      });
    });
  });
  return approvalCache;
}

const findNextApprovalBySequenceKey = async (sequenceKey, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const filter = {
    sequenceKey,
    active: 1,
    status: 'pending',
  };
  const approval = await approvalController.findOne({
    where: filter,
    attributes: ['id'],
    order: [['sequence', 'ASC']],
  });
  return approval;
};

const markAUMsAsInactiveByApprovalIds = async (approvalIds, auth) => {
  const updateValues = { active: 0 };
  const updateFilter = { approvalId: approvalIds, active: 1 };
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  await approvalUserMappingController.update(updateValues, { where: updateFilter });
};

const markAsInactiveByApprovalIds = async (approvalIds, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const updateValues = { active: 0 };
  const updateFilter = { id: approvalIds };
  await approvalController.update(updateValues, { where: updateFilter });
  await markAUMsAsInactiveByApprovalIds(approvalIds, auth);
};

const markActiveAsInactive = async (options, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const filter = {
    [options.transactionKey]: options.transactionId,
    active: 1,
  };
  const approvals = await approvalController.findAllWithAttributes(
    { where: filter },
    ['id'],
  );
  if (approvals.length) {
    const approvalIds = approvals.map(a => a.id);
    await markAsInactiveByApprovalIds(approvalIds, auth);
  }
};

const markPendingAsInactive = async (options, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const filter = {
    [options.transactionKey]: options.transactionId,
    active: 1,
    status: 'pending',
  };
  const approvals = await approvalController.findAllWithAttributes({ where: filter }, ['id']);
  if (approvals.length) {
    const approvalIds = approvals.map(a => a.id);
    await markAsInactiveByApprovalIds(approvalIds, auth);
  }
};

approvalService.clearForTransaction = async (options, auth) => {
  await markActiveAsInactive(options, auth);
};

approvalService.createForTransaction = async (records, options, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  let sequenceKey;
  let startSequence = 1;
  if (options.isApproverEdit) {
    const currentApproval = await approvalController.findOneByIdWithAttributes(options.currentApprovalId, ['id', 'sequenceKey', 'sequence']);
    sequenceKey = currentApproval.sequenceKey;
    startSequence = currentApproval.sequence;
    await markPendingAsInactive(options, auth);
  } else {
    sequenceKey = utils.useCustomNanoId();
    if (options.clearPrevious) {
      await markActiveAsInactive(options, auth);
    }
  }
  const allUserIdSet = new Set();
  records.forEach(record => {
    record.approvers.forEach(approver => {
      allUserIdSet.add(approver.userId);
    });
  });
  const userController = new UserController(auth.customerId, auth.transaction);
  // const userFilter = { id: [...allUserIdSet] };
  const users = await userController.findAllWithAttributes([...allUserIdSet], ['id', 'roleId']);
  const userIdToRoleIdMap = {};
  users.forEach(user => {
    userIdToRoleIdMap[user.id] = user.roleId;
  });
  const atiMap = {};
  if (options.isTemplated) {
    const atiController = new ApprovalTemplateItemController(auth.customerId, auth.transaction);
    const atiIds = records.map(record => record.approvalTemplateItemId);
    const atis = await atiController.findAllWithAttributes({
      where: {
        id: atiIds,
      },
    }, ['id', 'commentRequired', 'approvalType', 'rejectionReasonRequired', 'minimumApprovalCount', 'deadlineValue', 'enableTransactionEditing', 'rejectionType', 'minimumRejectionCount', 'enableNextSequenceApprovers', 'autoSelectApprovers']);
    atis.forEach(ati => {
      atiMap[ati.id] = ati;
    });
  }
  const aumRecords = [];
  const createRecords = records.map((record, index) => {
    const createRecord = {};
    const sequence = index + startSequence;
    createRecord.sequence = sequence;
    createRecord.sequenceKey = sequenceKey;
    createRecord.moduleName = options.moduleName;
    createRecord[options.transactionKey] = options.transactionId;
    const userIdSet = new Set();
    const roleIdSet = new Set();
    record.approvers.forEach(approver => {
      userIdSet.add(approver.userId);
      roleIdSet.add(userIdToRoleIdMap[approver.userId]);
      approver.approvalKey = `${sequenceKey}::${sequence}`;
      aumRecords.push(approver);
    });
    createRecord.userIds = [...userIdSet];
    createRecord.roleIds = [...roleIdSet];
    if (options.isTemplated) {
      const atiId = record.approvalTemplateItemId;
      createRecord.approvalTemplateItemId = atiId;
      createRecord.approvalTemplateItemDetails = {
        commentRequired: atiMap[atiId].commentRequired,
        rejectionReasonRequired: atiMap[atiId].rejectionReasonRequired,
        approvalType: atiMap[atiId].approvalType,
        minimumApprovalCount: atiMap[atiId].minimumApprovalCount,
        deadlineValue: atiMap[atiId].deadlineValue,
        enableTransactionEditing: atiMap[atiId].enableTransactionEditing,
        rejectionType: atiMap[atiId].rejectionType,
        minimumRejectionCount: atiMap[atiId].minimumRejectionCount,
        enableNextSequenceApprovers: atiMap[atiId].enableNextSequenceApprovers,
        autoSelectApprovers: atiMap[atiId].autoSelectApprovers,
      };
    } else {
      createRecord.approvalTemplateItemDetails = {
        commentRequired: 0,
        approvalType: 'anyone',
        rejectionReasonRequired: 1,
      };
    }
    return createRecord;
  });
  await approvalController.bulkCreate(createRecords);
  const approvalFilter = { sequenceKey, active: 1 };
  const approvals = await approvalController.findAllWithAttributes(
    { where: approvalFilter },
    ['id', 'sequenceKey', 'sequence'],
  );
  const approvalKeyToIdMap = {};
  approvals.forEach(approval => {
    approvalKeyToIdMap[`${approval.sequenceKey}::${approval.sequence}`] = approval.id;
  });
  aumRecords.forEach(aumRecord => {
    aumRecord.approvalId = approvalKeyToIdMap[aumRecord.approvalKey];
    delete aumRecord.approvalKey;
  });
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  await approvalUserMappingController.bulkCreate(aumRecords);
  const nextApproval = await findNextApprovalBySequenceKey(sequenceKey, auth);
  if (nextApproval) {
    await updateAsCurrentApproval(nextApproval.id, options, auth);
  }
  return { currentApprovalId: nextApproval ? nextApproval.id : null };
};

approvalService.getApprovalRoleIds = async (approvalId, auth) => {
  const userIds = await approvalService.getApprovalUserIds(approvalId, auth);
  const userController = new UserController(auth.customerId, auth.transaction);
  const users = await userController.findAllWithAttributes(userIds, ['id', 'roleId']);
  const roleIds = users.map(user => user.roleId);
  return [...new Set(roleIds)];
};

approvalService.getApproversForTransactionLog = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  let pendingActionUserIds = [];
  if (approvalId) {
    const currentApproval = await approvalController.findOneWithAUMsForTransactionLog(approvalId);
    if (currentApproval) {
      if (currentApproval.AUMs && currentApproval.AUMs.length) {
        pendingActionUserIds = currentApproval.AUMs.map(aum => aum.userId);
      } else if (currentApproval.approvers && currentApproval.approvers.length) {
        pendingActionUserIds = currentApproval.approvers.map(aum => aum.userId);
      }
    }
  }
  return pendingActionUserIds;
};

const validateRevert = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const currentApproval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'status', 'approvalTemplateItemDetails', 'sequence']);
  if (!currentApproval || currentApproval.status !== 'pending') {
    throw new ValidationError('Invalid action - Approval not in pending status');
  }
  if (currentApproval.sequence === 1) {
    throw new ValidationError('Invalid action - No Previous Approval present');
  }
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const currentApprovalUserMapping = await approvalUserMappingController.findOneWithAttributes({
    where: {
      approvalId,
      userId: auth.userId,
      active: 1,
    },
  }, ['id', 'approvalId', 'userId', 'status']);
  if (!currentApprovalUserMapping || currentApprovalUserMapping.status !== 'pending') {
    throw new ValidationError('Invalid action - Logged in user is not current approver');
  }
};

const findPreviousApproval = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approval = await approvalController.findOneByIdWithAttributes(approvalId, ['id', 'sequence', 'sequenceKey']);
  const previousApprovalFilter = {
    sequenceKey: approval.sequenceKey,
    sequence: approval.sequence - 1,
    active: 1,
  };
  const previousApproval = await approvalController.findOneForRevert(previousApprovalFilter);
  return previousApproval;
};

const revertApprovalStatus = async (approvalId, isCurrentApproval= false, auth) => {
  const approvalController = new ApprovalController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const updateValues = {
    status: 'pending',
    actionAt: null,
    actionById: null,
    isCurrentApprovalSequence: 1,
    currentApprovalUserIds: [],
  };
  const aumUpdateValues = {
    status: 'pending',
    actionAt: null,
  };
  const updateFilter = { approvalId, active: 1};
  if (!isCurrentApproval) {
    updateFilter.status = {
      [Op.notIn]: ['skipped'],
    }
  }
  const approvalUserMappings = await approvalUserMappingController.findAllWithAttributes({
    where: updateFilter,
  }, ['id', 'userId']);
  if (approvalUserMappings.length) {
    const aumIds = approvalUserMappings.map(aum => aum.id);
    updateValues.currentApprovalUserIds = approvalUserMappings.map(aum => aum.userId);
    await approvalUserMappingController.updateById(aumUpdateValues, aumIds);
  }
  await approvalController.updateById(updateValues, approvalId);
};

approvalService.revertApproval = async (approvalId, auth) => {
  await validateRevert(approvalId, auth);
  await revertApprovalStatus(approvalId, true, auth);
  const previousApproval = await findPreviousApproval(approvalId, auth);
  await revertApprovalStatus(previousApproval.id, false, auth);
  return previousApproval;
};

approvalService.getStatusTextFromApprovalId = async (approvalId, auth) => {
  const approvalController = new ApprovalController(auth.customerId);
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
  const { approvalTemplateItemId } = await approvalController.findOneByIdWithAttributes(approvalId, ['approvalTemplateItemId']);
  const { statusText } = await approvalTemplateItemController.findOneByIdWithAttributes(approvalTemplateItemId, ['statusText']);
  return statusText;
};

export default approvalService;
