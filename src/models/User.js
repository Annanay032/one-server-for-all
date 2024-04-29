export default function (sequelize, DataTypes) {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.STRING,
    },
    addressId: {
      type: DataTypes.INTEGER,
    },
    email: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
    team: {
      type: DataTypes.STRING,
      defaultValue: 'owner',
    },
    uniqueIdentifier: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      // allowNull: false,
    },
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      // allowNull: false,
    },
    // managerId: {
    //   type: DataTypes.INTEGER,
    // },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // roleId: {
    //   type: DataTypes.INTEGER,
    // },
    // uniqueUserId: {
    //   type: DataTypes.INTEGER,
    // },
  });

  User.associate = models => {
    User.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'managerId',
      },
      as: 'Manager',
    });
    User.hasMany(models.UserAddressMapping, {
      foreignKey: 'userId',
      as: 'UAMs',
    });
    User.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        constraints: false,
      },
    });
    User.belongsTo(models.Role, {
      foreignKey: {
        fieldName: 'roleId',
        allowNull: false,
      },
    });
    User.belongsTo(models.UniqueUser, {
      foreignKey: 'uniqueUserId',
    });

    User.hasMany(models.ModuleAccess, {
      foreignKey: 'userId',
    });
    User.hasMany(models.CustomTransaction, {
      foreignKey: 'userId',
    });
    User.hasMany(models.InventoryItem, {
      foreignKey: 'userId',
    });
  };

  // User.sync();
  return User;
}
