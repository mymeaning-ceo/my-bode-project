require('dotenv').config();
const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt') 


app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')

// 로그인된 사용자 정보를 EJS에서 사용 가능하도록 설정
app.use((req, res, next) => {
  res.locals.유저 = req.user;
  next();
});


app.use(session({
  resave : false,
  saveUninitialized : false,
  secret: '세션 암호화 비번~~',
  cookie : {maxAge : 60 * 60 * 1000},
  store: MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName: 'forum',
  })
})) 

app.use(passport.initialize())
app.use(passport.session()) 

const { S3Client } = require('@aws-sdk/client-s3')
const upload = require('./upload.js'); // post.js 등에서


app.use((요청, 응답, next) => {
  응답.locals.유저 = 요청.user;  // 모든 ejs에서 유저 변수 사용 가능
  next();
});



let connectDB = require('./database.js')

let db
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} 에서 서버 실행중`);
  });
}).catch((err) => {
  console.log(err)
})


const { checkLogin } = require('./middlewares/auth');
app.get('/secure', checkLogin, (요청, 응답) => {
  응답.send('로그인 사용자') 

})


const path = require('path');

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    // 로그인된 유저 → public/dashboard.html
    return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    // 비로그인 유저 → public/index.html
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
});



app.get('/news', (요청, 응답) => {
  db.collection('post').insertOne({ title: '어쩌구' })
})

app.get('/list', async (요청, 응답) => {
  const limit = 5;
  const page = 1;
  const total = await db.collection('post').countDocuments();
  const totalPage = Math.ceil(total / limit);
  const result = await db.collection('post').find().skip(0).limit(limit).toArray();

  응답.render('list.ejs', {
    글목록: result,
    현재페이지: page,
    전체페이지: totalPage
  });
});


app.get('/time', (요청, 응답) => {
  응답.render('time.ejs', { data: new Date() })
})

app.use('/', require('./routes/post.js'))

app.get(['/list', '/list/:page'], async (요청, 응답) => {
  const page = parseInt(요청.params.page || '1');
  const limit = 5;
  const skip = (page - 1) * limit;

  const total = await db.collection('post').countDocuments();
  const totalPage = Math.ceil(total / limit);

  const result = await db.collection('post')
    .find().skip(skip).limit(limit).toArray();

  응답.render('list.ejs', {
    글목록: result,
    현재페이지: page,
    전체페이지: totalPage
  });
});

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }

  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
  delete result.password
  process.nextTick(() => {
   done(null, result)
  })
})



app.get('/login', (요청, 응답) => {
  응답.render('login.ejs', { redirectTo: 요청.query.redirect || '/' });
})

app.post('/login', (요청, 응답, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return 응답.status(500).json(error);
    if (!user) return 응답.status(401).json(info.message);

    요청.logIn(user, (err) => {
      if (err) return next(err);
      응답.redirect('/dashboard.html');  // ✅ 로그인 후 이동할 페이지
    });
  })(요청, 응답, next);
});



app.get('/mypage', checkLogin, (요청, 응답) => {
  응답.render('mypage.ejs', { 유저: 요청.user });
});


app.get('/register', (요청, 응답) => {
  응답.render('register.ejs')
})

app.post('/register', async (요청, 응답) => {
  const { username, password, password2 } = 요청.body;

  // 비밀번호 불일치 확인
  if (password !== password2) {
    return 응답.status(400).send('비밀번호가 일치하지 않습니다.');
  }

  // 아이디 중복 확인
  let 기존유저 = await db.collection('user').findOne({ username });
  if (기존유저) {
    return 응답.status(400).send('이미 존재하는 아이디입니다.');
  }

  // 비밀번호 해시 후 저장
  let 해시 = await bcrypt.hash(password, 10);
  await db.collection('user').insertOne({
    username,
    password: 해시
  });

  응답.redirect('/');
});


app.get('/logout', (요청, 응답) => {
  요청.logout(() => {
    응답.redirect('/');
  });
});


app.use('/shop', require('./routes/shop.js') )
app.use('/board/sub', require('./routes/board.js') )
app.use('/search', require('./routes/search.js'));
app.use('/stock', require('./routes/stock.js'));
app.use('/', require('./routes/auth.js'));