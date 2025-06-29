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

async function searchPosts(
  db,
  term,
  page = 1,
  limit = 5,
  sortField = 'createdAt',
  sortOrder = -1,
  board = 'default'
) {
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
    { $sort: { [sortField]: sortOrder } },
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
    const postsCol = db.collection(`post_${String(board).replace(/[^a-zA-Z0-9_-]/g, '_')}`);
    [docs, countRes] = await Promise.all([
      postsCol.aggregate(pipeline).toArray(),
      postsCol.aggregate(countPipeline).toArray(),
    ]);
  } catch (err) {
    // Atlas Search may not be enabled (e.g. local MongoDB). Fallback to regex search.
    const regex = new RegExp(escapeRegExp(term), 'i');
    const filter = { $or: [{ title: regex }, { content: regex }] };
    const postsCol = db.collection(`post_${String(board).replace(/[^a-zA-Z0-9_-]/g, '_')}`);
    [docs, countRes] = await Promise.all([
      postsCol
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      postsCol.countDocuments(filter),
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
