export default function (sequelize, DataTypes) {
  const ModuleAccess = sequelize.define('ModuleAccess', {
    userId: {
      type: DataTypes.INTEGER,
    },
    roleId: {
      type: DataTypes.INTEGER,
    },
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
    // ModuleAccess.belongsTo(models.Customer, {
    //   foreignKey: {
    //     fieldName: "customerId",
    //     allowNull: false,
    //   },
    // });
    ModuleAccess.belongsTo(models.CustomModule, {
      foreignKey: {
        fieldName: 'customModuleId',
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
