const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const examplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else if (fs.existsSync(examplePath)) {
    require('dotenv').config({ path: examplePath });
  }
}

module.exports = loadEnv;
