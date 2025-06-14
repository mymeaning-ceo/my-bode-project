const request = require('supertest');
const app = require('../../../server');

describe('Auth Routes', () => {
  it('GET /login should return 200', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toBe(200);
  });
});