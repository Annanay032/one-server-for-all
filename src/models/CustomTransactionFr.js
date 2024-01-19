export default function (sequelize, DataTypes) {
  const CustomTransactionFr = sequelize.define(
    'CustomTransactionFr',
    {
      sno: {
        type: DataTypes.INTEGER,
      },
      sectionKey: {
        type: DataTypes.STRING,
      },
      // fieldsOrder: {
      //   type: DataTypes.STRING,
      // },
      rowKey: {
        type: DataTypes.STRING,
      },
      sectionType: {
        type: DataTypes.STRING,
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

  CustomTransactionFr.associate = models => {
    // CustomTransactionFr.belongsTo(models.CustomModule, {
    //   foreignKey: {
    //     fieldName: 'customModuleId',
    //     allowNull: false,
    //   },
    // });
    CustomTransactionFr.belongsTo(models.CustomTransaction, {
      foreignKey: {
        fieldName: 'customTransactionId',
        allowNull: false,
      },
    });
  };

  return CustomTransactionFr;
}
