const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");

  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log("Environment variables loaded from .env");
  } else {
    console.warn("No .env file found");
  }
}

module.exports = loadEnv;
