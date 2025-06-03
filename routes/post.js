const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { checkLogin } = require('../middlewares/auth');
const upload = require('../upload.js');

let db;
const connectDB = require('../database');
connectDB.then(client => db = client.db('forum'));

// 글쓰기 페이지
router.get('/write', checkLogin, (req, res) => {
  res.render('write.ejs');
});

// 글 등록
router.post('/add', upload.single('img1'), checkLogin, async (req, res) => {
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

// 글 상세 페이지
router.get('/detail/:id', async (req, res) => {
  try {
    const result = await db.collection('post').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!result) return res.status(404).send('게시물을 찾을 수 없습니다.');
    res.render('detail.ejs', { 글: result });
  } catch (e) {
    console.error('❌ 상세 페이지 오류:', e);
    res.status(404).send('URL 오류');
  }
});

// 글 수정 페이지
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

// 글 수정 처리
router.put('/edit', checkLogin, async (req, res) => {
  try {
    const 수정결과 = await db.collection('post').updateOne(
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

    if (수정결과.matchedCount === 0) {
      return res.status(403).send('수정 권한이 없습니다.');
    }

    res.redirect('/list');
  } catch (e) {
    console.error('❌ 수정 중 오류 발생:', e);
    res.status(500).send('수정 실패');
  }
});

// 글 삭제
router.delete('/delete', checkLogin, async (req, res) => {
  try {
    const postId = req.query.docid;
    if (!ObjectId.isValid(postId)) {
      return res.status(400).send('유효하지 않은 ID입니다.');
    }

    const result = await db.collection('post').deleteOne({
      _id: new ObjectId(postId),
      user: new ObjectId(req.user._id)
    });

    if (result.deletedCount === 0) {
      return res.status(403).send('삭제 권한이 없거나 게시글이 존재하지 않습니다.');
    }

    res.status(200).send('삭제 성공');
  } catch (err) {
    console.error('❌ 삭제 오류:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;
