/* eslint-disable @typescript-eslint/no-explicit-any */
// import { mapSeries } from 'bluebird';
import pkg from 'joi';
import uuid4 from 'uuid4';
import utils from '../helpers/utils.js';
import FieldController from '../controllers/fieldController.js';
import CustomModuleController from '../controllers/customModuleController.js';
import ModuleAccessController from '../controllers/moduleAccessController.js';
import SectionController from '../controllers/sectionController.js';
// import SectionController from '../controllers/sectionController';
import { ValidationError } from '../helpers/customError.js';
// import fieldHelper from '../helpers/fieldsHelper';
// import transactionTemplateService from './transactionTemplateService';

// const Joi = require('joi');

const { Joi } = pkg;
const customModuleService = {};

customModuleService.findAllForListing = async (options, auth) => {
  const customModuleController = new CustomModuleController(auth.customerId);
  const customModule = await customModuleController.findAllForListing(options);
  return {
    data: customModule,
  };
};

customModuleService.findOneByIdForView = async (cmId, options, auth) => {
  const customModuleController = new CustomModuleController(auth.customerId);
  const customModule = await customModuleController.findOneByIdForView(cmId, options);
  return customModule;
};

// customModuleService.validateFieldData = async (fields: any): Promise<any> => {
//   fields.forEach((field: any) => {
//     if (field.label.trim() === '') {
//       throw new ValidationError('Field name cannot be empty');
//     }
//     if (!field.sno || !utils.isNumeric(field.sno)) {
//       throw new ValidationError('Field sno should be number');
//     }
//     fieldHelper.validate(field);
//   });
// };

// const validateFieldValueInput = async (values: any, auth: any): Promise<any> => {
//   if (values.label.trim() === '') {
//     throw new ValidationError('Field name cannot be empty');
//   }
//   const labelSlug = utils.slugify(values.label);
//   // Get all fields based on transactions
//   const fieldController = new FieldController(auth.customerId);
//   const options = {
//     transactionType: values.transactionType ? values.transactionType : null,
//   };
//   const fields = await fieldController.findAllFieldsBasedOnVisibility(options);
//   // Check if newly created field already exists
//   if (values.sectionType === 'general-master') {
//     const generalFieldSlugArray = fields.filter((item: any) => item.Section.type === 'general-master').map((field: any) => field.slug);
//     if (generalFieldSlugArray.includes(labelSlug)) {
//       throw new ValidationError('Invalid action - Field with same name already exists');
//     }
//   }
//   if (values.sectionType === 'line-item-master') {
//     const lineItemFieldSlugArray = fields.filter((item: any) => item.Section.type === 'line-item-master').map((field: any) => field.slug);
//     if (lineItemFieldSlugArray.includes(labelSlug)) {
//       throw new ValidationError('Invalid action - Field with same name already exists');
//     }
//   }
// };

// customModuleService.updateActiveStatus = async (fieldId: number, values: any, auth: any): Promise<any> => {
//   const fieldController = new FieldController(auth.customerId);
//   await fieldController.updateById({ active: values.activeStatus }, fieldId);
//   return customModuleService.findOneMasterByIdForView(fieldId, auth);
// };

customModuleService.validateFieldValues = async (fields, values) => {
  const joiTypeFieldTypeMap = {
    string: Joi.string(),
    number: Joi.number(),
    text: Joi.string(),
    'text-without-special-character': Joi.string(),
    'long-text': Joi.string(),
    richText: Joi.string(),
    radio: Joi.alternatives().try(Joi.string(), Joi.number()),
    email: Joi.string().email(),
    date: Joi.date(),
    'date-range': Joi.array().length(2).items(Joi.date()),
    'company-select': Joi.number().strict(),
    'delivery-address-select': Joi.number().strict(),
    'cost-centre-select': Joi.number().strict(),
    'ledger-select': Joi.number().strict(),
    'department-select': Joi.number().strict(),
    'dimension-one-select': Joi.number().strict(),
    'dimension-two-select': Joi.number().strict(),
    'dimension-three-select': Joi.number().strict(),
    'billing-address-select': Joi.number().strict(),
    'category-select': Joi.number().strict(),
    'supplier-multi-select': Joi.array(),
    'budget-item-select': Joi.number().strict(),
    'payment-terms-select': Joi.any(),
    'item-type-select': Joi.string(),
    'user-select': Joi.number().strict(),
    attachments: Joi.array().items(
      Joi.object({
        key: Joi.string(),
        name: Joi.string(),
        path: Joi.string(),
        type: Joi.string(),
        size: Joi.number().strict(),
        isUploaded: Joi.boolean(),
        isUploadFailed: Joi.boolean(),
        customId: Joi.string(),
        fileObj: Joi.any(),
      }),
    ),
    product: Joi.number().strict(),
    'uom-select': Joi.number().strict(),
    price: Joi.number(),
    formulae: Joi.alternatives().try(Joi.string(), Joi.number()),
    'currency-multi-select': Joi.array(),
    'currency-select': Joi.number().strict(),
    select: Joi.string(),
    'single-select': Joi.string(),
    'multi-select': Joi.array(),
    'phone-number': Joi.string(),
    'supplier-select': Joi.number().strict(),
    'terms-and-conditions-select': Joi.number().strict(),
    'delivery-address-multi-select': Joi.array(),
    taxes: Joi.array(),
    button: Joi.any(),
    headerColumnColor: Joi.string(),
    'pro-forma-select': Joi.number().strict(),
    percentage: Joi.string(),
    'po-map-select': Joi.number().strict(),
  };
  const schemaKeys = {};
  fields.forEach(field => {
    schemaKeys[field.key] = field.mandatory
      ? joiTypeFieldTypeMap[field.type].required()
      : joiTypeFieldTypeMap[field.type].allow('', null);
  });
  const joiSchema = Joi.object(schemaKeys);
  const validate = joiSchema.validate(values, { abortEarly: false });
  if (validate.error) {
    const validations = validate.error.details
      .map(d => d.message)
      .toLocaleString();
    throw new ValidationError(validations);
  }
  console.log('Finish validateFieldValues!!!');
};

customModuleService.create = async (values, auth) => {
  console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeevalues', values);

  // await validateFieldValueInput(values, auth);
  const customModuleController = new CustomModuleController(auth.customerId);
  const moduleAccessController = new ModuleAccessController(auth.customerId);

  const fieldController = new FieldController(auth.customerId);
  const sectionController = new SectionController(auth.customerId);

  const newModuleValues = utils.copyKeys(values, [
    'key',
    'name',
    'reference',
    'slug',
    'hasRoleAccess',
    'hasUserAccess',
    // 'sections',
  ]);
  newModuleValues.slug = utils.slugify(values.name);
  newModuleValues.userId = auth.userId;
  newModuleValues.customerId = auth.customerId;
  newModuleValues.key = uuid4();
  console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeee', newModuleValues);
  const customModule = await customModuleController.create(newModuleValues);
  if (!customModule) {
    throw new ValidationError();
  }

  if (newModuleValues.hasRoleAccess) {
    const newModuleAccessValues = [...values.roleIds].map(mac => ({
      // ...mac,
      roleId: mac,
      customModuleId: customModule.id,
      isCustomModule: true,
      customerId: auth.customerId,
    }));

    const moduleAccess = await moduleAccessController.bulkCreate(
      newModuleAccessValues,
    );
    if (!moduleAccess) {
      throw new ValidationError();
    }
  } else if (newModuleValues.hasUserAccess) {
    const newModuleAccessValues = [...values.userIds].map(mac => ({
      // ...mac,
      userId: mac,
      customModuleId: customModule.id,
      isCustomModule: true,
      customerId: auth.customerId,
    }));

    const moduleAccess = await moduleAccessController.bulkCreate(
      newModuleAccessValues,
    );
    if (!moduleAccess) {
      throw new ValidationError();
    }
  }

  const newSectionValues = [...values.sections].map(sec => ({
    ...sec,
    customModuleId: customModule.id,
    slug: utils.slugify(sec.sectionName),
    key: uuid4(),
  }));

  if (!newSectionValues && !newSectionValues.length) {
    throw new ValidationError();
  }
  const section = await sectionController.bulkCreate(newSectionValues);
  const sectionMap = {};
  section?.forEach(({ sectionKey, id }) => {
    if (sectionKey && id) {
      if (!sectionMap[sectionKey]) {
        sectionMap[sectionKey] = null;
      }
      sectionMap[sectionKey] = id;
    }
  });
  const newFieldValues = [...values.fields].map(fv => ({
    ...fv,
    label: fv.name,
    sectionId: sectionMap[fv.sectionKey],
    moduleType: 'customModule',
    key: uuid4(),
  }));

  if (!newFieldValues && !newFieldValues.length) {
    throw new ValidationError();
  }
  const field = await fieldController.bulkCreate(newFieldValues);

  return customModule;
};

// customModuleService.updateById = async (fieldId: number, values: any, auth: any): Promise<any> => {
//   // validateFieldValueInput(values, auth);
//   const fieldController = new FieldController(auth.customerId);
//   const field = await fieldController.findOneById(fieldId);
//   const updateValues: any = utils.copyKeys(values, ['label', 'fieldType', 'fieldOptionItems',
//     'fieldInputType', 'mandatory', 'sourceType',
//     'sno', 'isOrgLevel', 'transactionType', 'weightagePercentage', 'active',
//     'fieldKey', 'userDefinedFieldKey', 'visibleToSupplier',
//     'defaultValue', 'visibleInListing', 'visibleInDocument', 'isSearchable', 'sectionId',
//     'visibleInTransaction', 'helpText', 'visibleInReport', 'formulae', 'toBeFilledBySupplier',
//     'feedbackSettings', 'isAggregate', 'type', 'key', 'validation', 'isSystemField', 'options', 'size', 'wrapText', 'isCalculated', 'headerColumnColor']);
//   if (values.transactionType === 'requisition') {
//     updateValues.inputBy = ['customer'];
//   }
//   updateValues.slug = utils.slugify(values.label);
//   await fieldController.updateById(updateValues, fieldId);
//   const updateValuesOfChild = utils.copyKeys(values, ['label', 'fieldType', 'fieldOptionItems',
//     'fieldInputType', 'sourceType', 'active', 'helpText', 'type', 'formulae', 'isCalculated']);
//   if (values.sourceType === 'aerchain-custom') {
//     // Updating for other master fields for all transactions
//     const transactionFields = await fieldController.findAllActiveChildFieldFromAllTransactions(fieldId);
//     const transactionFieldsToUpdate = transactionFields.map((tf: any) => ({
//       id: tf.id,
//       values: updateValuesOfChild,
//     }));
//     if (transactionFieldsToUpdate.length) {
//       await mapSeries(transactionFieldsToUpdate, async (record: any) => {
//         await fieldController.updateById(record.values, record.id);
//       });
//     }
//   }
//   // For Template version creation
//   await transactionTemplateService.creatingDuplicateTemplatesForField({ type: values.type }, fieldId,
//     auth, updateValuesOfChild);
//   return customModuleService.findOneMasterByIdForView(field.id, auth);
// };

// customModuleService.createBulkFieldsForSection = async (fields: any, transactionType: string, sectionId: number, auth: any): Promise<any> => {
//   const fieldController = new FieldController(auth.customerId);
//   const sectionController = new SectionController(auth.customerId);
//   const section = await sectionController.findOneWithAttributes({ where: { id: sectionId } }, ['id', 'label']);
//   const size = section.label === 'Line Item Section' ? 150 : 1;
//   const bulkFields: any = [];

//   fields.forEach((field: any) => {
//     if (field.label.trim() === '') {
//       throw new ValidationError('Field name cannot be empty');
//     }
//   });

//   fields.forEach((field: any) => {
//     const fieldValues: any = utils.copyKeys(field, ['label', 'fieldType', 'fieldOptionItems',
//       'fieldInputType', 'mandatory', 'sourceType',
//       'sno', 'isOrgLevel', 'active',
//       'fieldKey', 'userDefinedFieldKey', 'visibleToSupplier',
//       'defaultValue', 'visibleInListing', 'visibleInDocument',
//       'isSearchable', 'parentFieldId', 'visibleInTransaction', 'helpText',
//       'visibleInReport', 'property', 'toBeFilledBySupplier', 'formulae', 'feedbackSettings', 'isAggregate', 'type',
//       'key', 'validation', 'isSystemField', 'options', 'wrapText', 'inputBy', 'isCalculated', 'headerColumnColor']);
//     fieldValues.labelSlug = `cf_${utils.getSlugifyLabel(field.label)}`;
//     fieldValues.transactionType = transactionType;
//     fieldValues.size = field.size || size;
//     if (transactionType === 'requisition') {
//       // fieldValues.inputBy = ['customer'];
//       fieldValues.userDefinedFieldKey = uuid4();
//     }
//     fieldValues.sectionId = sectionId;
//     bulkFields.push(fieldValues);
//   });
//   return fieldController.bulkCreate(bulkFields);
// };

// customModuleService.bulkCreate = async (fields: any, transactionType: string, identifier: string, auth: any): Promise<any> => {
//   const fieldController = new FieldController(auth.customerId, auth.transaction);
//   const bulkFields: any = [];
//   fields.forEach((field: any) => {
//     if (field.label.trim() === '') {
//       throw new ValidationError('Field name cannot be empty');
//     }
//   });

//   fields.forEach((field: any) => {
//     const fieldValues: any = utils.copyKeys(field, ['label', 'mandatory', 'sno', 'active',
//       'visibleToSupplier', 'formulae', 'key', 'inputBy', 'type', 'options', 'category',
//       'validation', 'isSystemField', 'userDefinedFieldKey', 'size', 'evaluationId', 'feedbackSettings',
//       'isAggregate', 'worksheetId', 'questionnnaireId', 'wrapText', 'quoteScenarioId', 'isCalculated', 'headerColumnColor']);
//     fieldValues.labelSlug = `cf_${utils.getSlugifyLabel(field.label)}`;
//     fieldValues.transactionType = transactionType;
//     fieldValues.identifier = identifier;
//     bulkFields.push(fieldValues);
//   });
//   return fieldController.bulkCreate(bulkFields);
// };

// customModuleService.markActiveById = async (fieldId: number, auth: any): Promise<any> => {
//   const fieldController = new FieldController(auth.customerId);
//   await fieldController.updateById({ active: 1 }, fieldId);
//   return customModuleService.findOneMasterByIdForView(fieldId, auth);
// };

// customModuleService.markInActiveById = async (values: any, fieldId: number, auth: any): Promise<any> => {
//   const fieldController = new FieldController(auth.customerId);
//   await fieldController.updateById({ active: 0 }, fieldId);
//   // to make all fields related to field inactive
//   const fields = await fieldController.findAllActiveChildFieldFromAllTransactions(fieldId);
//   const fieldIds = fields.map((field: any) => field.id);
//   if (fieldIds && fieldIds.length) {
//     await fieldController.update({
//       active: 0,
//     }, {
//       where: {
//         id: fieldIds,
//       },
//     });
//   }
//   await transactionTemplateService.creatingDuplicateTemplatesForField(values, fieldId, auth);
//   return customModuleService.findOneMasterByIdForView(fieldId, auth);
// };

// customModuleService.validateFields = async (fields: any): Promise<any> => {
//   const schema = Joi.object({
//     label: Joi.string().required(),
//     key: Joi.string().required(),
//     type: Joi.string().required(),
//     options: Joi.any(),
//     validation: Joi.any(),
//     defaultValue: Joi.any(),
//     helpText: Joi.string().allow(''),
//     inputBy: Joi.array().items(Joi.string()),
//     isSystemField: Joi.number().required(),
//     mandatory: Joi.number().required(),
//     visibleToSupplier: Joi.number().valid(0, 1),
//     formulae: Joi.string().allow('', null),
//     sno: Joi.number().allow(null),
//     userDefinedFieldKey: Joi.string().allow(null),
//     size: Joi.number().required(),
//     isAggregate: Joi.number().valid(0, 1),
//     feedbackSettings: Joi.array().items(Joi.object({
//       key: Joi.string(),
//       color: Joi.string(),
//       condition: Joi.string(),
//     })),
//     pinned: Joi.string().allow('', null),
//     newLine: Joi.number().valid(0, 1),
//     method: Joi.any(),
//     labelSlug: Joi.string(),
//     isCalculated: Joi.number().valid(0, 1),
//     warningText: Joi.string().allow(null),
//   });

//   fields.forEach((field: any) => {
//     const validate = schema.validate(field, { abortEarly: false });
//     if (validate.error) {
//       const validations = validate.error.details.map(d => d.message).toLocaleString();
//       throw new ValidationError(validations);
//     }
//   });
//   console.log('Finish validateFields!!!');
// };

// customModuleService.validateFieldValues = async (fields: any, values: any): Promise<any> => {
//   const joiTypeFieldTypeMap = {
//     string: Joi.string(),
//     number: Joi.number(),
//     text: Joi.string(),
//     'text-without-special-character': Joi.string(),
//     'long-text': Joi.string(),
//     richText: Joi.string(),
//     radio: Joi.alternatives().try(Joi.string(), Joi.number()),
//     email: Joi.string().email(),
//     date: Joi.date(),
//     'date-range': Joi.array().length(2).items(Joi.date()),
//     'company-select': Joi.number().strict(),
//     'delivery-address-select': Joi.number().strict(),
//     'cost-centre-select': Joi.number().strict(),
//     'ledger-select': Joi.number().strict(),
//     'department-select': Joi.number().strict(),
//     'dimension-one-select': Joi.number().strict(),
//     'dimension-two-select': Joi.number().strict(),
//     'dimension-three-select': Joi.number().strict(),
//     'billing-address-select': Joi.number().strict(),
//     'category-select': Joi.number().strict(),
//     'supplier-multi-select': Joi.array(),
//     'budget-item-select': Joi.number().strict(),
//     'payment-terms-select': Joi.any(),
//     'item-type-select': Joi.string(),
//     'user-select': Joi.number().strict(),
//     attachments: Joi.array().items(Joi.object({
//       key: Joi.string(),
//       name: Joi.string(),
//       path: Joi.string(),
//       type: Joi.string(),
//       size: Joi.number().strict(),
//       isUploaded: Joi.boolean(),
//       isUploadFailed: Joi.boolean(),
//       customId: Joi.string(),
//       fileObj: Joi.any(),
//     })),
//     product: Joi.number().strict(),
//     'uom-select': Joi.number().strict(),
//     price: Joi.number(),
//     formulae: Joi.alternatives().try(Joi.string(), Joi.number()),
//     'currency-multi-select': Joi.array(),
//     'currency-select': Joi.number().strict(),
//     select: Joi.string(),
//     'single-select': Joi.string(),
//     'multi-select': Joi.array(),
//     'phone-number': Joi.string(),
//     'supplier-select': Joi.number().strict(),
//     'terms-and-conditions-select': Joi.number().strict(),
//     'delivery-address-multi-select': Joi.array(),
//     taxes: Joi.array(),
//     button: Joi.any(),
//     headerColumnColor: Joi.string(),
//     'pro-forma-select': Joi.number().strict(),
//     percentage: Joi.string(),
//   };
//   const schemaKeys = {};
//   fields.forEach((field: any) => {
//     schemaKeys[field.key] = field.mandatory ? joiTypeFieldTypeMap[field.type].required() : joiTypeFieldTypeMap[field.type].allow('', null);
//   });
//   const joiSchema = Joi.object(schemaKeys);
//   const validate = joiSchema.validate(values, { abortEarly: false });
//   if (validate.error) {
//     const validations = validate.error.details.map(d => d.message).toLocaleString();
//     throw new ValidationError(validations);
//   }
//   console.log('Finish validateFieldValues!!!');
// };

// customModuleService.createForTransaction = async (records: any, options: any, auth: any): Promise<any> => {
//   const createRecords = records.map(record => {
//     const createRecord = utils.copyKeys(record, ['mandatory', 'label', 'sno', 'active', 'visibleToSupplier',
//       'formulae', 'key', 'inputBy', 'type', 'options', 'validation', 'isSystemField', 'userDefinedFieldKey',
//       'size', 'feedbackSettings', 'isAggregate', 'helpText', 'pinned', 'sectionId', 'category', 'isCalculated', 'headerColumnColor']);
//     const label = record.label || record.key;
//     createRecord.labelSlug = `cf_${utils.getSlugifyLabel(label)}`;
//     createRecord.slug = utils.slugify(label);
//     createRecord.transactionType = options.transactionType;
//     createRecord.identifier = options.identifier;
//     createRecord[options.transactionKey] = options.transactionId;
//     return createRecord;
//   });
//   const fieldController = new FieldController(auth.customerId, auth.transaction);
//   await fieldController.bulkCreate(createRecords);
// };

// customModuleService.upsertForTransaction = async (fields: any, options: any, auth: any): Promise<any> => {
//   const fieldRecordsToUpdate: any = [];
//   const idsToDelete: any = [];
//   const fieldRecordsToCreate: any = [];
//   fields.forEach((field: any) => {
//     if (field.method === 'CREATE' && !field.id) {
//       fieldRecordsToCreate.push(field);
//     } else if (field.method === 'UPDATE') {
//       if (!field.id) throw new ValidationError('Field id is required for update');
//       fieldRecordsToUpdate.push(field);
//     } else if (field.method === 'DELETE') {
//       if (!field.id) throw new ValidationError('Field id is required for update');
//       idsToDelete.push(field.id);
//     }
//   });
//   const fieldController = new FieldController(auth.customerId, auth.transaction);
//   if (idsToDelete.length) {
//     await fieldController.update({
//       delete: 1,
//     }, {
//       where: {
//         id: idsToDelete,
//       },
//     });
//   }

//   if (fieldRecordsToCreate.length) {
//     await customModuleService.createForTransaction(fieldRecordsToCreate, options, auth);
//   }

//   if (fieldRecordsToUpdate.length) {
//     await mapSeries(fieldRecordsToUpdate, async (field: any) => {
//       const updateValues = utils.copyKeys(field, ['label', 'mandatory', 'sno', 'active', 'visibleToSupplier',
//         'formulae', 'key', 'inputBy', 'type', 'options', 'validation', 'isSystemField', 'userDefinedFieldKey',
//         'size', 'feedbackSettings', 'isAggregate', 'helpText', 'pinned', 'isCalculated', 'headerColumnColor']);
//       updateValues.slug = utils.slugify(updateValues.label);
//       updateValues.labelSlug = `cf_${utils.getSlugifyLabel(updateValues.label)}`;
//       await fieldController.updateById(updateValues, field.id);
//     });
//   }
// };

// customModuleService.createFieldsForTransaction = fields => {
//   const createFields = fields.map(field => {
//     const createField = utils.copyKeys(field, ['active', 'mandatory', 'label', 'sno', 'visibleToSupplier',
//       'formulae', 'key', 'inputBy', 'type', 'options', 'validation', 'isSystemField', 'userDefinedFieldKey',
//       'size', 'feedbackSettings', 'isAggregate', 'helpText', 'pinned', 'sectionId', 'category', 'isCalculated', 'warningText', 'headerColumnColor']);
//     const label = field.label || field.key;
//     createField.labelSlug = `cf_${utils.getSlugifyLabel(label)}`;
//     createField.slug = utils.slugify(label);
//     return createField;
//   });
//   return createFields;
// };

export default customModuleService;
