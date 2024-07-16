export default function (sequelize, DataTypes) {
  const ApprovalTemplate = sequelize.define('ApprovalTemplate', {
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    module: DataTypes.STRING, // Invoice | PurchaseOrder
    moduleAction: DataTypes.STRING, // 'create', 'dispute', 'edit' etc.,
    sequence: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    autoSelectApprovers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    mandatory: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    /*
    "Sequence": [{
      "moduleActionAttributes": ["price", "quantity", "tax"],
      "roleIds": [1,2]
  }, {
      "moduleActionAttributes": ["price", "tax"],
      "roleIds": [3,4]
  }, {
      "moduleActionAttributes": ["quantity", "tax", "integration-error"],
      "roleIds": [1,4]
  }]
  */
    approvalCategory: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    excludeTransactionCreator: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableManagerLevelApproval: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    enableSubTotalChange: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableSubTotalApproval: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enableExcludeSelectedApprovals: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {});

  ApprovalTemplate.associate = (models) => {
    ApprovalTemplate.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    ApprovalTemplate.hasMany(models.ApprovalTemplateItem, {
      foreignKey: 'approvalTemplateId',
      as: 'ATIs',
    });
    // ApprovalTemplate.belongsTo(models.App, {
    //   foreignKey: 'appId',
    // });
  };

  return ApprovalTemplate;
}
