export default function (sequelize, DataTypes) {
  const ApprovalTemplateItem = sequelize.define('ApprovalTemplateItem', {
    sno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    roleIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    moduleActionAttributes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    allowWeekends: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    minimumValue: DataTypes.DECIMAL,
    maximumValue: DataTypes.DECIMAL,
    enableDeliveryAddressFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableCostCentreFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableLedgerFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableDepartmentFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableValueFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableSubTotalFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableIntegrationErrorFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableForeignVendorFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    approvalCCEmails: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    deadlineType: DataTypes.STRING, // hours or days
    deadlineValue: DataTypes.INTEGER, // 1, 2, 3, 5, 7
    approvalType: DataTypes.STRING, // anyone or all or partial
    minimumApprovalCount: DataTypes.INTEGER,
    reminderSettingType: DataTypes.STRING,
    moveTonextApproval: DataTypes.INTEGER,
    commentRequired: DataTypes.INTEGER,
    rejectionReasonRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableTransactionEditing: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    enableExceptionFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableTransactionHold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableManagerLevelApproval: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableManagerLevelApprovalHierarchy: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rejectionType: DataTypes.STRING,
    minimumRejectionCount: DataTypes.INTEGER,
    transactionFilterRules: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    enableBillingAddressFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableSupplierCategoryFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableInternalUpdate: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableCreatorLevelApproval: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    oldApprovalTemplateId: {
      type: DataTypes.INTEGER,
    },
    enableRejectBtn: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    approveText: {
      type: DataTypes.STRING,
    },
    statusText: {
      type: DataTypes.STRING,
    },
    enableDimensionOneFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableDimensionTwoFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableDimensionThreeFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reassignApprovalSettings: {
      type: DataTypes.JSONB,
      defaultValue: {}, // store {moduleFilters: { enableLedgerFilter,  enableCostCentreFilter, enableDepartmentFilter}, roleIds: []}
    },
    enableProductCategoryFilter: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableRevert: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    autoSelectApprovers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableNextSequenceApprovers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableVendorApprovals: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  ApprovalTemplateItem.associate = (models) => {
    ApprovalTemplateItem.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    ApprovalTemplateItem.belongsTo(models.ApprovalTemplate, {
      foreignKey: {
        fieldName: 'approvalTemplateId',
        allowNull: false,
      },
      as: 'AT',
    });
    ApprovalTemplateItem.hasMany(models.ApprovalTemplateItemReminder, {
      foreignKey: {
        fieldName: 'approvalTemplateItemId',
        allowNull: false,
      },
      as: 'ATIRs',
    });
    ApprovalTemplateItem.belongsTo(models.Role, {
      foreignKey: {
        fieldName: 'reassignRoleId',
      },
    });
  };
  return ApprovalTemplateItem;
}
