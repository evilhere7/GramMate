import app from './app.js';
import config from './config.js';
import logger from './utils/logger.js';

const port = config.port;

app.listen(port, () => {
  logger.info(`GramMate backend listening on port ${port}`);
});
