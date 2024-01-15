// import sequelize, { Op } from 'sequelize';
import { Server } from 'socket.io';
import { db } from './models/index.js';

let io;
const userData = {};
const socketData = {};
const getNotifications = async (params = {}) => {
  const { page = 1, limit = 20, userId= 1 } = params;
  console.log('sdddddddddddddddddddddddddddddddddsssssssssss', userId, params)
  if (!userData[userId]) {
    userData[userId] = [];
  }
  const filter = {
    where: {
      userId,
    },
    order: [['id', 'DESC']],
  };
  filter.limit = 20;
  if (!isNaN(params.read)) {
    filter.where.read = params.read;
  }
  if (page) {
    filter.offset = 0;
  } else {
    filter.offset = (page - 1) * filter.limit;
  }
  const getCount = options => db.Notification.count(options);
  const notifications = await db.Notification.findAll(filter);
  const count = await getCount({
    where: {
      userId,
      read: 0,
    },
  });
  const totalCount = await getCount({
    where: {
      userId,
    },
  });
  return {
    page,
    count,
    totalCount,
    notifications,
  };
};

const websockets = server => {
  io = new Server(server, {
    pingTimeout: 30000,
    pingInterval: 5000,
    upgradeTimeout: 30000,
    cors: {
      origin: 'http://localhost:3000',
    },
  });
  io.on('connection', socket => {
    console.log('New client connected');
    socket.on('disconnect', () => {
      const userId = socketData[socket.id];
      if (Array.isArray(userData[userId]) && userData[userId].length) {
        userData[userId].splice(userData[userId].indexOf(socket.id), 1);
        if (!userData[userId].length) {
          delete userData[userId];
        }
      }
      // console.log('New client disconnected');
    });
    socket.on('getNotifications', async (params = {}) => {
      // console.log('New client connected666e66666e666666666', params);

      if (!userData[params.userId]) {
        userData[params.userId] = [];
      }
      userData[params.userId].push(socket.id);
      socketData[socket.id] = params.userId;
      const notifications = await getNotifications(params);
      console.log('New client connected66666666666666666', notifications);

      for (const socketId of userData[params.userId]) {
        io.to(socketId).emit('setNotifications', notifications);
      }
    });
  });
};
console.log('New client connected');

const exportObj = {
  websockets,
  io,
  socketData,
  userData,
};

export default exportObj;
