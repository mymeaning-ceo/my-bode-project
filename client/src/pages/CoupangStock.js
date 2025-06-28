import React, { useEffect, useState } from 'react';

function CoupangStock() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');

  const loadData = async () => {
    const params = new URLSearchParams({
      page: '1',
      limit: '100',
      keyword,
      brand,
    });
    const res = await fetch(`/api/coupang?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container">
      <h2>쿠팡 재고</h2>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="text"
            className="form-control"
            placeholder="브랜드"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div className="col">
          <input
            type="text"
            className="form-control"
            placeholder="검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="col">
          <button className="btn btn-outline-primary w-100" onClick={loadData}>
            검색
          </button>
        </div>
      </div>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>옵션ID</th>
            <th>상품명</th>
            <th>옵션명</th>
            <th>상품상태</th>
            <th>재고량</th>
            <th>30일 판매금액</th>
            <th>30일 판매량</th>
            <th>부족재고량</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row['Option ID']}</td>
              <td className="text-start">{row['Product name']}</td>
              <td className="text-start">{row['Option name']}</td>
              <td>{row['Offer condition']}</td>
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

export default CoupangStock;
