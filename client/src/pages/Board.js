import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const boardMap = {
  try: 'TRY',
  byc: 'BYC',
  'james-dean': '제임스딘',
  coupang: '쿠팡',
  naver: '네이버',
};

function Board() {
  const { brand } = useParams();
  const boardName = brand ? boardMap[brand] : '내의미';
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadPosts = async () => {
    const res = await fetch(`/api/board/${boardName}/posts`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [boardName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`/api/board/${boardName}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    setTitle('');
    setContent('');
    loadPosts();
  };

  return (
    <div>
      <h2>{boardName} 게시판</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
        />
        <br />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
        />
        <br />
        <button type="submit">등록</button>
      </form>
      <ul>
        {posts.map((p) => (
          <li key={p._id}>
            <strong>{p.title}</strong>
            <p>{p.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Board;
