
import UserController from '../controllers/userController.js';

const userService = {};

userService.findAllForListing = async (options) => {
    const userController = new UserController();
    const [purchaseOrders] = await Promise.all([
      userController.findAllForListing(options),
    ]);
    return {
      data: purchaseOrders,
    };
  };


export default userService;
