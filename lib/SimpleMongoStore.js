// lib/SimpleMongoStore.js
const session = require("express-session");
const { MongoClient } = require("mongodb");

const MONGO_URL = process.env.DB_URL || "mongodb://localhost:27017";
const DB_NAME = "forum";

let db;

MongoClient.connect(MONGO_URL).then((client) => {
  db = client.db(DB_NAME);
});

class SimpleMongoStore extends session.Store {
  constructor() {
    super();
    this.collection = () => db.collection("sessions");
  }

  async get(sid, callback) {
    try {
      const session = await this.collection().findOne({ _id: sid });
      callback(null, session ? session.session : null);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid, sessionData, callback) {
    try {
      await this.collection().updateOne(
        { _id: sid },
        { $set: { session: sessionData } },
        { upsert: true },
      );
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await this.collection().deleteOne({ _id: sid });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = SimpleMongoStore;
