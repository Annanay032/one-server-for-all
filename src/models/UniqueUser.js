export default function (sequelize, DataTypes) {
  const UniqueUser = sequelize.define('UniqueUser', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
    },
    userRegistrationToken: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    registeredAt: {
      type: DataTypes.DATE,
    },
    resetToken: {
      type: DataTypes.UUID,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isBouncedEmail: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // defaultUserId: {
    //   type: DataTypes.INTEGER,
    // },
  }, {});

  UniqueUser.associate = (models) => {
    UniqueUser.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'defaultUserId',
      },
      as: 'DefaultUser',
      constraints: false,
    });
    UniqueUser.hasMany(models.User, {
      foreignKey: 'uniqueUserId',
    });
  };

  // UniqueUser.sync();
  return UniqueUser;
}
