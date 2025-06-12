const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { checkLogin } = require('../middlewares/auth');
const upload = require('../upload.js');
const moment = require('moment');

let db;
const connectDB = require('../database');
connectDB.then(client => db = client.db('forum'));

// 🔹 게시글 목록
router.get(['/list', '/list/:page'], checkLogin, async (req, res) => {
  try {
    const page = parseInt(req.params.page || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = req.query.val;
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const total = await db.collection('post').countDocuments(query);
    const totalPage = Math.ceil(total / limit);

    const result = await db.collection('post')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    result.forEach(item => {
      item.createdAtFormatted = moment(item.createdAt).format('YYYY년 MM월 DD일 HH:mm');
    });

    res.render('list.ejs', {
      글목록: result,
      유저: req.user,
      현재페이지: page,
      전체페이지: totalPage,
      '검색어': search || ''
    });
  } catch (e) {
    console.error('❌ 목록 오류:', e);
    res.status(500).send('서버 오류');
  }
});

// 🔹 글쓰기
router.get(['/write', '/list/write'], checkLogin, (req, res) => {
  res.render('write.ejs', { 유저: req.user });
});

router.post(['/add', '/list/add'], upload.single('img1'), checkLogin, async (req, res) => {
  try {
    const imgLocation = req.file ? req.file.location : '';
    await db.collection('post').insertOne({
      title: req.body.title,
      content: req.body.content,
      img: imgLocation,
      user: req.user._id,
      username: req.user.username,
      createdAt: new Date()
    });
    res.redirect('/list');
  } catch (e) {
    console.error('📌 게시글 등록 오류:', e);
    res.status(500).send('서버 오류');
  }
});

// 🔹 게시글 상세 보기
router.get('/detail/:id', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });
    if (!result) return res.status(404).send('게시물을 찾을 수 없습니다.');

    const comments = await db.collection('comment')
      .find({ postId: result._id })
      .sort({ createdAt: 1 })
      .toArray();

    res.render('detail.ejs', {
      게시물: result,
      유저: req.user,
      댓글: comments
    });
  } catch (e) {
    console.error('❌ 상세 페이지 오류:', e);
    res.status(404).send('URL 오류');
  }
});

// 🔹 게시글 수정
router.get('/edit/:id', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('post').findOne({
      _id: new ObjectId(req.params.id),
      user: req.user._id
    });

    if (!result) return res.status(403).send('수정 권한이 없습니다.');
    res.render('edit.ejs', { result });
  } catch (e) {
    console.error('❌ 수정 페이지 오류:', e);
    res.status(500).send('서버 오류');
  }
});

router.put('/edit', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('post').updateOne(
      {
        _id: new ObjectId(req.body.id),
        user: new ObjectId(req.user._id)
      },
      {
        $set: {
          title: req.body.title,
          content: req.body.content
        }
      }
    );

    if (result.matchedCount === 0)
      return res.status(403).send('수정 권한이 없습니다.');

    res.redirect('/list');
  } catch (e) {
    console.error('❌ 수정 중 오류 발생:', e);
    res.status(500).send('수정 실패');
  }
});

// 🔹 게시글 삭제
router.delete('/delete', checkLogin, async (req, res) => {
  try {
    const postId = req.query.docid;
    if (!ObjectId.isValid(postId))
      return res.status(400).send('유효하지 않은 ID입니다.');

    const result = await db.collection('post').deleteOne({
      _id: new ObjectId(postId),
      user: new ObjectId(req.user._id)
    });

    if (result.deletedCount === 0)
      return res.status(403).send('삭제 권한이 없거나 게시글이 존재하지 않습니다.');

    res.status(200).send('삭제 성공');
  } catch (e) {
    console.error('❌ 삭제 오류:', e);
    res.status(500).send('서버 오류');
  }
});

// 🔹 댓글 작성
router.post('/comment/add', checkLogin, async (req, res) => {
  try {
    await db.collection('comment').insertOne({
      postId: new ObjectId(req.body.postId),
      content: req.body.content,
      user: req.user._id,
      username: req.user.username,
      createdAt: new Date()
    });
    res.redirect('/detail/' + req.body.postId);
  } catch (e) {
    console.error('❌ 댓글 등록 오류:', e);
    res.status(500).send('서버 오류');
  }
});

// 🔹 댓글 수정
router.put('/comment/edit', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('comment').updateOne(
      {
        _id: new ObjectId(req.body.id),
        user: req.user._id
      },
      {
        $set: { content: req.body.content }
      }
    );

    if (result.matchedCount === 0)
      return res.status(403).send('수정 권한이 없습니다.');

    res.sendStatus(200);
  } catch (e) {
    console.error('❌ 댓글 수정 오류:', e);
    res.status(500).send('서버 오류');
  }
});

// 🔹 댓글 삭제
router.delete('/comment/delete', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('comment').deleteOne({
      _id: new ObjectId(req.query.id),
      user: req.user._id
    });

    if (result.deletedCount === 0)
      return res.status(403).send('삭제 권한이 없습니다.');

    res.sendStatus(200);
  } catch (e) {
    console.error('❌ 댓글 삭제 오류:', e);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;
