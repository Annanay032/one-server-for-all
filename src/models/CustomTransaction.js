export default function (sequelize, DataTypes) {
  const CustomTransaction = sequelize.define(
    'CustomTransaction',
    {
      sno: {
        type: DataTypes.INTEGER,
      },
      fieldsMap: {
        type: DataTypes.JSONB,
      },
      fieldsOrder: {
        type: DataTypes.JSONB,
      },
      fieldsResponses: {
        type: DataTypes.JSONB,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      delete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
  );

  CustomTransaction.associate = models => {
    CustomTransaction.belongsTo(models.CustomModule, {
      foreignKey: {
        fieldName: 'CustomModuleId',
        allowNull: false,
      },
    });
    // CustomTransaction.belongsTo(models.User, {
    //   foreignKey: {
    //     fieldName: 'userId',
    //     allowNull: false,
    //   },
    // });
  };

  return CustomTransaction;
}
