const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { checkLogin } = require('../middlewares/auth')

let db
const connectDB = require('../database')
connectDB.then((client) => {
  db = client.db('forum')
})

const upload = require('../upload.js');

router.get('/write', checkLogin, (요청, 응답) => {
    응답.render('write.ejs')
  })
  
  router.post('/add', upload.single('img1'), checkLogin, async (요청, 응답) => {
    console.log('파일:', 요청.file.location); // undefined이면 upload.single 문제
    console.log('본문:', 요청.body);
    await db.collection('post').insertOne({
      title : 요청.body.title,
      content : 요청.body.content,
      img : 요청.file.location
    })
  })
  
  router.get('/detail/:id', async (요청, 응답) => {
    try {
      const result = await db.collection('post').findOne({
        _id: new ObjectId(요청.params.id)
      })
  
      if (!result) {
        return 응답.status(404).send('게시물을 찾을 수 없습니다.')
      }
  
      응답.render('detail.ejs', { 글: result })
    } catch (e) {
      console.log(e)
      응답.status(404).send('URL 오류')
      console.log('요청 ID:', 요청.params.id);
      console.log('조회 결과:', result);
    
    }
  })


  router.get('/edit/:id', async (요청, 응답) => {
    let result = await db.collection('post').findOne({ _id: new ObjectId(요청.params.id) })
    응답.render('edit.ejs', { result: result })
  })
  
  router.put('/edit', async (요청, 응답) => {
    try {
      await db.collection('post').updateOne(
        { _id: new ObjectId(요청.body.id) },
        {
          $set: {
            title: 요청.body.title,
            content: 요청.body.content
          }
        }
      )
      응답.redirect('/list')
    } catch (e) {
      console.error('수정 중 오류 발생:', e)
      응답.status(500).send('❌ 수정 실패')
    }
  })
  
  router.delete('/delete', async (요청, 응답) => {
    const id = 요청.query.docid
  
    if (!ObjectId.isValid(id)) {
      return 응답.status(400).send('잘못된 ID 형식입니다.')
    }
  
    try {
      await db.collection('post').deleteOne({ _id: new ObjectId(id) })
      응답.send('삭제 완료')
    } catch (e) {
      console.log(e)
      응답.status(500).send('삭제 실패')
    }
  })

  module.exports = router
