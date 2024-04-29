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
  const InventoryItem = sequelize.define('InventoryItem', {
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    itemType: {
      type: DataTypes.STRING, // stock non stock
    },
    type: {
      type: DataTypes.STRING, // goods services
    },
    reference: {
      type: DataTypes.TEXT,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING,
    },
    uom: {
      type: DataTypes.STRING,
    },
    slug: {
      type: DataTypes.TEXT,
    },
    sno: {
      type: DataTypes.INTEGER,
    },
    unit: {
      type: DataTypes.STRING,
    },
    sku: {
      type: DataTypes.STRING, // stock Keeping Unit
    },
    hsn: {
      type: DataTypes.STRING,
    },
    upc: {
      type: DataTypes.INTEGER,
    },
    ean: {
      type: DataTypes.INTEGER,
    },
    mpn: {
      type: DataTypes.STRING,
    },
    isbn: {
      type: DataTypes.STRING,
    },
    dimensions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    weight: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isReturnable: {
      type: DataTypes.BOOLEAN,
    },
    key: {
      type: DataTypes.STRING,
    },
    delete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    amendReasons: {
      type: DataTypes.TEXT,
    },
    userDefinedFields: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    hooks: {
      beforeSave: attributes => {
        attributes.set('slug', slugify(attributes.get('fieldName')));
      },
    },
  });

  InventoryItem.associate = models => {
    InventoryItem.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    InventoryItem.belongsTo(models.Section, {
      foreignKey: {
        fieldName: 'sectionId',
      },
    });
    InventoryItem.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
      },
    });
    InventoryItem.belongsTo(models.Uom, {
      foreignKey: {
        foreignKey: 'uomId',
      },
    });
    // InventoryItem.belongsTo(models.Uom, {
    //   foreignKey: 'issueUomId',
    //   as: 'IssueUom',
    // });
  };

  return InventoryItem;
}
