function getPostCollection(db, board = 'default') {
  const slug = String(board).replace(/[^a-zA-Z0-9_-]/g, '_') || 'default';
  return db.collection(`post_${slug}`);
}

module.exports = { getPostCollection };
