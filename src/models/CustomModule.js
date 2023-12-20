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
      name: {
        type: DataTypes.TEXT,
      },
      fieldsMap: {
        type: DataTypes.JSONB,
      },
      fieldsOrder: {
        type: DataTypes.JSONB,
      },
      slug: {
        type: DataTypes.TEXT,
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
    // CustomModule.hasMany(models.Field, {
    //   fieldName: 'fieldId',
    // });
    CustomModule.hasMany(models.CustomTransaction, {
      fieldName: 'CustomTransactionId',
    });
  };

  return CustomModule;
}
