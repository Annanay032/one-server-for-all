// import utils from '../helpers/utils.js';
import slug from 'slug';

const slugify = val => {
  if (val === null) {
    return null;
  }
  return (
    slug(val, {
      lower: true,
      remove: null,
    }) || val
  );
};

export default function (sequelize, DataTypes) {
  const CustomModule = sequelize.define(
    'CustomModule',
    {
      key: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.TEXT,
      },
      reference: {
        type: DataTypes.TEXT,
      },
      slug: {
        type: DataTypes.TEXT,
      },
      hasRoleAccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      hasUserAccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    {
      hooks: {
        beforeSave: attributes => {
          attributes.set('slug', slugify(attributes.get('name')));
        },
      },
    },
  );

  CustomModule.associate = models => {
    CustomModule.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    CustomModule.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });

    CustomModule.hasMany(models.Section, {
      foreignKey: 'customModuleId',
    });
    // CustomModule.hasMany(models.Field, {
    //   fieldName: 'fieldId',
    // });
    CustomModule.hasMany(models.ModuleAccess, {
      foreignKey: 'customModuleId',
    });

    CustomModule.hasMany(models.CustomTransaction, {
      foreignKey: 'customModuleId',
    });
  };

  return CustomModule;
}
