const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

function getViewNames() {
  const viewsDir = path.join(__dirname, '../views');
  return fs
    .readdirSync(viewsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.ejs'))
    .map((d) => path.basename(d.name, '.ejs'))
    .filter((name) => !['nav', 'error', 'layouts'].includes(name));
}

exports.listUsers = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const q = req.query.q || '';
    const query = q ? { username: new RegExp(q, 'i') } : {};
    const users = await db.collection('user').find(query).sort({ username: 1 }).toArray();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const userId = req.params.id;
    if (userId) {
      await db.collection('user').deleteOne({ _id: new ObjectId(userId) });
      await db.collection('permissions').updateMany({}, { $pull: { allowedUsers: userId } });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getPermissions = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const views = getViewNames();
    const permsArray = await db.collection('permissions').find({ view: { $in: views } }).toArray();
    const permissions = {};
    permsArray.forEach((p) => {
      permissions[p.view] = { loginRequired: p.loginRequired, allowedUsers: p.allowedUsers || [] };
    });
    const users = await db.collection('user').find().toArray();
    res.json({ views, permissions, users });
  } catch (err) {
    next(err);
  }
};

exports.savePermissions = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const views = getViewNames();
    const selectedViews = req.body.view || [];
    const updates = views.map((v) => {
      const loginRequired = Array.isArray(selectedViews)
        ? selectedViews.includes(v)
        : selectedViews === v;
      let allowed = req.body['user_' + v] || [];
      if (!Array.isArray(allowed)) allowed = allowed ? [allowed] : [];
      return {
        updateOne: {
          filter: { view: v },
          update: { $set: { view: v, loginRequired, allowedUsers: allowed } },
          upsert: true,
        },
      };
    });
    if (updates.length) await db.collection('permissions').bulkWrite(updates);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
