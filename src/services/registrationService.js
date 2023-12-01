import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';
import uuid4 from 'uuid4';
import config from '../config.js';
// import utils from '../../helpers/utils';
import {
  ValidationError,
  AuthenticationError,
  ResourceNotFoundError,
} from '../helpers/customError.js';
import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import UserCacheController from '../controllers/userCacheController.js';
import CustomerController from '../controllers/customerController.js';
import CompanyController from '../controllers/companyController.js';
import AddressController from '../controllers/addressController.js';
import RoleController from '../controllers/roleController.js';
import UniqueUserController from '../controllers/uniqueUserController.js';
import BillingAddressMappingController from '../controllers/billingAddressMappingController.js';
import CompanyAddressMappingController from '../controllers/companyAddressMappingController.js';
import UserAddressMappingController from '../controllers/userAddressMappingController.js';

const env = process.env.NODE_ENV || 'development';

const registrationService = {};

registrationService.register = async values => {
  const registrationToken = uuid4();
  const userRegistrationToken = uuid4();
  // values.secretKey = registrationToken;
  _set(values, 'registrationToken', registrationToken);

  // if (!uuid4.valid(registrationToken)) {
  //   throw new ResourceNotFoundError();
  // }
  // if (!values.name || !values.password) {
  //   throw new ValidationError('Email or password not present');
  // }
  const customerController = new CustomerController();
  const addressController = new AddressController();

  const companyAddressMappingController = new CompanyAddressMappingController();
  const userAddressMappingController = new UserAddressMappingController();
  const billingAddressMappingController = new BillingAddressMappingController();
  const uniqueUserController = new UniqueUserController();
  const userController = new UserController();
  const roleController = new RoleController();

  const customer = await customerController.create(values);
  const companyController = new CompanyController(customer.id);
  console.log('ddddddddddddddddddddddddddd', customer.id);
  if (!customer) {
    throw new ResourceNotFoundError();
  }
  const companyValues = { ...values, customerId: +customer.id };
  // _set(values, 'customerId', customer.id);
  console.log('companyValues',companyValues);
  const company = await companyController.create(companyValues);
  if (!company) {
    throw new ResourceNotFoundError();
  }

  const roleValues = {
    customerId: customer.id, admin: 1, name: 'Admin',
  };
  const role = await roleController.create(roleValues);
  if (!role) {
    throw new ResourceNotFoundError();
  }

  const salt = bcrypt.genSaltSync();
  const passwordHash = bcrypt.hashSync('12345', salt);
  const uniqueUserValues = {
    password: passwordHash,
    registeredAt: new Date(),
    name: values.primaryContactName,
    userRegistrationToken,
    email: values.email,
  };
  let uniqueUser = await uniqueUserController.create(uniqueUserValues);
  if (!uniqueUser) {
    throw new ResourceNotFoundError();
  }

  const userValues = {
    ...values, customerId: customer.id, roleId: role.id, uniqueUserId: uniqueUser.id,
  };

  const user = await userController.create(userValues);
  if (!user) {
    throw new ResourceNotFoundError();
  }

  uniqueUser = await uniqueUserController.updateById({ defaultUserId: user.id }, uniqueUser.id);

  const addressValues = {
    ...values, customerId: customer.id, userId: user.id, keyword: values.landmark,
  };
  // defaultBillingAddressId
  let address = await addressController.create(addressValues);
  if (!address) {
    throw new ResourceNotFoundError();
  }

  const camValues = {
    ...values, customerId: customer.id, addressId: address.id, companyId: company.id, name: values.primaryContactName,
  };
  const companyAddressMapping = await companyAddressMappingController.create(camValues);
  if (!companyAddressMapping) {
    throw new ResourceNotFoundError();
  }

  const uamValues = {
    customerId: customer.id, addressId: address.id, userId: user.id,
  };
  const userAddressMapping = await userAddressMappingController.create(uamValues);
  if (!userAddressMapping) {
    throw new ResourceNotFoundError();
  }

  const bamValues = {
    customerId: customer.id, addressId: address.id, billingAddressId: address.id,
  };
  const billingAddressMapping = await billingAddressMappingController.create(bamValues);
  if (!billingAddressMapping) {
    throw new ResourceNotFoundError();
  }

  address = await addressController.updateById({ defaultBillingAddressId: billingAddressMapping.id }, address.id);

  // update

  // address = await addressController.updateById(values, address.id);
  // user = await userController.updateById(values, user.id);
  // company = await companyController.updateById(values, company.id);
  // _set(values, 'name', customer.name);
  // customer = await customerController.updateById(values, customer.id);

  // console.log('ddddddddddddddddddddddddddd', user,uniqueUser)

  // if (uniqueUser.registeredAt) {
  //   throw new ValidationError('User already registered');
  // }
  //   await authController.updateById(updateValues, uniqueUser.id);
  //   grootService.sendUserRegistrationSuccessEmail(uniqueUser.defaultUserId, uniqueUser.DefaultUser.customerId);
  //   const updatedUser = await authController.findOneByEmailForLogin(uniqueUser.email.trim());
  //   const userProfile = await registration
  // Service.findOneByIdWithCustomer(updatedUser.DefaultUser.id, updatedUser.DefaultUser.customerId);
  //   const authTokenValues = {
  //     userId: uniqueUser.id,
  //     type: 'cApp',
  //     ipAddress: values.ipAddress,
  //   };

  //   const params = {};
  //   if (_get(userProfile, 'Customer.disableLoginwithPassword')) {
  //     params.expiry = utils.getEndOfTheDayTimestamp();
  //     params.timeDiffInHours = utils.getEndOfTheDayTimeDiffInHours();
  //   }

  //   const authToken = await authTokenService.create(authTokenValues, params);
  //   // const auth = {
  //   //   customerId: uniqueUser.DefaultUser.customerId,
  //   //   userId: uniqueUser.DefaultUser.id,
  //   //   User: {
  //   //     name: uniqueUser.DefaultUser.name,
  //   //   },
  //   //   Customer: {
  //   //     name: uniqueUser.DefaultUser.Customer.name,
  //   //     code: uniqueUser.DefaultUser.Customer.code,
  //   //   },
  //   // };
  //   const expiresIn = _get(params, 'timeDiffInHours') ? `${params.timeDiffInHours}h` : (10 * 24 * 60 * 60);
  //   const token = jwt.sign({
  //     key: authToken.key,
  //   }, config.app.capp.auth.jwtSecret, {
  //     expiresIn,
  //   });
  //   return {
  //     auth: true,
  //     token,
  //     user: userProfile,
  //   };

  return {
    username: values.email,
    password: '12345',
  };
};

export default registrationService;
