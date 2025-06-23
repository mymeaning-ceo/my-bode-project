const express = require('express');
const router = express.Router();
const { coupangRequest } = require('../../lib/coupangApiClient');

router.get('/', (req, res) => {
  res.render('coupangApiClient.ejs', { result: null, error: null });
});

router.get('/product', async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.render('coupangApiClient.ejs', { result: null, error: '상품 ID가 필요합니다.' });
  }
  try {
    const vendorId = process.env.CP_VENDOR_ID;
    const path = `/v2/providers/openapi/apis/api/v1/vendors/${vendorId}/products/${id}`;
    const data = await coupangRequest('GET', path);
    res.render('coupangApiClient.ejs', { result: JSON.stringify(data, null, 2), error: null });
  } catch (err) {
    res.render('coupangApiClient.ejs', { result: null, error: err.message });
  }
});

module.exports = router;
