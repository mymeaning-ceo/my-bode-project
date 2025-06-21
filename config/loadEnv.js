const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const examplePath = path.join(__dirname, "..", ".env.example");

  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log("Environment variables loaded from .env");
  } else if (fs.existsSync(examplePath)) {
    require("dotenv").config({ path: examplePath });
    console.log("Environment variables loaded from .env.example");
  } else {
    console.warn("No environment file found");
  }
}

module.exports = loadEnv;
