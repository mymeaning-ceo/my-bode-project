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
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
  region : 'ap-northeast-2',
  credentials : {
      accessKeyId : process.env.S3_KEY,
      secretAccessKey : process.env.S3_SECRET,
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'wonhochoi1',
    key: function (요청, file, cb) {
      cb(null, Date.now().toString()) //업로드시 파일명 변경가능
    }
  })
})


app.use((요청, 응답, next) => {
  응답.locals.유저 = 요청.user;  // 모든 ejs에서 유저 변수 사용 가능
  next();
});

let db
const url = process.env.DB_URL;
new MongoClient(url).connect().then((client) => {
  console.log('DB연결성공')
  db = client.db('forum')
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} 에서 서버 실행중`);
  });
}).catch((err) => {
  console.log(err)
})


function 로그인했니(요청, 응답, next) {
  if (요청.isAuthenticated()) {
    return next();
  } else {
    응답.redirect('/login');
  }
}


app.get('/', function (요청, 응답) {
  응답.sendFile(__dirname + '/index.html')
})

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

app.get('/write', 로그인했니, (요청, 응답) => {
  응답.render('write.ejs')
})

app.post('/add', upload.single('img1'), 로그인했니, async (요청, 응답) => {
  console.log('파일:', 요청.file.location); // undefined이면 upload.single 문제
  console.log('본문:', 요청.body);
  await db.collection('post').insertOne({
    title : 요청.body.title,
    content : 요청.body.content,
    img : 요청.file.location
  })

//   try {
//     if (요청.body.title == '') {
//       응답.send('제목안적었는데')
//     } else {
//       await db.collection('post').insertOne({
//         title: 요청.body.title,
//         content: 요청.body.content
//       })
//       응답.redirect('/list')
//     }
//   } catch (e) {
//     console.log(e)
//     응답.status(500).send('서버에러남')
//   }
})

app.get('/detail/:id', async (요청, 응답) => {
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
  }
})

app.get('/edit/:id', async (요청, 응답) => {
  let result = await db.collection('post').findOne({ _id: new ObjectId(요청.params.id) })
  응답.render('edit.ejs', { result: result })
})

app.put('/edit', async (요청, 응답) => {
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

app.delete('/delete', async (요청, 응답) => {
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
    if (error) return 응답.status(500).json(error)
    if (!user) return 응답.status(401).json(info.message)
    요청.logIn(user, (err) => {
      if (err) return next(err)
      응답.redirect(요청.body.redirectTo || '/')
    })
  })(요청, 응답, next)
})



app.get('/mypage', 로그인했니, (요청, 응답) => {
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


