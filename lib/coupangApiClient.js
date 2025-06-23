const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Sign Coupang Open API request
 * @param {string} method HTTP method
 * @param {string} urlPath Path including query string
 * @param {string} secretKey API secret key
 * @param {string} timestamp Unix epoch string
 * @returns {string} signature
 */
function signRequest(method, urlPath, secretKey, timestamp) {
  const message = `${timestamp}${method}${urlPath}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

/**
 * Perform request to Coupang Open API
 * @param {string} method HTTP method
 * @param {string} path API path (without host)
 * @param {object} [options] Optional settings: query, body
 */
async function coupangRequest(method, path, options = {}) {
  const accessKey = process.env.CP_ACCESS_KEY;
  const secretKey = process.env.CP_SECRET_KEY;
  const vendorId = process.env.CP_VENDOR_ID;
  const host = process.env.CP_API_HOST || 'https://api-gateway.coupang.com';

  if (!accessKey || !secretKey || !vendorId) {
    throw new Error('Coupang API credentials are not set');
  }

  const queryStr = options.query
    ? '?' + new URLSearchParams(options.query).toString()
    : '';
  const urlPath = `${path}${queryStr}`;
  const timestamp = Date.now().toString();
  const signature = signRequest(method, urlPath, secretKey, timestamp);

  const headers = {
    Authorization: `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${timestamp}, signature=${signature}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-EXTENDED-VENDOR-ID': vendorId,
  };

  const res = await fetch(host + urlPath, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coupang API error: ${res.status} ${text}`);
  }

  return res.json();
}

module.exports = { coupangRequest };
