import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

function PostDetail() {
  const { id, shop } = useParams();
  const board = shop || 'default';
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

  const loadPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${id}?board=${board}`, { credentials: 'include' });
    if (res.ok) {
      setPost(await res.json());
    }
  }, [id, board]);

  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/comments/${id}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  const submitComment = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId: id, content: comment }),
    });
    if (res.ok) {
      setComment('');
      loadComments();
    } else if (res.status === 401) {
      alert('로그인이 필요합니다.');
    }
  };

  if (!post) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p className="text-muted">
        {post.username} | {new Date(post.createdAt).toLocaleString()}
      </p>
      <Link to={shop ? `/${shop}/board` : '/board'} className="btn btn-secondary btn-sm mb-3">
        목록
      </Link>
      <div>
        <h5>댓글</h5>
        {comments.map((c) => (
          <div key={c._id} className="border p-2 mb-2">
            <strong>{c.username}</strong>{' '}
            <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
            <p className="mb-0">{c.content}</p>
          </div>
        ))}
        <form onSubmit={submitComment} className="mt-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostDetail;
