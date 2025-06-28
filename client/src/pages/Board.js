import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

function Board() {
  const { shop } = useParams();
  const board = shop || 'default';
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPosts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('board', board);
    params.set('page', page);
    if (search) params.set('search', search);
    const res = await fetch(`/api/posts?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(data.data || []);
      setTotal(data.total || 0);
    }
  }, [board, page, search]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/posts/${editingId}` : '/api/posts';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, board }),
    });
    setForm({ title: '', content: '' });
    setEditingId(null);
    loadPosts();
  };

  const startEdit = (post) => {
    setEditingId(post._id);
    setForm({ title: post.title, content: post.content });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE', credentials: 'include' });
    loadPosts();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', content: '' });
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="container">
      <h2>{board} 게시판</h2>
      <div className="mb-3 d-flex">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control me-2"
          placeholder="검색"
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setPage(1);
            loadPosts();
          }}
        >
          검색
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mb-3">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="form-control mb-2"
          placeholder="제목"
          required
        />
        <textarea
          name="content"
          value={form.content}
          onChange={onChange}
          className="form-control mb-2"
          rows="3"
          placeholder="내용"
          required
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? '수정' : '등록'}
        </button>
        {editingId && (
          <button type="button" className="btn btn-secondary ms-2" onClick={cancelEdit}>
            취소
          </button>
        )}
      </form>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post._id}>
              <td className="text-start">{post.title}</td>
              <td>{post.username}</td>
              <td>{new Date(post.createdAt).toLocaleString()}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => startEdit(post)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(post._id)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav className="d-flex justify-content-center">
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            </li>
          ))}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Board;
