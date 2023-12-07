import NotificationController from '../controllers/notificationController.js';

const notificationService = {};

notificationService.markRead = async (auth, notificationId) => {
  const values = { read: 1 };
  const notificationController = new NotificationController(auth.customerId);
  let notification;
  if (notificationId) {
    notification = await notificationController.updateById(values, notificationId);
  } else {
    const options = {
      where: {
        userId: 1,
      },
    };
    notification = await notificationController.updateAll(values, options);
  }
  return notification;
};

export default notificationService;
