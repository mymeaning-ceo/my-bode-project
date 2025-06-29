const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'testdb';

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const weatherColl = db.collection('weather');

    const sample = {
      _id: '20250625',
      year: 2025,
      month: 6,
      day: 25,
      temp: 22.5,
      rain: 0.2,
      updatedAt: new Date(),
    };

    await weatherColl.updateOne(
      { _id: sample._id },
      { $set: sample },
      { upsert: true },
    );

    console.log('✅ weather sample inserted or updated');
  } catch (err) {
    console.error('❌ init_weather failed:', err.message);
  } finally {
    await client.close();
  }
}

main();
