const path = require('path');
const dotenv = require('dotenv');

module.exports = function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  dotenv.config({ path: envPath });
};
