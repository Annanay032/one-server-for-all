import { db, Op } from '../../models/index.js';
import logger from '../../logger.js';

const masterCurrencyService = {};

masterCurrencyService.findAll = async (options) => {
  const filter = {
    where: options,
    order: [['id', 'ASC']],
  };
  if (options.existingCurrencies) {
    filter.where.id = {
      [Op.notIn]: options.existingCurrencies,
    };
    delete options.existingCurrencies;
  }
  const allcurrencies = await db.Currencies.findAll(filter);
  return allcurrencies;
};

masterCurrencyService.findOne = async (currencyId) => {
  const currencyData = await db.Currencies.findByPk(currencyId);
  return currencyData;
};

masterCurrencyService.getValueInBasePrice = (value, exchangeRate, mathFactor) => {
  let baseValue = 0;
  if (value !== 0) {
    if (mathFactor === 'division') {
      baseValue = value / exchangeRate;
    } else if (mathFactor === 'multiplication') {
      baseValue = value * exchangeRate;
    }
  }
  return baseValue;
};

masterCurrencyService.getValueFromBaseToRequiredCurrency = (value, exchangeRate, mathFactor) => {
  let baseValue = 0;
  if (value !== 0) {
    if (mathFactor === 'division') {
      baseValue = value * exchangeRate;
    } else if (mathFactor === 'multiplication') {
      baseValue = value / exchangeRate;
    }
  }
  return baseValue;
};

export default masterCurrencyService;
