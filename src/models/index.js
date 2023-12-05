import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import pkg from 'bluebird';
import { URL } from 'url'; // in Browser, the URL in native accessible on window
import logger from '../logger.js';
import config from '../config.js';

const __filename = new URL('', import.meta.url).pathname;

const { mapSeries } = pkg;
const basename = path.basename(__filename);
const __dirname = new URL('.', import.meta.url).pathname;
const db = {};
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    logging: config.db.logging ? logger.info : false,
    // operatorsAliases: false,
  },
);

// fs.readdirSync(__dirname)
//   .filter(
//     file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js',
//   )
//   .forEach(async file => {
//     const model = (await import(path.join(__dirname, file))).default(
//       sequelize,
//       DataTypes,
//     );
//     db[model.name] = model;
//   });

const dirData = fs
  .readdirSync(__dirname)
  .filter(
    file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js',
  );

await mapSeries(dirData, async file => {
  const modelFile = await import(path.join(__dirname, file));
  if (modelFile) {
    const model = modelFile.default(sequelize, DataTypes);
    db[model.name] = model;
  }
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize
  .sync()
  .then((val) => {
    console.log('syncing database success');
    // Object.keys(val.models).forEach(async modelName => {
    //   await val.models[modelName].sync();
    //   if (val.models[modelName].associate) {
    //     val.models[modelName].associate(val.models);
    //     await val.models[modelName].sync({ alter: true });
    //   }
    // });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

Sequelize.postgres.DECIMAL.parse = value => parseFloat(value);

const { Op } = Sequelize;

export {
  db, sequelize, Sequelize, Op,
};
