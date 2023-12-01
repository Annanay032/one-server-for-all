import utils from '../helpers/utils.js';

export default function (sequelize, DataTypes) {
  const Customer = sequelize.define('Customer', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    gstin: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    codeSlug: {
      type: DataTypes.STRING,
      unique: true,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    primaryContactName: {
      type: DataTypes.STRING,
    },
    primaryContactMobile: {
      type: DataTypes.STRING,
    },
    primaryContactLandline: {
      type: DataTypes.STRING,
    },
    domain: {
      type: DataTypes.STRING,
    },
    logoUrl: {
      type: DataTypes.STRING,
    },
    chatVisibility: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    supportChatVisibility: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    disableAuthentication: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    gstAuthToken: {
      type: DataTypes.STRING,
    },
    secretKey: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    defaultCountryCode: {
      type: DataTypes.STRING,
    },
    customerEmailDomains: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    disableLoginwithPassword: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // registeredAddressId: {
    //   type: DataTypes.INTEGER,
    // },
    // primaryCompanyId: {
    //   type: DataTypes.INTEGER,
    // },
  }, {
    hooks: {
      beforeSave: attributes => {
        attributes.set('slug', utils.slugify(attributes.get('name')));
        attributes.set('codeSlug', utils.slugify(attributes.get('code')));
      },
    },
  });

  // Customer.sync();

  Customer.associate = models => {
    Customer.hasMany(models.User, {
      foreignKey: 'customerId',
    });
    Customer.hasMany(models.Address, {
      foreignKey: 'customerId',
    });
    Customer.hasMany(models.Company, {
      foreignKey: 'customerId',
    });
    // ;
    //     Customer.belongsTo(models.User, {
    //       foreignKey: 'automationUserId',
    //       as: 'AutomationUser',
    //       constraints: false,
    //     });
    Customer.belongsTo(models.Address, {
      foreignKey: 'registeredAddressId',
      as: 'RegisteredAddress',
      constraints: false,
    });
    Customer.hasMany(models.Company, {
      foreignKey: 'customerId',
    });
    Customer.belongsTo(models.Company, {
      foreignKey: 'primaryCompanyId',
      as: 'PrimaryCompany',
      constraints: false,
    });
    // Customer.hasMany(models.App, {
    //   foreignKey: {
    //     fieldName: 'customerId',
    //   },
    // });
  };

  return Customer;
}
