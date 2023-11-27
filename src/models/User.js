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
    email: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
    role: {
      type: DataTypes.STRING,
    },
    team: {
      type: DataTypes.STRING,
    },
  });

  User.sync({ alter: true });
  return User;
}
