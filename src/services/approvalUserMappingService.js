import utils from '../helpers/utils.js';
import _get from 'lodash/get.js';
import ApprovalUserMappingController from '../controllers/approvalUserMappingController.js';
// import MailReminderController from '../controllers/mailReminderController';

const approvalUserMappingService = {};

approvalUserMappingService.bulkCreateForApproval = (records, approvalId, auth, startTime) => {
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const approvalMappings = records.map((record) => {
    const apm = utils.copyKeys(record, ['userId', 'delegatedByUserId']);
    apm.approvalStartTime = startTime ? new Date() : null;
    apm.approvalId = approvalId;
    return apm;
  });
  return approvalUserMappingController.bulkCreate(approvalMappings);
};

function countWeekendDays(d0, d1) {
  const ndays = 1 + Math.round((d1.getTime() - d0.getTime()) / (24 * 3600 * 1000));
  const nsaturdays = Math.floor((d0.getDay() + ndays) / 7);
  let nWeekends = 2 * nsaturdays + (d0.getDay() === 0) - (d1.getDay() === 6);
  if (nWeekends % 2) {
    nWeekends += 1;
  }
  return nWeekends;
}

approvalUserMappingService.bulkCreateApprovalReminders = async (approvalTemplateItemObj, approvalUserMappingIds, module, auth) => {
  // const mailReminderController = new MailReminderController(auth.customerId, auth.transaction);
  const approvalUserMappingController = new ApprovalUserMappingController(auth.customerId, auth.transaction);
  const recordsToCreate = [];
  const deadLineReminderTime = new Date();
  if (approvalTemplateItemObj.deadlineType === 'hours') {
    deadLineReminderTime.setHours(deadLineReminderTime.getHours() + approvalTemplateItemObj.deadlineValue);
  } else {
    const numberOfHoursWithDays = (approvalTemplateItemObj.deadlineValue || 0) * 24;
    deadLineReminderTime.setHours(deadLineReminderTime.getHours() + numberOfHoursWithDays);
  }
  const currentDate = new Date();
  const numberOfWeekends = countWeekendDays(currentDate, deadLineReminderTime);
  if (numberOfWeekends > 0) {
    deadLineReminderTime.setHours(deadLineReminderTime.getHours() + (numberOfWeekends * 24));
  }

  const aumId = approvalUserMappingIds[0];
  const requiredAUM = await approvalUserMappingController.findOneByIdWithAttributes({ aumId, attributes: ['approvalId'] });
  const approvalId = _get(requiredAUM, 'approvalId');
  if (approvalId) {
    recordsToCreate.push({
      approvalId,
      approvalUserMappingId: aumId,
      approvalTemplateItemId: approvalTemplateItemObj.id || null,
      cutOffTime: deadLineReminderTime,
      module,
      reminderType: 'deadline',
    });
  }

  approvalTemplateItemObj.ATIRs.forEach(atir => {
    let reminderType;
    const cutOffTime = new Date();
    if (atir.mailType === 'escalation') {
      reminderType = 'escalation';
    } else {
      reminderType = atir.reminderType === 'before' ? 'before-deadline' : 'after-deadline';
    }

    if (approvalTemplateItemObj.deadlineType === 'hours') {
      const atriValueInHours = atir.alertTimeType === 'hours' ? atir.value : atir.value * 24;
      if (atir.reminderType === 'before') {
        cutOffTime.setHours(cutOffTime.getHours() + approvalTemplateItemObj.deadlineValue - atriValueInHours);
      } else {
        cutOffTime.setHours(cutOffTime.getHours() + approvalTemplateItemObj.deadlineValue + atriValueInHours);
      }
    } else {
      const numberOfHoursWithDays = (approvalTemplateItemObj.deadlineValue || 0) * 24;
      const atriValueInHours = atir.alertTimeType === 'hours' ? atir.value : atir.value * 24;
      if (atir.reminderType === 'before') {
        cutOffTime.setHours(cutOffTime.getHours() + numberOfHoursWithDays - atriValueInHours);
      } else {
        cutOffTime.setHours(cutOffTime.getHours() + numberOfHoursWithDays + atriValueInHours);
      }
    }
    const numberOfWeekendsInATIR = countWeekendDays(currentDate, cutOffTime);

    if (numberOfWeekendsInATIR > 0) {
      cutOffTime.setHours(deadLineReminderTime.getHours() + (numberOfWeekendsInATIR * 24));
    }

    if (approvalId) {
      recordsToCreate.push({
        approvalId,
        approvalUserMappingId: aumId,
        approvalTemplateItemId: approvalTemplateItemObj.id,
        cutOffTime,
        module,
        reminderType,
        enableManagerReminder: atir.enableManagerReminder,
        roleIds: atir.roleIds || [],
        roleIdsInCC: atir.approvalCCEmails || [],
      });
    } else {
      recordsToCreate.push({
        approvalUserMappingId: aumId,
        supplierTicketGroupId: approvalTemplateItemObj.id, // using same obj name -- has to be renamed once approvalReminder DB table name is changed
        supplierTicketId: approvalTemplateItemObj.supplierTicketId, // using same obj name -- has to be renamed once approvalReminder DB table name is changed
        cutOffTime,
        module,
        reminderType,
        enableManagerReminder: atir.enableManagerReminder,
        roleIds: atir.roleIds || [],
      });
    }
  });

  // if (recordsToCreate.length) {
  //   await mailReminderController.bulkCreate(recordsToCreate);
  // }
};

export default approvalUserMappingService;
