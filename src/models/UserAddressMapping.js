export default function (sequelize, DataTypes) {
  const UserAddressMapping = sequelize.define('UserAddressMapping', {
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // addressId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  }, {});

  UserAddressMapping.associate = (models) => {
    UserAddressMapping.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    UserAddressMapping.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
    UserAddressMapping.belongsTo(models.Address, {
      foreignKey: {
        fieldName: 'addressId',
        allowNull: false,
      },
    });
  };

  // UserAddressMapping.sync();
  return UserAddressMapping;
}
