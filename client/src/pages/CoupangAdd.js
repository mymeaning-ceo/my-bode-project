import React, { useEffect, useState } from 'react';

function CoupangAdd() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');

  const loadData = async () => {
    const params = new URLSearchParams({ start: '0', length: '100', search: keyword });
    const res = await fetch(`/api/coupang-add?${params.toString()}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container">
      <h2>쿠팡 매출/광고비</h2>
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
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>날짜</th>
            <th>상품명</th>
            <th>노출수</th>
            <th>클릭수</th>
            <th>광고비</th>
            <th>클릭률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row['날짜']}</td>
              <td className="text-start">{row['광고집행 상품명']}</td>
              <td>{Number(row['노출수'] || 0).toLocaleString()}</td>
              <td>{Number(row['클릭수'] || 0).toLocaleString()}</td>
              <td>{Number(row['광고비'] || 0).toLocaleString()}</td>
              <td>{row['클릭률']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoupangAdd;
