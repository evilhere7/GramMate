import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(err.message ?? err);

  const status = err.status ?? 500;
  const response = {
    message: err.message ?? 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}
