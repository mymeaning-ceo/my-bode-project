const express = require('express');
const fs = require('fs');
const path = require('path');
const { checkAuth } = require('../../middlewares/auth');

const router = express.Router();
const postController = require('../../controllers/postController');
const routesDir = __dirname;

const protectedRoutes = new Set([
  'stock',
  'admin',
  'board',
  'coupangAdd',
  'post',
  'profile',
  'analytics',
]);

fs.readdirSync(routesDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const modulePath = path.join(routesDir, file);
    const routeModule = require(modulePath);
    const name = path.basename(file, '.js');

    let mountPaths = ['/' + name];
    if (name === 'auth') {
      mountPaths = ['/'];
    } else if (name === 'coupangAdd') {
      mountPaths = ['/coupang/add'];
    } else if (name === 'post') {
      mountPaths = ['/' + name, '/list'];
    } else if (name === 'board') {
      mountPaths = ['/board', '/:shop/board'];
    }

  mountPaths.forEach((mountPath) => {
    if (protectedRoutes.has(name)) {
      router.use(mountPath, checkAuth, routeModule);
    } else {
      router.use(mountPath, routeModule);
    }
  });
});

// 글쓰기 페이지 직접 연결
router.get('/write', checkAuth, postController.renderWritePage);

module.exports = router;
