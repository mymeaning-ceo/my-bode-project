const express = require('express');
const router = express.Router();

// Return a list of all registered routes on the app
router.get('/', (req, res) => {
  const routes = [];
  req.app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      routes.push({
        path: r.route.path,
        methods: Object.keys(r.route.methods)
          .map((m) => m.toUpperCase())
          .join(', '),
      });
    }
  });
  res.json(routes);
});

module.exports = router;
