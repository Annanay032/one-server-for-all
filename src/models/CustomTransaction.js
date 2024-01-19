export default function (sequelize, DataTypes) {
  const CustomTransaction = sequelize.define(
    'CustomTransaction',
    {
      sno: {
        type: DataTypes.INTEGER,
      },
      sectionsMap: {
        type: DataTypes.JSONB,
      },
      // fieldsOrder: {
      //   type: DataTypes.JSONB,
      // },
      tableSectionRowOrder: {
        type: DataTypes.JSONB,
      },
      sectionOrderMap: {
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
        fieldName: 'customModuleId',
        allowNull: false,
      },
    });

    CustomTransaction.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });

    CustomTransaction.hasMany(models.CustomTransactionFr, {
      foreignKey: 'customTransactionId',
    });
  };

  return CustomTransaction;
}
