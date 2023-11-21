import http from 'http';
import app from './app.js';
import config from './config.js';
import logger from './logger.js';
import exportObj from './socket.js';

const { websockets} = exportObj;
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (Number.isNaN(+val)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port = normalizePort(process.env.PORT || config.app.port);
const env = process.env.NODE_ENV || 'development';

app.set('port', port);

const server = http.createServer(app);
logger.info(`***** START | Env: ${env} *****e`);
websockets(server);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}

// // Socket.IO event handling
// io.on('connection', (socket) => {
//   console.log('A user connected');
//   // Add your Socket.IO event handlers here
// });

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
