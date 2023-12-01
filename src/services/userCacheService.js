import UserCacheController from '../controllers/userCacheController.js';

const userCacheService = {};

userCacheService.findOneByUserId = async (userId, auth) => {
  const userCacheController = new UserCacheController(auth.customerId);
  const userCache = await userCacheController.findOneByUserId(userId);
  return userCache;
};

userCacheService.createUserCache = async (userObj, auth) => {
  const userCacheController = new UserCacheController(auth.customerId);
  const newCache = {
    userId: userObj.id,
    data: userObj,
  };
  const userCache = await userCacheController.create(newCache);
  return userCache;
};

userCacheService.updateUserCache = async (userObj, auth) => {
  const userCacheController = new UserCacheController(auth.customerId);
  const newCache = {
    data: userObj,
    active: 1,
  };
  const userCache = await userCacheController.update(newCache, {
    where: {
      userId: userObj.id,
    },
  });
  return userCache;
};

userCacheService.markInactiveByUserId = async (userId, auth) => {
  const userCacheController = new UserCacheController(auth.customerId);
  const userCache = await userCacheController.markInactiveByUserId(userId);
  return userCache;
};

userCacheService.bulkMarkInactiveByUserId = async (userIds, auth) => {
  const userCacheController = new UserCacheController(auth.customerId);
  const userCache = await userCacheController.bulkMarkInactiveByUserId(userIds);
  return userCache;
};

userCacheService.markInactiveByCustomerId = async (customerId) => {
  const userCacheController = new UserCacheController(customerId);
  const userCache = await userCacheController.markInactiveByCustomerId(customerId);
  return userCache;
};

export default userCacheService;
