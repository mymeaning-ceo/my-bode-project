const express = require('express');
const router = express.Router();
const { getProgress } = require('../../lib/jobQueue');

router.get('/:id', (req, res) => {
  const progress = getProgress(req.params.id);
  if (progress === null) return res.status(404).json({ progress: null });
  res.json({ progress });
});

module.exports = router;
