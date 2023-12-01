export default function (sequelize, DataTypes) {
  const BillingAddressMapping = sequelize.define('BillingAddressMapping', {
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // billingAddressId: {
    //   type: DataTypes.INTEGER,
    // },
    // addressId: {
    //   type: DataTypes.INTEGER,
    // },
  }, {});

  BillingAddressMapping.associate = (models) => {
    BillingAddressMapping.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    BillingAddressMapping.belongsTo(models.Address, {
      foreignKey: {
        fieldName: 'billingAddressId',
        allowNull: false,
      },
      as: 'BillingAddress',
    });
    BillingAddressMapping.belongsTo(models.Address, {
      foreignKey: {
        fieldName: 'addressId',
        allowNull: false,
      },
    });
  };

  // BillingAddressMapping.sync();
  return BillingAddressMapping;
}
