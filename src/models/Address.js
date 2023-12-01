export default function (sequelize, DataTypes) {
  const Address = sequelize.define('Address', {
    keyword: {
      type: DataTypes.STRING,
    },
    mobile: {
      type: DataTypes.INTEGER,
      validate: {
        isNumeric: true,
      },
    },
    line1: {
      type: DataTypes.STRING,
    },
    line2: {
      type: DataTypes.STRING,
    },
    landmark: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.INTEGER,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isBillingAddress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    legalName: DataTypes.STRING,
    gstin: DataTypes.STRING,
    keywordSlug: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.STRING,
    },
    locationCode: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
    gstUserName: DataTypes.STRING,
    rejectionReason: DataTypes.TEXT,
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // defaultBillingAddressId: {
    //   type: DataTypes.INTEGER,
    // },
  });

  Address.associate = models => {
    Address.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    Address.hasMany(models.UserAddressMapping, {
      foreignKey: 'addressId',
      as: 'UAMs',
    });
    Address.hasMany(models.CompanyAddressMapping, {
      foreignKey: 'addressId',
      as: 'CAMs',
    });
    Address.belongsTo(models.User, {
      foreignKey: 'userId',
      constraints: false,
    });
    Address.belongsTo(models.Address, {
      foreignKey: {
        fieldName: 'defaultBillingAddressId',
      },
      as: 'DefaultBillingAddress',
    });
    Address.hasMany(models.BillingAddressMapping, {
      foreignKey: 'addressId',
      as: 'BAMs',
    });
  };

  // Address.sync();
  return Address;
}
