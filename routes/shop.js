const router = require('express').Router()

let connectDB = require('./../database.js')

let db

connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
}).catch((err) => {
  console.log(err)
})


router.get('/shirts', (요청, 응답) => {
   응답.send('셔츠 파는 페이지입니다')
})

router.get('/pants', (요청, 응답) => {
   응답.send('바지 파는 페이지입니다')
})

module.exports = router 