import bcrypt from 'bcrypt-nodejs';
import uuid4 from 'uuid4';
import _set from 'lodash/set.js';
import UserController from '../controllers/userController.js';
import NotificationController from '../controllers/notificationController.js';
import UniqueUserController from '../controllers/uniqueUserController.js';
import { ResourceNotFoundError } from '../helpers/customError.js';
import userCacheService from './userCacheService.js';

const userService = {};

userService.findAllForListing = async (options, auth) => {
  const userController = new UserController(auth.customerId);
  const [usersData] = await Promise.all([
    userController.findAllForListing(options, auth.customerId),
  ]);
  return {
    data: usersData,
  };
};

userService.findOneById = async (id, auth) => {
  const userController = new UserController(auth.customerId);
  const userData = await userController.findOneById(id);
  return {
    data: userData || {},
  };
};
userService.findAllByOptions = auth => {
  const userController = new UserController(auth.customerId);
  return userController.findAllForOptions(auth.customerId);
};

userService.create = async (values, auth) => {
  const userRegistrationToken = uuid4();
  const uniqueUserController = new UniqueUserController(auth.customerId);
  const salt = bcrypt.genSaltSync();
  const passwordHash = bcrypt.hashSync('12345', salt);
  const uniqueUserValues = {
    password: passwordHash,
    registeredAt: new Date(),
    name: values.name,
    userRegistrationToken,
    email: values.email,
  };
  let uniqueUser = await uniqueUserController.create(uniqueUserValues);
  if (!uniqueUser) {
    throw new ResourceNotFoundError();
  }
  const userValues = {
    ...values,
    uniqueUserId: uniqueUser.id,
    customerId: auth.customerId,
  };
  const userController = new UserController(auth.customerId);
  const user = await userController.create(userValues);
  uniqueUser = await uniqueUserController.updateById(
    { defaultUserId: user.id },
    uniqueUser.id,
  );
  return user;
};

userService.edit = async (values, userId, auth) => {
  const userController = new UserController(auth.customerId);
  const notificationController = new NotificationController(auth.customerId);

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

userService.deleteById = async (id, auth) => {
  const userController = new UserController(auth.customerId);
  const notificationController = new NotificationController(auth.customerId);

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

userService.findOneByIdWithCustomerForProfile = async (
  userId,
  timeStampHash,
  auth,
) => {
  let userObj;
  let newTimeStamp;
  const userCache = await userCacheService.findOneByUserId(userId, auth);
  if (!userCache || !userCache.active) {
    userObj = await userService.findOneByIdForView(userId, auth);
    if (!userCache) {
      const newUserCache = await userCacheService.createUserCache(
        userObj,
        auth,
      );
      newTimeStamp = newUserCache.updatedAt.getTime();
    } else {
      await userCacheService.updateUserCache(userObj, auth);
      const newUserCache = await userCacheService.findOneByUserId(userId, auth);
      newTimeStamp = newUserCache.updatedAt.getTime();
    }
  } else {
    if (timeStampHash) {
      const isTimestampMatched = bcrypt.compareSync(
        `${userId}_${userCache.updatedAt.getTime().toString()}`,
        timeStampHash,
      );
      if (isTimestampMatched) {
        return {
          data: userCache.toJSON().data,
        };
      }
    }
    userObj = userCache.toJSON().data;
    newTimeStamp = userCache.updatedAt.getTime();
  }
  const salt = bcrypt.genSaltSync();
  const newTimeStampHash = bcrypt.hashSync(`${userId}_${newTimeStamp}`, salt);
  _set(userObj, 'profileToken', newTimeStampHash);
  return {
    data: userObj,
  };
};

export default userService;
