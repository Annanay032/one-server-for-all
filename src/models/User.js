export default function (sequelize, DataTypes) {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
    },
    reference: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    customerId: {
      type: DataTypes.INTEGER,
    },
  });

  User.sync({ alter: true });
  return User;
}
