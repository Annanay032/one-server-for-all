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
  const Field = sequelize.define('Field', {
    source: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    type: {
      type: DataTypes.STRING,
      // text, select
    },
    fieldType: {
      type: DataTypes.STRING,
      // input, password, multiselect
    },
    sourceFieldType: {
      type: DataTypes.STRING,
      // custom field, system field
    },
    isParentField: {
      type: DataTypes.BOOLEAN,
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    label: {
      type: DataTypes.TEXT,
    },
    slug: {
      type: DataTypes.TEXT,
    },
    sno: {
      type: DataTypes.INTEGER,
    },
    transactionType: {
      type: DataTypes.STRING, // requisition.quote-request,auction-request,purchase-order,rate-contract,invoice,inward
    },
    validation: {
      type: DataTypes.JSONB,
    },
    key: {
      type: DataTypes.STRING,
    },
    delete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    fieldKey: {
      type: DataTypes.STRING,
    },
    userDefinedFieldKey: {
      type: DataTypes.UUID,
    },
    labelSlug: {
      type: DataTypes.TEXT,
    },
    isRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    defaultValue: {
      type: DataTypes.STRING,
    },
    isSearchable: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    helpText: {
      type: DataTypes.TEXT,
    },
    size: {
      type: DataTypes.INTEGER,
      default: 150,
    },
    wrapText: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    hooks: {
      beforeSave: attributes => {
        attributes.set('slug', slugify(attributes.get('label')));
      },
    },
  });

  Field.associate = models => {
    Field.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    Field.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
  };

  return Field;
}
