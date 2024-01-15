export default function (sequelize, DataTypes) {
  const ModuleAccess = sequelize.define('ModuleAccess', {
    isCustomModule: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    delete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  ModuleAccess.associate = models => {
    ModuleAccess.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    ModuleAccess.belongsTo(models.CustomModule, {
      foreignKey: {
        fieldName: 'customModuleId',
      },
    });

    ModuleAccess.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
      },
    });

    ModuleAccess.belongsTo(models.Role, {
      foreignKey: {
        fieldName: 'roleId',
      },
    });
    // ModuleAccess.hasMany(models.Field, {
    //   fieldName: 'fieldId',
    // });
    // ModuleAccess.hasMany(models.CustomTransaction, {
    //   fieldName: "CustomTransactionId",
    // });
  };

  return ModuleAccess;
}
