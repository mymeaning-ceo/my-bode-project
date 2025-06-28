const bcrypt = require('bcrypt');
const asyncHandler = require('../middlewares/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }
  const { password, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const db = req.app.locals.db;
  const { email, phone, password, password2 } = req.body;
  const updates = { email, phone };

  if (password) {
    if (password !== password2) {
      return res
        .status(400)
        .json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    updates.password = await bcrypt.hash(password, 10);
  }

  await db.collection('user').updateOne({ _id: req.user._id }, { $set: updates });
  Object.assign(req.user, updates);
  delete req.user.password;

  res.json({ success: true, user: { ...req.user } });
});
