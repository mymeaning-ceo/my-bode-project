async function initIndexes(db) {
  try {
    const coupangCollection = db.collection('coupang');
    if (typeof coupangCollection.createIndex === 'function') {
      await coupangCollection.createIndex({ 'Product name': 1 });
    }
  } catch (err) {
    console.error('Failed to create indexes:', err.message);
  }
}

module.exports = { initIndexes };
