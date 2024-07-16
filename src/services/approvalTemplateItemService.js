import * as BBPromise from 'bluebird';
import _set from 'lodash/set.js';

import utils from '../helpers/utils.js';

import ApprovalTemplateItemController from '../controllers/approvalTemplateItemController.js';
import ApprovalTemplateItemReminderController from '../controllers/approvalTemplateItemReminderController.js';
import ApprovalTemplateController from '../controllers/approvalTemplateController.js';

const approvalTemplateItemService = {};

approvalTemplateItemService.updateForApprovalTemplate = async (approvalTemplateItems, approvalTemplateId, auth) => {
  const approvalTemplateItemController = new ApprovalTemplateItemController(auth.customerId);
  const approvalTemplateItemReminderController = new ApprovalTemplateItemReminderController(auth.customerId);
  const atiRecordsToCreate = [];
  const atiIdsToDelete = [];
  const atiRecordsToUpdate = [];
  const atiReminderIdRecordsToMakeInactive = [];
  approvalTemplateItems.forEach((ati) => {
    if (ati.id) {
      if (ati.method === 'UPDATE') {
        const atiRecord = {
          id: ati.id,
          values: utils.copyKeys(ati, ['sno', 'roleIds', 'maximumValue', 'minimumValue', 'moduleActionAttributes',
            'enableDeliveryAddressFilter', 'enableCostCentreFilter', 'enableLedgerFilter', 'enableDepartmentFilter',
            'enableValueFilter', 'enableIntegrationErrorFilter', 'deadlineType', 'deadlineValue', 'approvalType', 'minimumApprovalCount',
            'commentRequired', 'rejectionReasonRequired', 'name', 'enableTransactionEditing', 'reminderSettingType', 'moveTonextApproval', 'reassignRoleId', 'enableForeignVendorFilter',
            'enableExceptionFilter', 'enableTransactionHold', 'enableBillingAddressFilter', 'transactionFilterRules', 'enableManagerLevelApproval', 'enableManagerLevelApprovalHierarchy', 'rejectionType', 'minimumRejectionCount',
            'enableSupplierCategoryFilter', 'enableInternalUpdate', 'enableCreatorLevelApproval', 'enableRejectBtn', 'approveText', 'statusText', 'enableDimensionOneFilter', 'enableDimensionTwoFilter', 'enableDimensionThreeFilter',
            'enableProductCategoryFilter', 'enableRevert', 'enableNextSequenceApprovers', 'autoSelectApprovers', 'reassignApprovalSettings', 'enableVendorApprovals', 'enableSubTotalFilter']),
          approvalTemplateItemReminders: ati.approvalTemplateItemReminders,
        };
        if (!atiRecord.name) {
          atiRecord.name = `Approver Sequence ${atiRecord.sno}`;
        }
        atiRecordsToUpdate.push(atiRecord);
        atiReminderIdRecordsToMakeInactive.push(ati.id);
      } else if (ati.method === 'DELETE') {
        atiIdsToDelete.push(ati.id);
      }
      atiReminderIdRecordsToMakeInactive.push(ati.id);
    } else {
      const atiRecord = utils.copyKeys(ati, ['sno', 'roleIds', 'maximumValue', 'minimumValue', 'moduleActionAttributes',
        'enableDeliveryAddressFilter', 'enableCostCentreFilter', 'enableLedgerFilter', 'enableDepartmentFilter',
        'enableValueFilter', 'enableIntegrationErrorFilter', 'deadlineType', 'deadlineValue', 'approvalType', 'approvalTemplateItemReminders',
        'minimumApprovalCount', 'commentRequired', 'rejectionReasonRequired', 'name', 'enableTransactionEditing', 'reminderSettingType', 'moveTonextApproval', 'reassignRoleId', 'enableForeignVendorFilter',
        'enableExceptionFilter', 'enableTransactionHold', 'enableBillingAddressFilter', 'transactionFilterRules', 'enableManagerLevelApproval', 'enableManagerLevelApprovalHierarchy', 'rejectionType', 'minimumRejectionCount',
        'enableSupplierCategoryFilter', 'enableInternalUpdate', 'enableCreatorLevelApproval', 'enableRejectBtn', 'approveText', 'statusText', 'enableDimensionOneFilter', 'enableDimensionTwoFilter', 'enableDimensionThreeFilter',
        'enableProductCategoryFilter', 'enableRevert', 'enableNextSequenceApprovers', 'autoSelectApprovers', 'reassignApprovalSettings']);
      if (!atiRecord.name) {
        atiRecord.name = `Approver Sequence ${atiRecord.sno}`;
      }
      atiRecordsToCreate.push(atiRecord);
    }
  });
  if (atiIdsToDelete.length) {
    await approvalTemplateItemController.bulkMarkInactiveById(atiIdsToDelete);
  }
  if (atiReminderIdRecordsToMakeInactive.length) {
    await approvalTemplateItemReminderController.bulkMarkInactiveByATIId(atiReminderIdRecordsToMakeInactive);
  }
  const atiReminderRecordsToCreate = [];
  await BBPromise.mapSeries(atiRecordsToUpdate, async (record) => {
    await approvalTemplateItemController.updateById(record.values, record.id);
    (record.approvalTemplateItemReminders).forEach((atir) => {
      const atirRecord = utils.copyKeys(atir, ['value', 'type', 'reminderType', 'alertTimeType', 'mailType', 'roleIds', 'enableManagerReminder', 'approvalCCEmails']);
      atirRecord.approvalTemplateItemId = record.id;
      atiReminderRecordsToCreate.push(atirRecord);
    });
  });
  const approvalTemplateController = new ApprovalTemplateController(auth.customerId);
  const approvalTemplate = await approvalTemplateController.findOneWithAllATIsForCount(approvalTemplateId);
  const currentCount = approvalTemplate.ATIs.length;
  atiRecordsToCreate.forEach((record, index) => {
    _set(record, 'sno', currentCount + index + 1);
    _set(record, 'approvalTemplateId', approvalTemplateId);
  });
  await BBPromise.mapSeries(atiRecordsToCreate, async (record) => {
    const atiRecord = await approvalTemplateItemController.create(record);
    (record.approvalTemplateItemReminders).forEach((atir) => {
      const atirRecord = utils.copyKeys(atir, ['value', 'type', 'reminderType', 'alertTimeType', 'mailType', 'roleIds', 'enableManagerReminder', 'approvalCCEmails']);
      atirRecord.approvalTemplateItemId = atiRecord.id;
      atiReminderRecordsToCreate.push(atirRecord);
    });
  });
  if (atiReminderRecordsToCreate.length) {
    await approvalTemplateItemReminderController.bulkCreate(atiReminderRecordsToCreate);
  }
};

export default approvalTemplateItemService;
