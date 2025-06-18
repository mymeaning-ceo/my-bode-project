module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error.ejs', {
    message: '서버 오류가 발생했습니다.',
  });
};
