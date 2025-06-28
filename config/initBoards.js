const boards = ['내의미', 'TRY', 'BYC', '제임스딘', '쿠팡', '네이버'];

async function initBoards(db) {
  try {
    const coll = db.collection('boards');
    for (const name of boards) {
      const exists = await coll.findOne({ name });
      if (!exists) {
        await coll.insertOne({ name });
      }
    }
    console.log('📢 게시판 초기화 완료');
  } catch (err) {
    console.error('게시판 초기화 실패:', err.message);
  }
}

module.exports = { initBoards, boards };
