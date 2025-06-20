const bcrypt = require('bcrypt');
const asyncHandler = require('../middlewares/asyncHandler');

exports.renderProfilePage = asyncHandler(async (req, res) => {
  res.render('profile');
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const { email, phone, password, password2 } = req.body;
  const updates = { email, phone };

  if (password) {
    if (password !== password2) {
      req.flash('error', '비밀번호가 일치하지 않습니다.');
      return res.redirect('/profile');
    }
    updates.password = await bcrypt.hash(password, 10);
  }

  await db.collection('user').updateOne(
    { _id: req.user._id },
    { $set: updates }
  );

  Object.assign(req.user, updates);
  delete req.user.password;

  req.flash('success', '회원정보가 수정되었습니다.');
  res.redirect('/profile');
});
