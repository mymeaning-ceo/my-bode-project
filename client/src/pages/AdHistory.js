import React, { useEffect, useState } from 'react';

// React version of coupangAdd functionality for ad-history
function AdHistory() {
  const initialForm = {
    '날짜': '',
    '광고집행 옵션ID': '',
    '광고집행 상품명': '',
    '노출수': '',
    '클릭수': '',
    '광고비': '',
    '클릭률': '',
  };

  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  const loadData = async () => {
    const params = new URLSearchParams({ start: '0', length: '1000', search: keyword });
    const res = await fetch(`/api/coupang-add?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  };

  useEffect(() => {
    loadData();
    // intentionally run only once
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('excelFile', file);
    await fetch('/api/coupang-add/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    setFile(null);
    loadData();
  };

  const handleReset = async () => {
    await fetch('/api/coupang-add', { method: 'DELETE', credentials: 'include' });
    loadData();
  };

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEdit = (row) => {
    setEditId(row._id);
    setForm({ ...row });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editId) return;
    await fetch(`/api/coupang-add/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setEditId(null);
    setForm(initialForm);
    loadData();
  };

  return (
    <div className="container">
      <h2>광고 내역</h2>
      <div className="d-flex gap-2 mb-3">
        <form onSubmit={handleUpload} className="d-flex gap-2">
          <input
            type="file"
            className="form-control"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" className="btn btn-success">
            엑셀 업로드
          </button>
        </form>
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          데이터 초기화
        </button>
      </div>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-outline-primary" onClick={loadData}>
          검색
        </button>
      </div>
      {editId && (
      <form onSubmit={handleUpdate} className="mb-3">
        <div className="row g-2 mb-2">
          {Object.keys(initialForm).map((key) => (
            <div className="col-auto" key={key}>
              <input
                type="text"
                name={key}
                value={form[key]}
                onChange={onChange}
                className="form-control"
                placeholder={key}
              />
            </div>
          ))}
          <div className="col-auto">
            <button type="submit" className="btn btn-primary">
              수정
            </button>
          </div>
        </div>
      </form>
      )}
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            {Object.keys(initialForm).map((key) => (
              <th key={key}>{key}</th>
            ))}
            <th>편집</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((row) => row['광고집행 상품명'].includes(keyword))
            .map((row) => (
              <tr key={row._id}>
                {Object.keys(initialForm).map((key) => (
                  <td key={key}>{row[key]}</td>
                ))}
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => startEdit(row)}
                  >
                    편집
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdHistory;
