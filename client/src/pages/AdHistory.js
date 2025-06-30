import React, { useEffect, useState } from 'react';

/**
 * 광고 내역을 조회하고 수정할 수 있는 테이블 페이지.
 * 기본 리스트에 검색 및 정렬 기능을 추가한다.
 */

function AdHistory() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ date: '', campaign: '', clicks: '', cost: '' });
  const [keyword, setKeyword] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const loadData = async () => {
    const res = await fetch('/api/ad-history', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const filtered = data.filter((row) =>
        row.campaign.toLowerCase().includes(keyword.toLowerCase()),
      );
      filtered.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
      setRows(filtered);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, sortField, sortDir]);

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
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="캠페인 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-outline-primary" onClick={loadData}>
          검색
        </button>
      </div>
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
            <th
              onClick={() => {
                setSortField('date');
                setSortDir((d) => (sortField === 'date' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
              }}
            >
              날짜 {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              onClick={() => {
                setSortField('campaign');
                setSortDir((d) => (sortField === 'campaign' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
              }}
            >
              캠페인명 {sortField === 'campaign' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              onClick={() => {
                setSortField('clicks');
                setSortDir((d) => (sortField === 'clicks' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
              }}
            >
              클릭수 {sortField === 'clicks' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              onClick={() => {
                setSortField('cost');
                setSortDir((d) => (sortField === 'cost' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
              }}
            >
              광고비 {sortField === 'cost' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row.date}</td>
              <td className="text-start">{row.campaign}</td>
              <td>{Number(row.clicks).toLocaleString()}</td>
              <td>{Number(row.cost).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdHistory;
