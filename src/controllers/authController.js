import { db, Op } from '../models/index.js';

class AuthController {
  constructor() {
    this.model = db.UniqueUser;
  }

  findOneByRegistrationToken(token) {
    return this.model.findOne({
      where: {
        registrationToken: token,
      },
      attributes: ['id', 'email',
        'registeredAt', 'registrationToken', 'defaultUserId'],
      include: [{
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'phone', 'customerId'],
        include: [{
          model: db.Customer,
          attributes: ['id', 'name', 'code'],
        }],
      }],
    });
  }

  findOneByResetToken(token) {
    return this.model.findOne({
      where: {
        resetToken: token,
      },
      attributes: ['id', 'email', 'resetToken', 'defaultUserId'],
      include: [{
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'customerId'],
      }],
    });
  }

  findOneByEmailForLogin(email) {
    const filter = {
      where: {
        active: 1,
        email: {
          [Op.iLike]: email,
        },
      },
      include: [{
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'customerId'],
        include: [{
          model: db.Customer,
          attributes: ['id', 'name'],
        }],
      }],
    };
    return this.model.findOne(filter);
  }

  findOneByEmail(email) {
    const filter = {
      where: {
        email: {
          [Op.iLike]: email,
        },
      },
    };
    return this.model.findOne(filter);
  }

  findOneByIdForResetPasswordEmail(uniqueUserId) {
    const filter = {
      where: {
        id: uniqueUserId,
      },
      include: [{
        model: db.User,
        as: 'DefaultUser',
        attributes: ['id', 'name', 'customerId'],
        include: [{
          model: db.Customer,
          attributes: ['id', 'name', 'domain'],
        }],
      }],
    };
    return this.model.findOne(filter);
  }

  updateById(values, uniqueUserId) {
    return this.model.update(values, {
      where: {
        id: uniqueUserId,
      },
    });
  }
}

export default AuthController;
