const escapeHtml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function highlight(text = '', term = '') {
  const regex = new RegExp(escapeRegExp(term), 'gi');
  return escapeHtml(text).replace(regex, (m) => `<mark>${m}</mark>`);
}

async function searchPosts(db, term, page = 1, limit = 5) {
  const skip = (page - 1) * limit;
  const pipeline = [
    {
      $search: {
        index: 'title_index',
        text: {
          query: term,
          path: ['title', 'content'],
          fuzzy: { maxEdits: 1 },
        },
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];
  const countPipeline = [
    {
      $search: {
        index: 'title_index',
        text: {
          query: term,
          path: ['title', 'content'],
        },
      },
    },
    { $count: 'total' },
  ];

  let docs, countRes;
  try {
    [docs, countRes] = await Promise.all([
      db.collection('post').aggregate(pipeline).toArray(),
      db.collection('post').aggregate(countPipeline).toArray(),
    ]);
  } catch (err) {
    // Atlas Search may not be enabled (e.g. local MongoDB). Fallback to regex search.
    const regex = new RegExp(escapeRegExp(term), 'i');
    const filter = { $or: [{ title: regex }, { content: regex }] };
    [docs, countRes] = await Promise.all([
      db.collection('post').find(filter).skip(skip).limit(limit).toArray(),
      db.collection('post').countDocuments(filter),
    ]);
    countRes = [{ total: countRes }];
  }

  const total = countRes[0]?.total || 0;
  const totalPage = Math.ceil(total / limit);

  docs.forEach((d) => {
    d.titleHighlighted = highlight(d.title, term);
    d.contentHighlighted = highlight(d.content, term);
  });

  return { docs, totalPage, totalCount: total };
}

module.exports = { searchPosts };
