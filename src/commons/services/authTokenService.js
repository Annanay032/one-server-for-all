import moment from 'moment';
import utils from '../../helpers/utils';
import { db } from '../../models';

const authTokenService = {};

authTokenService.create = async (values, params = {}) => {
  const tokenValues = utils.copyKeys(values, ['type', 'userId', 'xUserId', 'ipAddress', 'uniqueUserId']);
  tokenValues.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);

  if (params.expiry) {
    tokenValues.expiresAt = new Date(params.expiry);
  }
  const token = await db.AuthToken.create(tokenValues);
  return token;
};

authTokenService.findTokenForCApp = (options) => {
  const filter = {
    where: {
      key: options.key,
      active: 1,
    },
    include: [{
      model: db.User,
      attributes: ['id', 'name', 'uniqueIdentifier'],
      include: [{
        model: db.Customer,
        attributes: ['id', 'name', 'code'],
      }],
    }, {
      model: db.UniqueUser,
      attributes: ['id', 'defaultUserId'],
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'uniqueIdentifier'],
        include: [{
          model: db.Customer,
          attributes: ['id', 'name', 'code'],
        }],
      }, {
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'uniqueIdentifier'],
      }],
    }],
  };
  return db.AuthToken.findOne(filter);
};

authTokenService.findTokenForSApp = (options) => {
  const filter = {
    where: {
      key: options.key,
      active: 1,
    },
    include: [{
      model: db.XUser,
      attributes: ['id', 'name', 'xSupplierId', 'email'],
      include: [{
        model: db.SupplierXUserMapping,
        as: 'SXUMs',
        where: {
          active: 1,
        },
        required: false,
        include: [{
          model: db.Supplier,
          attributes: ['id', 'name'],
        }],
      }],
    }],
  };
  return db.AuthToken.findOne(filter);
};

authTokenService.markTokenInactive = async (key) => {
  await db.AuthToken.update({
    active: 0,
  }, {
    where: {
      key,
    },
  });
};

authTokenService.markAllTokenInactive = async (id) => {
  await db.AuthToken.update({
    active: 0,
  }, {
    where: {
      userId: id,
    },
  });
};

authTokenService.markAllTokenInactiveSupplier = async (id) => {
  await db.AuthToken.update({
    active: 0,
  }, {
    where: {
      xUserId: id,
    },
  });
};

authTokenService.changeUserId = async (userId, key) => {
  await db.AuthToken.update({
    userId,
  }, {
    where: {
      key,
      active: 1,
    },
  });
};

export default authTokenService;
