import utils from '../../helpers/utils';

import UniqueUserController from '../controllers/uniqueUserController';

const uniqueUserService = {};

uniqueUserService.checkAndCreateUniqueUser = async (values, userId, auth) => {
  const uniqueUserController = new UniqueUserController();
  let uniqueUser = await uniqueUserController.findOneByEmail(values.email.trim());
  if (!uniqueUser) {
    const newUniqueUserValues = utils.copyKeys(values, ['email']);
    newUniqueUserValues.defaultUserId = userId;
    uniqueUser = await uniqueUserController.create(newUniqueUserValues);
  }
  return uniqueUser;
};

export default uniqueUserService;
