import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';
import uuid4 from 'uuid4';
import config from '../config.js';
// import utils from '../../helpers/utils';
import { ValidationError, AuthenticationError, ResourceNotFoundError } from '../helpers/customError.js';
import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import UserCacheController from '../controllers/userCacheController.js';
import CustomerController from '../controllers/customerController.js';

// import grootService from './grootService';
// import authTokenService from '../../commons/services/authTokenService';
// import userLoginActivityService from './userLoginActivityService';
// import eventService from '../../commons/services/eventService';
import userAuthHelper from '../helpers/userAuthHelper.js';
// import surveyService from './surveyService';
// import utils from '../../helpers/utils';

const env = process.env.NODE_ENV || 'development';

const authService = {};

// This function divides the query to find user details into two separate queries
authService.findOneByIdWithCustomer = async (userId, customerId) => {
  const userController = new UserController(customerId);
  const customerController = new CustomerController();
  const user = await userController.findOneByIdForView(userId);
  const userObj = user.toJSON();
  const customer = await customerController.findOneByIdForUser(userObj.customerId);
  const customerObj = customer.toJSON();
  _set(userObj, 'Customer', customerObj);
  return userObj;
};

authService.getRegistrationData = async registrationToken => {
  if (!uuid4.valid(registrationToken)) {
    throw new ResourceNotFoundError();
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByRegistrationToken(registrationToken);
  if (!uniqueUser) {
    throw new ResourceNotFoundError();
  }
  if (uniqueUser.registeredAt) {
    throw new ValidationError('User already registered');
  }
  const ret = {
    email: uniqueUser.email,
    phone: uniqueUser.DefaultUser.phone,
    customerName: uniqueUser.DefaultUser.Customer.name,
    name: uniqueUser.DefaultUser.name,
  };
  return ret;
};

authService.getUserByEmail = async email => {
  const authController = new AuthController();
  const getUser = await authController.findOneByEmailForLogin(email.trim());
  return getUser;
};

authService.login = async (values, byPassAuth = false) => {
  if (!values.email) {
    throw new ValidationError('Email not present');
  }

  if (!byPassAuth) {
    if (!values.password) {
      throw new ValidationError('Password not present');
    }
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByEmailForLogin((values.email).trim());
  if (!uniqueUser) {
    throw new ValidationError('User Account does not exist - Please contact your System Admin');
  }
  if (!uniqueUser.registeredAt) {
    throw new ValidationError('User email address is not registered - Please check input correct emailAddress');
  }
  if (!byPassAuth) {
    const isValidPassword = bcrypt.compareSync(values.password, uniqueUser.password);
    if (!isValidPassword) {
      throw new ValidationError('Email and Password does not match - Please check and login again');
    }
  }
  // Helper
  const userDetails = await userAuthHelper.getUserCredentials(uniqueUser.id, values.refUrl, uniqueUser.defaultUserId);
  if (!byPassAuth && userDetails.Customer.disableLoginwithPassword) {
    throw new ValidationError('Please use Single Sign On to Login');
  }
  const userProfile = await authService.findOneByIdWithCustomer(userDetails.id, userDetails.customerId);
  if (!userProfile.active) {
    throw new ValidationError('User is marked Inactive - Please contact your System Admin');
  }

  const mappedCustomers = await userAuthHelper.getMappedCustomersForUser(userProfile.uniqueUserId);
  _set(userProfile, 'mappedCustomers', mappedCustomers);

  const userCacheController = new UserCacheController(userDetails.customerId);
  const newCache = {
    customerId: userDetails.customerId,
    userId: userDetails.id,
    data: userProfile,
    active: 1,
  };
  let newTimeStamp;
  const userCache = await userCacheController.findOneByUserId(userDetails.id);
  if (!userCache) {
    const newUserCache = await userCacheController.create(newCache);
    newTimeStamp = newUserCache.updatedAt.getTime();
  } else {
    await userCacheController.update(newCache, {
      where: {
        userId: userDetails.id,
      },
    });
    const updatedUserCache = await userCacheController.findOneByUserId(userDetails.id);
    newTimeStamp = updatedUserCache.updatedAt.getTime();
  }
  const salt = bcrypt.genSaltSync();
  const newTimeStampHash = bcrypt.hashSync(`${userDetails.id}_${newTimeStamp}`, salt);
  _set(userProfile, 'profileToken', newTimeStampHash);

  // const authTokenValues = {
  //   uniqueUserId: userDetails.uniqueUserId,
  //   type: 'cApp',
  //   ipAddress: values.ipAddress, // System Getting Logged out if IP address is changed
  //   active: 1,
  // };

  // const params = {};
  // const authToken = await authTokenService.create(authTokenValues, params);
  // const expiresIn = _get(params, 'timeDiffInHours') ? `${params.timeDiffInHours}h` : (10 * 24 * 60 * 60);
  // const token = jwt.sign({
  //   key: authToken.key,
  // }, config.app.capp.auth.jwtSecret, {
  //   expiresIn,
  // });

  return {
    data: {
      auth: true,
      // token,
      user: userProfile,
    },
  };
};

authService.updatePassword = async values => {
  if (!values.email || !values.password || !values.newPassword) {
    throw new ValidationError('Invalid request - Mandatory values not present');
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByEmailForLogin((values.email).trim());
  if (!uniqueUser) {
    throw new ValidationError('Invalid request - Email is not registered');
  }
  const isValidPassword = bcrypt.compareSync(values.password, uniqueUser.password);
  if (!isValidPassword) {
    throw new ValidationError('Invalid request - Email or password is incorrect');
  }
  const salt = bcrypt.genSaltSync();
  const newPasswordHash = bcrypt.hashSync(values.newPassword, salt);
  const updatedUser = await authController.updateById({
    password: newPasswordHash,
  }, uniqueUser.id);
  await authTokenService.markAllTokenInactive(uniqueUser.defaultUserId);
  grootService.sendPasswordChangedEmailToUser(uniqueUser.defaultUserId, uniqueUser.DefaultUser.customerId);
  return updatedUser;
};

authService.forgotPassword = async values => {
  if (!values.email) {
    throw new ValidationError('Email mandatory');
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByEmailForLogin((values.email).trim());
  if (!uniqueUser || !uniqueUser.registeredAt) {
    throw new ValidationError('Email is not registered');
  }
  const resetToken = uuid4();
  const updatedUser = await authController.updateById({
    resetToken,
  }, uniqueUser.id);
  await authTokenService.markAllTokenInactive(uniqueUser.defaultUserId);
  grootService.sendPasswordResetEmailToUser(uniqueUser.id, uniqueUser.DefaultUser.Customer.id);
  return updatedUser;
};

authService.getResetData = async resetToken => {
  if (!uuid4.valid(resetToken)) {
    throw new ResourceNotFoundError();
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByResetToken(resetToken);
  if (!uniqueUser) {
    throw new ResourceNotFoundError();
  }
  return {
    email: uniqueUser.email,
  };
};

authService.resetPassword = async (values, resetToken) => {
  if (!uuid4.valid(resetToken)) {
    throw new ResourceNotFoundError();
  }
  if (!values.password) {
    throw new ValidationError('Mandatory values not present');
  }
  const authController = new AuthController();
  const uniqueUser = await authController.findOneByResetToken(resetToken);
  if (!uniqueUser) {
    throw new ResourceNotFoundError();
  }
  const salt = bcrypt.genSaltSync();
  const passwordHash = bcrypt.hashSync(values.password, salt);
  const updatedUser = await authController.updateById({
    password: passwordHash,
    resetToken: null,
  }, uniqueUser.id);
  await authTokenService.markAllTokenInactive(uniqueUser.defaultUserId);
  grootService.sendPasswordChangedEmailToUser(uniqueUser.defaultUserId, uniqueUser.DefaultUser.customerId);
  return updatedUser;
};

authService.authenticate = async (req, res, next) => {
  // const transaction = sequelize.transaction();
  if (env === 'development') {
    _set(req, 'appAuth', {
      // transaction,
      customerId: 1,
      userId: 1,
      ipAddress: req.clientIp,
      User: {
        name: 'Dishu',
      },
      Customer: {
        name: 'SuperFood Private Ltd',
        code: 'SFPL',
      },
    });
    next();
    return;
  }
  const token = req.cookies[config.app.capp.auth.token];
  if (!token) {
    next(new AuthenticationError());
    return;
  }
  jwt.verify(token, config.app.capp.auth.jwtSecret, async (err, decoded) => {
    if (err) {
      next(new AuthenticationError());
      return;
    }
    if (!decoded.key || !uuid4.valid(decoded.key)) {
      next(new AuthenticationError());
      return;
    }
    const authToken = await authTokenService.findTokenForCApp(decoded);
    if (!authToken || !authToken.active || (new Date() > authToken.expiresAt)) {
      next(new AuthenticationError());
      return;
    }
    const authUser = req.headers.authuser;
    const { refUrl } = req.query;
    let currentUser;
    if (refUrl) {
      currentUser = await userAuthHelper.getUserCredentials(authToken.UniqueUser.id, refUrl, authToken.UniqueUser.defaultUserId, authUser);
    } else if (req.query && req.query.user) {
      currentUser = authToken.UniqueUser.Users.find(user => user.uniqueIdentifier === req.query.user);
    } else if (req.body && req.body.user) {
      currentUser = authToken.UniqueUser.Users.find(user => user.uniqueIdentifier === req.body.user);
    } else {
      currentUser = authToken.UniqueUser.Users.find(user => user.uniqueIdentifier === (authUser || authToken.UniqueUser.DefaultUser.uniqueIdentifier));
    }
    if (!currentUser) {
      next(new AuthenticationError());
      return;
    }
    if (currentUser && currentUser.module !== undefined) {
      next(new ResourceNotFoundError(`${currentUser.module}`));
      return;
    }

    const auth = {
      // transaction,
      customerId: currentUser.Customer.id,
      userId: currentUser.id,
      ipAddress: req.clientIp,
      User: {
        name: currentUser.name,
      },
      Customer: {
        name: currentUser.Customer.name,
        code: currentUser.Customer.code,
      },
    };
    req.appAuth = auth;
    next();
  });
};

export default authService;
