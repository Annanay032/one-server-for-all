export default function (sequelize, DataTypes) {
  const Notification = sequelize.define(
    'Notification',
    {
      type: DataTypes.STRING,
      text: DataTypes.TEXT,
      read: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      active: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      reference: {
        type: DataTypes.STRING,
      },
      code: {
        type: DataTypes.STRING,
      },
      // userId: {
      //   type: DataTypes.INTEGER,
      // },
    },
    {},
  );

  Notification.associate = models => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  };

  // Notification.sync();

  return Notification;
}
