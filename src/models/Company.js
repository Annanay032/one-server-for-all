import utils from '../helpers/utils.js';

export default function (sequelize, DataTypes) {
  const Company = sequelize.define('Company', {
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
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
    primary: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    domain: {
      type: DataTypes.STRING,
    },
    logoUrl: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.STRING,
    },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  }, {
    hooks: {
      beforeSave: (attributes) => {
        attributes.set('slug', utils.slugify(attributes.get('companyName')));
        attributes.set('codeSlug', utils.slugify(attributes.get('code')));
      },
    },
  });

  // Company.sync();

  Company.associate = (models) => {
    Company.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    Company.hasMany(models.CompanyAddressMapping, {
      foreignKey: 'companyId',
      as: 'CAMs',
    });
  };

  return Company;
}
