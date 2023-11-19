import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

import { URL } from 'url'; // in Browser, the URL in native accessible on window
import logger from '../logger.js';
import config from '../config.js';

const __filename = new URL('', import.meta.url).pathname;

const basename = path.basename(__filename);
const __dirname = new URL('.', import.meta.url).pathname;
console.log('fffff', __filename, __dirname, basename);
const db = {};
const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  dialect: config.db.dialect,
  logging: config.db.logging ? logger.info : true,
  operatorsAliases: false,
});

// sequelize.authenticate().then(() => {
//   console.log('sssssssssssssssss')
// }).catch((err) => {
//   console.log('errsssssssssssssssss', err)

// })

fs.readdirSync(__dirname).filter(file => (
  (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
)).forEach(async file => {
  const module = await import(path.join(__dirname, file));
  const model = module.default(sequelize, DataTypes);
  console.log('fffff33rrr3model', model, model.name);
  // model.sync().then(() => {
  //   console.log('sssssssssssssssss')
  // }).catch((err) => {
  //   console.log('errsssssssssssssssss', err)
  
  // })
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.sync().then(() => {
    console.log('sssssssssssssssss3333333333')
  }).catch(err => {
  logger.error(err);
});

Sequelize.postgres.DECIMAL.parse = value => parseFloat(value);

const { Op } = Sequelize;
console.log('fffff33rrr3Sequelize', db, Sequelize);

export {
  db,
  sequelize,
  Sequelize,
  Op,
};
