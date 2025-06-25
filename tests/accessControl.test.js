jest.setTimeout(60000);

const { checkLogin, checkAdmin } = require('../middlewares/auth');

describe('access control middlewares', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { isAuthenticated: jest.fn(), flash: jest.fn(), user: null };
    res = {
      redirect: jest.fn(),
      status: jest.fn(function () { return this; }),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  test('checkLogin allows authenticated user', () => {
    req.isAuthenticated.mockReturnValue(true);
    checkLogin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('checkLogin redirects unauthenticated user', () => {
    req.isAuthenticated.mockReturnValue(false);
    checkLogin(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });

  test('checkAdmin allows admin user', () => {
    req.isAuthenticated.mockReturnValue(true);
    req.user = { role: 'admin' };
    checkAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('checkAdmin rejects non-admin user', () => {
    req.isAuthenticated.mockReturnValue(true);
    req.user = { role: 'user' };
    checkAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalled();
  });
});
