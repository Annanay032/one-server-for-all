export default function (sequelize, DataTypes) {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
    },
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Mark 'id' as the primary key
    },
  });

  console.log('jhgfdsdasa', User)
  User.sync({alter: true}).then(() => {
      console.log('sssssssssssssssss')
    }).catch((err) => {
      console.log('errsssssssssssssssss', err)
    
    })
  return User;

}
