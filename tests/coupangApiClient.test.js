jest.setTimeout(60000);

jest.mock('node-fetch');
const mockFetch = require('node-fetch');
const crypto = require('crypto');

const { coupangRequest } = require('../lib/coupangApiClient');

beforeAll(() => {
  process.env.CP_ACCESS_KEY = 'access';
  process.env.CP_SECRET_KEY = 'secret';
  process.env.CP_VENDOR_ID = 'vendor';
  process.env.CP_API_HOST = 'https://api.example.com';

  jest.spyOn(Date, 'now').mockReturnValue(1600000000000);

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ result: 'ok' }),
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

test('coupangRequest sends signed request and returns data', async () => {
  const data = await coupangRequest('GET', '/test', { query: { a: '1' } });

  const expectedSignature = crypto
    .createHmac('sha256', 'secret')
    .update('1600000000000GET/test?a=1')
    .digest('base64');

  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.com/test?a=1',
    expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: `CEA algorithm=HmacSHA256, access-key=access, signed-date=1600000000000, signature=${expectedSignature}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-EXTENDED-VENDOR-ID': 'vendor',
      }),
    })
  );

  expect(data).toEqual({ result: 'ok' });
});
