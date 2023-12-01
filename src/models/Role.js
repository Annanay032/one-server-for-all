import utils from '../helpers/utils.js';

export default function (sequelize, DataTypes) {
  const Role = sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      defaultValue: 'Admin',
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: 'Is set as default admin',
    },
    auto: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    admin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // customerId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  }, {
    hooks: {
      beforeSave: (attributes) => {
        attributes.set('slug', utils.slugify(attributes.get('name')));
        // attributes.set('name', utils.slugify('admin'));
      },
    },
  });

  Role.associate = (models) => {
    Role.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      allowNull: false,
    });
    Role.hasMany(models.User, {
      foreignKey: 'roleId',
    });
  };

  // Role.sync();
  return Role;
}
