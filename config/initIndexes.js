async function initIndexes(db) {
  try {
    const coupangCollection =
      typeof db.collection === 'function' ? db.collection('coupang') : null;
    if (
      coupangCollection &&
      typeof coupangCollection.createIndex === 'function'
    ) {
      await coupangCollection.createIndex({ 'Product name': 1 });
    }
  } catch (err) {
    console.error('Failed to create indexes:', err.message);
  }
}

module.exports = { initIndexes };
