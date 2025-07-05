const { MongoClient } = require('mongodb');
require('dotenv').config();

async function updateAdHistory() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'testdb';

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const rows = await db
      .collection('coupangAdd')
      .aggregate([
        {
          $group: {
            _id: '$날짜',
            // ensure cost is numeric before summing
            cost: { $sum: { $toDouble: '$광고비' } },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $cond: [
                { $eq: [{ $type: '$_id' }, 'date'] },
                { $dateToString: { format: '%Y%m%d', date: '$_id' } },
                '$_id',
              ],
            },
            cost: 1,
          },
        },
      ])
      .toArray();

    for (const row of rows) {
      await db.collection('adHistory').updateOne(
        { date: row.date },
        { $set: { cost: row.cost, updatedAt: new Date() } },
        { upsert: true },
      );
    }

    console.log(`\u2705 Updated adHistory with ${rows.length} documents`);
  } catch (err) {
    console.error('\u274C update_ad_history failed:', err.message);
  } finally {
    await client.close();
  }
}

updateAdHistory();
