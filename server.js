const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000}
}))

app.use(passport.session()) 
app.use((요청, 응답, next) => {
  응답.locals.유저 = 요청.user;  // 모든 ejs에서 유저 변수 사용 가능
  next();
});

let db
const url = 'mongodb+srv://andro3817:qwer1234@cluster0.2whurql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

new MongoClient(url).connect().then((client) => {
  console.log('DB연결성공')
  db = client.db('forum')
  app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
  })
}).catch((err) => {
  console.log(err)
})

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

app.get('/write', (요청, 응답) => {
  응답.render('write.ejs')
})

app.post('/add', async (요청, 응답) => {
  try {
    if (요청.body.title == '') {
      응답.send('제목안적었는데')
    } else {
      await db.collection('post').insertOne({
        title: 요청.body.title,
        content: 요청.body.content
      })
      응답.redirect('/list')
    }
  } catch (e) {
    console.log(e)
    응답.status(500).send('서버에러남')
  }
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
  if (result.password == 입력한비번) {
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



app.get('/login', async (요청, 응답) => {
  console.log(요청.user)
  응답.render('login.ejs')
})

app.post('/login', async (요청, 응답, next) => {

  passport.authenticate('local', (error, user, info) => {
      if (error) return 응답.status(500).json(error)
      if (!user) return 응답.status(401).json(info.message)
      요청.logIn(user, (err) => {
        if (err) return next(err)
        응답.redirect('/')
      })
  })(요청, 응답, next)

}) 

function 로그인했니(요청, 응답, next) {
  if (요청.isAuthenticated()) {
    return next();
  } else {
    응답.redirect('/login');
  }
}

app.get('/mypage', 로그인했니, (요청, 응답) => {
  응답.render('mypage.ejs', { 유저: 요청.user });
});

