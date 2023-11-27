import UserController from '../controllers/userController.js';
import NotificationController from '../controllers/notificationController.js';

const userService = {};

userService.findAllForListing = async options => {
  const userController = new UserController();
  const [usersData] = await Promise.all([
    userController.findAllForListing(options),
  ]);
  return {
    data: usersData,
  };
};

userService.findOneById = async options => {
  const userController = new UserController();
  const userData = await userController.findOneById(options);
  return {
    data: userData,
  };
};

userService.create = async values => {
  const userController = new UserController();
  // const [userData] = await Promise.all([
  //   userController.create(values),
  // ]);
  console.log('values', values);
  const user = await userController.create(values);
  return user;
};

userService.edit = async (values, userId) => {
  const userController = new UserController();
  const notificationController = new NotificationController();

  // const [userData] = await Promise.all([
  //   userController.create(values),
  // ]);
  console.log('values', values);
  const user = await userController.updateById(values, userId);

  if (user) {
    const values = {
      type: 'Test2',
      Text: 'Edited',
      active: 1,
      read: 0,
      reference: 'outBound',
      code: 'test003',
      userId: 1,
    };
    await notificationController.create(values);
  }
  return user;
};

userService.deleteById = async id => {
  const userController = new UserController();
  const notificationController = new NotificationController();

  const options = {
    where: {
      id,
    },
  };
  const user = await userController.delete(options);
  if (user) {
    const values = {
      type: 'Test2',
      Text: 'deleted',
      active: 1,
      read: 0,
      reference: 'outBound',
      code: 'test002',
      userId: 1,
    };
    await notificationController.create(values);
  }
  return user;
};

export default userService;
