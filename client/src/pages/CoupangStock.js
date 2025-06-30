import React, { useEffect, useRef, useState } from 'react';

const BRANDS = ['트라이', 'BYC', '제임스딘'];

function CoupangStock() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [sortCol, setSortCol] = useState('Product name');
  const [sortDir, setSortDir] = useState('asc');
  const fileRef = useRef(null);

  const loadData = async () => {
    const params = new URLSearchParams({
      page: '1',
      limit: '100',
      keyword,
      brand,
      sort: sortCol,
      order: sortDir,
    });
    const res = await fetch(`/api/coupang?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (fileRef.current.files.length === 0) return;
    formData.append('excelFile', fileRef.current.files[0]);
    const res = await fetch('/api/coupang/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (res.ok) {
      loadData();
    } else {
      alert('업로드 실패');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('모든 데이터를 삭제하시겠습니까?')) return;
    const res = await fetch('/api/coupang', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      loadData();
    } else {
      alert('삭제 실패');
    }
  };

  const changeSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [keyword, brand, sortCol, sortDir]);

  return (
    <div className="container">
      <h2>쿠팡 재고</h2>
      <form onSubmit={handleUpload} className="d-flex gap-2 mb-3">
        <input type="file" ref={fileRef} className="form-control" accept=".xlsx,.xls" />
        <button type="submit" className="btn btn-success">엑셀 업로드</button>
        <button type="button" onClick={handleDeleteAll} className="btn btn-danger ms-auto">
          데이터 초기화
        </button>
      </form>
      <div className="row g-2 mb-3">
        <div className="col">
          <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">전체 브랜드</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
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
      </div>
      <table className="table table-bordered text-center auto-width">
        <thead>
          <tr>
            <th onClick={() => changeSort('Option ID')} role="button">
              옵션ID {sortCol === 'Option ID' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Product name')} role="button">
              상품명 {sortCol === 'Product name' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Option name')} role="button">
              옵션명 {sortCol === 'Option name' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Offer condition')} role="button">
              상품상태 {sortCol === 'Offer condition' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Orderable quantity (real-time)')} role="button">
              재고량 {sortCol === 'Orderable quantity (real-time)' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Sales amount on the last 30 days')} role="button">
              30일 판매금액 {sortCol === 'Sales amount on the last 30 days' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Sales in the last 30 days')} role="button">
              30일 판매량 {sortCol === 'Sales in the last 30 days' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => changeSort('Shortage quantity')} role="button">
              부족재고량 {sortCol === 'Shortage quantity' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
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
