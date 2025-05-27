const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')


app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
app.use(methodOverride('_method')) 



let db
const url = 'mongodb+srv://andro3817:qwer1234@cluster0.2whurql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})
}).catch((err)=>{
  console.log(err)
})

app.get('/', function(요청, 응답) {
  응답.sendFile(__dirname + '/index.html')
})

app.get('/news', (요청, 응답)=>{
  db.collection('post').insertOne({title : '어쩌구'})
  // 응답.send('오늘 비옴')
}) 

app.get('/list', async (요청, 응답) => {
  let result = await db.collection('post').find().toArray()
  // console.log(result[0].title)
  // 응답.send(result[0].title)
  응답.render('list.ejs', { 글목록 : result })
})

app.get('/time', (요청, 응답) => {
  응답.render('time.ejs', { data: new Date() });
});

app.get('/write', (요청, 응답)=>{
  응답.render('write.ejs')
})

app.post('/add', async (요청, 응답) => {
  console.log(요청.body)
  try {
    if (요청.body.title == '') {
      응답.send('제목안적었는데')
    } else {
      await db.collection('post').insertOne({ title : 요청.body.title, content : 요청.body.content })
      응답.redirect('/list') 
    }
  } catch(e) {
    console.log(e)
    응답.status(500).send('서버에러남')
  }

})
app.get('/detail/:id', async (요청, 응답) => {
  try {
    const result = await db.collection('post').findOne({
      _id: new ObjectId(요청.params.id)
    });

    if (!result) {
      return 응답.status(404).send('게시물을 찾을 수 없습니다.');
    }

    응답.render('detail.ejs', { 글 : result });
  } catch (e) {
    console.log(e);
    응답.status(404).send('URL 오류');
  }
});


app.get('/edit/:id', async (요청, 응답) => {
  // await db.collection('post').findOne({_id : 1})
  let result = await db.collection('post').findOne({ _id : new ObjectId(요청.params.id)})
  console.log(result)
  응답.render('edit.ejs', {result : result})
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
    );
    응답.redirect('/list');
  } catch (e) {
    console.error('수정 중 오류 발생:', e);
    응답.status(500).send('❌ 수정 실패');
  }
});

app.delete('/delete', async (요청, 응답) => {
  const id = 요청.query.docid;

  // ❗ 잘못된 ID 방지
  if (!ObjectId.isValid(id)) {
    return 응답.status(400).send('잘못된 ID 형식입니다.');
  }

  try {
    await db.collection('post').deleteOne({
      _id: new ObjectId(id)
    });
    응답.send('삭제 완료');
  } catch (e) {
    console.log(e);
    응답.status(500).send('삭제 실패');
  }
});

