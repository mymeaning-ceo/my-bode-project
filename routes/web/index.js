const express = require('express');
const fs = require('fs');
const path = require('path');
const { checkAuth } = require('../../middlewares/auth');

const router = express.Router();
const routesDir = __dirname;

const protectedRoutes = new Set(['stock', 'admin', 'board', 'coupangAdd', 'list', 'post']);

fs.readdirSync(routesDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const modulePath = path.join(routesDir, file);
    const routeModule = require(modulePath);
    const name = path.basename(file, '.js');
    let mountPath = '/' + name;
    if (name === 'auth') mountPath = '/';
    if (name === 'coupangAdd') mountPath = '/coupang/add';

    if (protectedRoutes.has(name)) {
      router.use(mountPath, checkAuth, routeModule);
    } else {
      router.use(mountPath, routeModule);
    }
  });

module.exports = router;
