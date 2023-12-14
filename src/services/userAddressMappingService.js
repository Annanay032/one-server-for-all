import UserAddressMappingController from '../controllers/userAddressMappingController.js';
import userCacheService from './userCacheService.js';
import AddressController from '../controllers/addressController.js';

const userAddressMappingService = {};

userAddressMappingService.bulkCreateForUserId = async (addressIds, userId, auth) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const uamRecords = addressIds.map(addressId => ({
    userId,
    addressId,
  }));
  await userCacheService.markInactiveByUserId(userId, auth);
  return userAddressMappingController.bulkCreate(uamRecords);
};

const getAddressesByIds = async (addressIds, auth) => {
  const addressController = new AddressController(auth.customerId);
  const addresses = await addressController.findAllWithAttributes({
    where: {
      id: addressIds,
    },
  }, ['id', 'name', 'keyword']);
  if (addresses.length) {
    return addresses.map(address => address.keyword);
  }
  return [];
};

userAddressMappingService.bulkCheckAndUpdateForUserId = async (addressIds, userId, auth) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const uams = await userAddressMappingController.findAll({
    where: {
      userId,
    },
  });
  const addressIdMapping = {};
  uams.forEach(uam => {
    addressIdMapping[uam.addressId] = {
      uamId: uam.id,
      active: uam.active,
      presentInUpdate: false,
      addressId: uam.addressId,
    };
  });
  const markActiveIds = [];
  const markInactiveIds = [];
  const createRecords = [];
  const activeAddressIds = [];
  const inactiveAddressIds = [];
  let dimensionActives = [];
  let dimensionInActives = [];
  addressIds.forEach(addressId => {
    if (addressIdMapping[addressId]) {
      addressIdMapping[addressId].presentInUpdate = true;
      if (!addressIdMapping[addressId].active) {
        markActiveIds.push(addressIdMapping[addressId].uamId);
        activeAddressIds.push(addressId);
      }
    } else {
      createRecords.push({
        addressId,
        userId,
      });
      activeAddressIds.push(addressId);
    }
  });

  await userCacheService.markInactiveByUserId(userId, auth);
  Object.values(addressIdMapping).filter(mapping => !mapping.presentInUpdate && mapping.active)
    .forEach(mapping => {
      markInactiveIds.push(mapping.uamId);
      inactiveAddressIds.push(mapping.addressId);
    });

  if (activeAddressIds.length > 0) {
    dimensionActives = await getAddressesByIds(activeAddressIds, auth);
  }
  if (inactiveAddressIds.length > 0) {
    dimensionInActives = await getAddressesByIds(inactiveAddressIds, auth);
  }

  if (markActiveIds.length > 0) {
    await userAddressMappingController.bulkMarkActiveById(markActiveIds);
  }
  if (markInactiveIds.length > 0) {
    await userAddressMappingController.bulkMarkInactiveById(markInactiveIds);
  }
  if (createRecords.length > 0) {
    await userAddressMappingController.bulkCreate(createRecords);
  }
  return {
    dimensionActives,
    dimensionInActives,
  };
};

userAddressMappingService.findAllByUserId = (userId, auth) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  return userAddressMappingController.findAll({
    where: {
      userId,
    },
  });
};

userAddressMappingService.findAllByAddressId = (addressId, auth) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  return userAddressMappingController.findAll({
    attributes: ['userId'],
    where: {
      addressId,
    },
  });
};

userAddressMappingService.bulkCreateForAddressId = async (userIds, addressId, auth, approversExist) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const uamRecords = userIds.map(userId => ({
    addressId,
    userId: userId.value,
    active: approversExist,
  }));
  return userAddressMappingController.bulkCreate(uamRecords);
};

userAddressMappingService.bulkCheckAndCreateForAddressId = async (userIds, addressId, auth) => {
  const userAddressMappingController = new UserAddressMappingController(auth.customerId);
  const uams = await userAddressMappingController.findAll({
    where: {
      addressId,
    },
  });
  const userIdMapping = {};
  uams.forEach((uam) => {
    userIdMapping[uam.userId] = {
      uamId: uam.id,
      active: uam.active,
      presentInUpdate: false,
    };
  });
  const markActiveIds = [];
  const markInactiveIds = [];
  const createRecords = [];
  userIds.forEach((userId) => {
    if (userIdMapping[userId]) {
      userIdMapping[userId].presentInUpdate = true;
      if (!userIdMapping[userId].active) {
        markActiveIds.push(userIdMapping[userId].uamId);
      }
    } else {
      createRecords.push({
        userId,
        addressId,
      });
    }
  });
  Object.values(userIdMapping).filter(mapping => !mapping.presentInUpdate && mapping.active)
    .forEach(mapping => markInactiveIds.push(mapping.uamId));
  if (markActiveIds.length > 0) {
    await userAddressMappingController.bulkMarkActiveById(markActiveIds);
  }
  if (markInactiveIds.length > 0) {
    await userAddressMappingController.bulkMarkInactiveById(markInactiveIds);
  }
  if (createRecords.length > 0) {
    await userAddressMappingController.bulkCreate(createRecords);
  }
};

export default userAddressMappingService;
