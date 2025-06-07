<<<<<<< HEAD


const router = require('express').Router()
const { checkLogin } = require('../middlewares/auth');

router.get('/sports', checkLogin, (요청, 응답) => {
    응답.send('스포츠 게시판')
 })
 
 router.get('/game', checkLogin, (요청, 응답) => {
    응답.send('게임 게시판')
 })

=======


const router = require('express').Router()
const { checkLogin } = require('../middlewares/auth');

router.get('/sports', checkLogin, (요청, 응답) => {
    응답.send('스포츠 게시판')
 })
 
 router.get('/game', checkLogin, (요청, 응답) => {
    응답.send('게임 게시판')
 })

>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57
 module.exports = router 