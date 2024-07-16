export default function (sequelize, DataTypes) {
  const Approval = sequelize.define('Approval', {
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.TEXT,
    },
    approvedAt: {
      type: DataTypes.DATE,
    },
    actionAt: {
      type: DataTypes.DATE,
    },
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    approvers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    moduleActionAttributes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    type: {
      type: DataTypes.STRING,
    },
    approvalTemplateItemDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}, // store approvalType, commentRequired, minimumApprovalCount
    },
    roleIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    userIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    moduleName: {
      type: DataTypes.TEXT,
    },
    isCurrentApprovalSequence: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sequenceKey: {
      type: DataTypes.STRING,
    },
    approvalStartTime: {
      type: DataTypes.DATE,
    },
    currentApprovalUserIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    currentApprovalXUserIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  }, {});

  Approval.associate = (models) => {
    Approval.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    Approval.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        // allowNull: false,
      },
    });
  };

  return Approval;
}
