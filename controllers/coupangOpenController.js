const { coupangRequest } = require('../lib/coupangApiClient');
const asyncHandler = require('../middlewares/asyncHandler');

// Fetch product information from Coupang API
exports.getProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const vendorId = process.env.CP_VENDOR_ID;
  const path = `/v2/providers/openapi/apis/api/v1/vendors/${vendorId}/products/${productId}`;
  const data = await coupangRequest('GET', path);
  res.json(data);
});

// Create product via RocketGross
exports.createRocketGrossProduct = asyncHandler(async (req, res) => {
  const vendorId = process.env.CP_VENDOR_ID;
  const path = `/v2/providers/openapi/apis/api/v1/vendors/${vendorId}/rocket-gross/product`;
  const headers = {};

  if (process.env.CP_RG_AUTH_TOKEN) {
    headers['X-ROCKETGROSS-AUTH-TOKEN'] = process.env.CP_RG_AUTH_TOKEN;
  }

  const data = await coupangRequest('POST', path, {
    body: req.body,
    headers,
  });

  res.json(data);
});
