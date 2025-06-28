const { ObjectId } = require('mongodb');

const getPosts = async (req, res) => {
  const db = req.app.locals.db;
  const board = req.params.board;
  try {
    const posts = await db
      .collection('board_posts')
      .find({ board })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(posts);
  } catch (err) {
    console.error('게시글 조회 실패:', err.message);
    res.status(500).json({ error: 'failed' });
  }
};

const addPost = async (req, res) => {
  const db = req.app.locals.db;
  const board = req.params.board;
  const { title, content } = req.body;
  try {
    const result = await db.collection('board_posts').insertOne({
      board,
      title,
      content,
      createdAt: new Date(),
    });
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    console.error('게시글 추가 실패:', err.message);
    res.status(500).json({ error: 'failed' });
  }
};

module.exports = { getPosts, addPost };
