import React, { useEffect, useState } from 'react';

function Coupang() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');

  const loadData = async () => {
    const params = new URLSearchParams({ page: '1', limit: '100', keyword });
    const res = await fetch(`/api/coupang?${params.toString()}`, { credentials: 'include' });
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
      <h2>쿠팡 재고</h2>
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
            <th>옵션ID</th>
            <th>상품명</th>
            <th>재고량</th>
            <th>30일 판매금액</th>
            <th>30일 판매량</th>
            <th>부족재고량</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row['Option ID']}</td>
              <td className="text-start">{row['Product name']}</td>
              <td>{Number(row['Orderable quantity (real-time)'] || 0).toLocaleString()}</td>
              <td>{Number(row['Sales amount on the last 30 days'] || 0).toLocaleString()}</td>
              <td>{Number(row['Sales in the last 30 days'] || 0).toLocaleString()}</td>
              <td>{Number(row['Shortage quantity'] || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Coupang;
