import React, { useEffect, useState } from 'react';

function AdHistory() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ date: '', campaign: '', clicks: '', cost: '' });

  const loadData = async () => {
    const res = await fetch('/api/ad-history', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setRows(data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/ad-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setForm({ date: '', campaign: '', clicks: '', cost: '' });
    loadData();
  };

  return (
    <div className="container">
      <h2>광고 내역</h2>
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="row g-2 mb-2">
          <div className="col-auto">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-auto">
            <input
              type="text"
              name="campaign"
              value={form.campaign}
              onChange={onChange}
              className="form-control"
              placeholder="캠페인명"
            />
          </div>
          <div className="col-auto">
            <input
              type="number"
              name="clicks"
              value={form.clicks}
              onChange={onChange}
              className="form-control"
              placeholder="클릭수"
            />
          </div>
          <div className="col-auto">
            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={onChange}
              className="form-control"
              placeholder="광고비"
            />
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary">
              추가
            </button>
          </div>
        </div>
      </form>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>날짜</th>
            <th>캠페인명</th>
            <th>클릭수</th>
            <th>광고비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row.date}</td>
              <td className="text-start">{row.campaign}</td>
              <td>{row.clicks}</td>
              <td>{row.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdHistory;
