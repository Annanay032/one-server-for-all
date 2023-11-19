import result from 'dotenv/config';
import '@babel/register';
import './server.js';

if (result.error) {
  throw result.error;
}
