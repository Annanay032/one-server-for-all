export default function (sequelize, DataTypes) {
  const Uom = sequelize.define('Uom', {
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit: {
      type: DataTypes.STRING,
    },
    conversionFactor: {
      type: DataTypes.DECIMAL,
    },
    conversionType: {
      type: DataTypes.STRING,
    }, // multiplication or division
    slug: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.STRING,
    },
    type: DataTypes.STRING, // for additional-charge | stock | non-stock | Services etc.,
  }, {});

  Uom.associate = models => {
    Uom.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    Uom.belongsTo(models.Uom, {
      foreignKey: 'baseUomId',
      as: 'BaseUom',
    });
    Uom.hasMany(models.Uom, {
      foreignKey: 'baseUomId',
      as: 'SubUoms',
      constraints: false,
    });
    Uom.hasMany(models.InventoryItem, {
      foreignKey: 'uomId',
    });
  };
  return Uom;
}
