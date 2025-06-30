import React, { useEffect, useRef, useState } from 'react';
import './Stock.css';

const columns = [
  { key: 'item_code', label: '품번' },
  { key: 'item_name', label: '품명' },
  { key: 'color', label: '색상' },
  { key: 'size', label: '사이즈' },
  { key: 'qty', label: '수량' },
  { key: 'allocation', label: '할당' },
];

const columnIndex = columns.reduce((acc, col, idx) => {
  acc[col.key] = idx + 1;
  return acc;
}, {});

function Stock() {
  const [searchItemCode, setSearchItemCode] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchSize, setSearchSize] = useState('');
  const excelFormRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [sortCol, setSortCol] = useState('item_code');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      start: page * pageSize,
      length: pageSize,
      'order[0][column]': columnIndex[sortCol],
      'order[0][dir]': sortDir,
      item_code: searchItemCode.trim(),
      color: searchColor.trim(),
      size: searchSize.trim(),
    });
    const res = await fetch(`/api/stock?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data);
      setTotal(data.recordsTotal);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [page, sortCol, sortDir, searchItemCode, searchColor, searchSize]);


  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleRefresh = () => {
    setSearchItemCode('');
    setSearchColor('');
    setSearchSize('');
    setPage(0);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(excelFormRef.current);
    const res = await fetch('/stock/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (res.ok) {
      setMessage('업로드 성공!');
      setMessageType('success');
      fetchData();
    } else {
      setMessage('업로드 실패');
      setMessageType('danger');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const totalPages = Math.ceil(total / pageSize);

  const changeSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };
  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">재고 관리</h2>

      {message && (
        <div className={`alert alert-${messageType} fade show`} role="alert">
          {message}
        </div>
      )}

      <div className="action-form mb-4">
        <form
          ref={excelFormRef}
          encType="multipart/form-data"
          onSubmit={handleUpload}
        >
          <input type="file" name="excelFile" accept=".xlsx,.xls" className="form-control" required />
          <button type="submit" className="btn btn-success btn-upload">엑셀 업로드</button>
        </form>
        <button onClick={handleRefresh} className="btn btn-danger btn-reset">데이터 초기화</button>
      </div>


      <div className="row g-3 align-items-end mb-4 stock-search">
        <div className="col-md-3">
          <label htmlFor="itemCode" className="form-label">
            품번
          </label>
          <input
            type="text"
            id="itemCode"
            className="form-control"
            placeholder="품번 입력"
            value={searchItemCode}
            onChange={(e) => {
              setSearchItemCode(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="color" className="form-label">
            색상
          </label>
          <input
            type="text"
            id="color"
            className="form-control"
            placeholder="색상 입력"
            value={searchColor}
            onChange={(e) => {
              setSearchColor(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="size" className="form-label">
            사이즈
          </label>
          <input
            type="text"
            id="size"
            className="form-control"
            placeholder="사이즈 입력"
            value={searchSize}
            onChange={(e) => {
              setSearchSize(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button onClick={handleSearch} className="btn btn-outline-primary">
            검색
          </button>
          <button onClick={handleRefresh} className="btn btn-secondary">
            새로고침
          </button>
        </div>
      </div>

      <div className="table-responsive table-container">
        {loading ? (
          <div className="text-center py-5">로딩 중...</div>
        ) : (
          <table className="table table-bordered shadow-sm rounded bg-white align-middle text-center stock-table">
            <thead className="table-light">
              <tr>
                <th>#</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => changeSort(col.key)}
                    role="button"
                  >
                    {col.label}{' '}
                    {sortCol === col.key && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r._id}>
                  <td>{page * pageSize + idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key}>{r[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <nav className="d-flex justify-content-center align-items-center gap-2">
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </button>
        <span>
          {page + 1} / {totalPages || 1}
        </span>
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </nav>
    </div>
  );
}

export default Stock;
