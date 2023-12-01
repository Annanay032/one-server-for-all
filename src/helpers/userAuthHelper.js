import { ResourceNotFoundError } from './customError.js';
import UniqueUserController from '../controllers/uniqueUserController.js';

const userAuthHelper = {};

const getUpdatedReference = reference => reference;

const moduleControllerMap = {};

userAuthHelper.getUserCredentials = async (
  uniqueUserId,
  reference,
  defaultUserId,
  authUser,
) => {
  const uniqueUserController = new UniqueUserController();
  const uniqueUser = await uniqueUserController.findAllUserCustomerMappings(uniqueUserId);
  if (uniqueUser.Users && uniqueUser.Users.length === 1) {
    return uniqueUser.Users[0];
  }
  if (!reference || !reference.split('/')[2]) {
    if (authUser) {
      const userMapping = uniqueUser.Users.find(
        user => user.uniqueIdentifier === authUser,
      );
      return userMapping;
    }
    if (defaultUserId) {
      const userMapping = uniqueUser.Users.find(
        user => user.id === defaultUserId,
      );
      return userMapping;
    }
  }
  if (
    reference
    && ['new'].some(element => reference.includes(element))
    && authUser
  ) {
    const userMapping = uniqueUser.Users.find(
      user => user.uniqueIdentifier === authUser,
    );
    return userMapping;
  }

  if (reference) {
    const customerIds = uniqueUser.Users.map(user => user.customerId);
    if (
      (reference.includes('invoices')
        && !reference.includes('pro-forma-invoices'))
      || ['accounts', 'expenses', 'pending-inwards'].some(element => reference.includes(element))
    ) {
      reference = getUpdatedReference(reference);
    }
    const module = reference.split('/')[1];
    const id = reference.split('/')[2];
    const notValidNumber = isNaN(id); // number will return false
    if (!notValidNumber) {
      const transactionController = new moduleControllerMap[module](
        customerIds,
      );
      const transaction = await transactionController.findOneByIdWithAttributes(
        id,
        ['customerId'],
      );
      if (!transaction) {
        return {
          module,
        };
      }
      const userMapping = uniqueUser.Users.find(
        user => user.customerId === transaction.customerId,
      );
      return userMapping;
    }
  }
  const userMapping = uniqueUser.Users.find(
    user => user.id === defaultUserId,
  );
  return userMapping;
};

userAuthHelper.getMappedCustomersForUser = async uniqueUserId => {
  const uniqueUserController = new UniqueUserController();
  const uniqueUser = await uniqueUserController.findAllUserCustomerMappings(uniqueUserId);
  const mappedCustomers = [];
  uniqueUser.Users.filter(user => !!user.active).forEach(user => {
    mappedCustomers.push({
      userId: user.id,
      uniqueIdentifier: user.uniqueIdentifier,
      customerId: user.customerId,
      name: user.Customer.name,
      isDefault: uniqueUser.defaultUserId === user.id ? 1 : 0,
      logoUrl: user.Customer.logoUrl,
    });
  });
  return mappedCustomers;
};

userAuthHelper.changeUserProfile = async (
  uniqueUserId,
  authUser,
  customerId,
) => {
  const uniqueUserController = new UniqueUserController();
  const uniqueUser = await uniqueUserController.findAllUserCustomerMappings(uniqueUserId);
  const user = uniqueUser.Users.find(
    ucm => ucm.uniqueIdentifier
      === (authUser || uniqueUser.DefaultUser.uniqueIdentifier),
  );
  return user;
};

export default userAuthHelper;
