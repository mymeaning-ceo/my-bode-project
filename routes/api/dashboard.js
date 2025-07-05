const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/dashboardController');

router.get('/ad-cost-daily', async (req, res) => {
  const db = req.app.locals.db;

  try {
    const data = await db
      .collection('adHistory')
      .aggregate([
        {
          $group: {
            _id: '$date',
            totalCost: { $sum: '$cost' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            totalCost: 1,
          },
        },
      ])
      .toArray();

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: '서버에서 데이터를 조회하는 중 오류가 발생했습니다.' });
  }
});

router.get('/city-temp', ctrl.getCityTempHistory);
router.post('/city-temp', ctrl.saveCityTemp);

module.exports = router;
