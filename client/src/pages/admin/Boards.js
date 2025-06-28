import React, { useEffect, useState } from 'react';

function Boards() {
  const [boards, setBoards] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const loadBoards = async () => {
    const res = await fetch('/api/boards', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setBoards(data);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/boards/${editingId}` : '/api/boards';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setForm({ name: '', slug: '', description: '' });
    setEditingId(null);
    loadBoards();
  };

  const startEdit = (board) => {
    setEditingId(board._id);
    setForm({ name: board.name, slug: board.slug, description: board.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/boards/${id}`, { method: 'DELETE', credentials: 'include' });
    loadBoards();
  };

  return (
    <div className="container">
      <h2>게시판 관리</h2>
      <form onSubmit={handleSubmit} className="mb-3">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          className="form-control mb-2"
          placeholder="이름"
          required
        />
        <input
          type="text"
          name="slug"
          value={form.slug}
          onChange={onChange}
          className="form-control mb-2"
          placeholder="슬러그"
          required
        />
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={onChange}
          className="form-control mb-2"
          placeholder="설명"
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
            <th>이름</th>
            <th>슬러그</th>
            <th>설명</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {boards.map((board) => (
            <tr key={board._id}>
              <td>{board.name}</td>
              <td>{board.slug}</td>
              <td>{board.description}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => startEdit(board)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(board._id)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Boards;
