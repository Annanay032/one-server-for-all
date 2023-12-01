export default function (sequelize, DataTypes) {
  const CompanyAddressMapping = sequelize.define('CompanyAddressMapping', {
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    gstin: DataTypes.STRING,
    corporateIdentificationNumber: {
      type: DataTypes.STRING,
    },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // addressId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // companyId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  }, {});

  CompanyAddressMapping.associate = (models) => {
    CompanyAddressMapping.belongsTo(models.Customer, {
      foreignKey: {
        fieldName: 'customerId',
        allowNull: false,
      },
    });
    CompanyAddressMapping.belongsTo(models.Company, {
      foreignKey: {
        fieldName: 'companyId',
        allowNull: false,
      },
    });
    CompanyAddressMapping.belongsTo(models.Address, {
      foreignKey: {
        fieldName: 'addressId',
        allowNull: false,
      },
    });
  };

  // CompanyAddressMapping.sync();
  return CompanyAddressMapping;
}
