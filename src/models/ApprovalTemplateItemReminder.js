export default function (sequelize, DataTypes) {
  const ApprovalTemplateItemReminder = sequelize.define('ApprovalTemplateItemReminder', {
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    value: DataTypes.INTEGER,
    reminderType: DataTypes.STRING, // before or after
    mailType: {
      type: DataTypes.STRING,
      defaultValue: 'reminder', // reminder or escalation
    },
    alertTimeType: {
      type: DataTypes.STRING,
      defaultValue: 'hours', // hours or days
    },
    roleIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    enableManagerReminder: { // if this is true -- mails will be going to manager instead of above chosen roleIds if any
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    approvalCCEmails: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    forInvoiceWorklist: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableWeekDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableGRNCreatorReminder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    selectedWeekDays: {
      type: DataTypes.STRING,
    },
  });

  ApprovalTemplateItemReminder.associate = (models) => {
    ApprovalTemplateItemReminder.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    ApprovalTemplateItemReminder.belongsTo(models.ApprovalTemplateItem, {
      foreignKey: {
        fieldName: 'approvalTemplateItemId',
      },
      as: 'ATI',
    });
    // ApprovalTemplateItemReminder.belongsTo(models.SupplierTicketGroup, {
    //   foreignKey: {
    //     fieldName: 'supplierTicketGroupId',
    //   },
    // });
  };

  return ApprovalTemplateItemReminder;
}
