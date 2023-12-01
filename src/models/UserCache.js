export default function (sequelize, DataTypes) {
  const UserCache = sequelize.define('UserCache', {
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    data: {
      type: DataTypes.JSONB,
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  }, {});

  UserCache.associate = (models) => {
    UserCache.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    UserCache.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
  };

  // UserCache.sync();
  return UserCache;
}
