import logger from '../logger.js';

const responseHelper = {};

responseHelper.optionsSuccess = res => {
  res.status(204).send();
};

responseHelper.success = (res, data = null, meta = null) => {
  const ret = {
    success: 1,
  };
  if (data || data === 0) {
    ret.data = data;
  }
  if (meta) {
    ret.meta = meta;
  }
  return res.status(200).json(ret);
};

// for conversation bot
responseHelper.successForConversationChatBot = (res, data = null, meta = null) => {
  const ret = {
    success: 1,
  };
  if (data || data === 0) {
    ret.data = data;
  }
  if (meta) {
    ret.meta = meta;
  }
  return res.status(200).json(data);
};

responseHelper.error = (res, err = null) => {
  const ret = {
    success: 0,
    reason: 'Internal Error',
  };
  if (err) {
    logger.error(err);
    ret.reason = err.message;
  }
  res.status((err && err.httpStatus) || 500).json(ret);
};

export default responseHelper;
