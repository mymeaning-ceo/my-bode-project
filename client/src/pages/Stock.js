import React, { useEffect, useRef, useState } from 'react';
import './Stock.css';

const columnIndex = {
  item_code: 1,
  item_name: 2,
  color: 3,
  size: 4,
  qty: 5,
  allocation: 6,
};

function Stock() {
  const itemCodeRef = useRef(null);
  const itemNameRef = useRef(null);
  const colorRef = useRef(null);
  const sizeRef = useRef(null);
  const qtyRef = useRef(null);
  const allocationRef = useRef(null);
  const [searchItemCode, setSearchItemCode] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchSize, setSearchSize] = useState('');
  const excelFormRef = useRef(null);
  const manageFormRef = useRef(null);

  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [sortCol, setSortCol] = useState('item_code');
  const [sortDir, setSortDir] = useState('asc');

  const fetchData = async () => {
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
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortCol, sortDir, searchItemCode, searchColor, searchSize]);

  const handleSave = async (e) => {
    e.preventDefault();
    const body = {
      item_code: itemCodeRef.current.value.trim(),
      item_name: itemNameRef.current.value.trim(),
      color: colorRef.current.value.trim(),
      size: sizeRef.current.value.trim(),
      qty: Number(qtyRef.current.value) || 0,
      allocation: Number(allocationRef.current.value) || 0,
    };
    const url = editing ? `/api/stock/${editing._id}` : '/api/stock';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (res.ok) {
      fetchData();
    }
    manageFormRef.current.reset();
    setEditing(null);
  };

  const handleCancel = () => {
    manageFormRef.current.reset();
    setEditing(null);
  };

  const handleRowClick = (row) => {
    setEditing(row);
    itemCodeRef.current.value = row.item_code || '';
    itemNameRef.current.value = row.item_name || '';
    colorRef.current.value = row.color || '';
    sizeRef.current.value = row.size || '';
    qtyRef.current.value = row.qty || 0;
    allocationRef.current.value = row.allocation || 0;
  };

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
      alert('업로드 성공!');
      fetchData();
    } else {
      alert('업로드 실패');
    }
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

      <div className="action-form mb-4">
        <form
          ref={excelFormRef}
          className="d-flex gap-2 flex-nowrap"
          encType="multipart/form-data"
          onSubmit={handleUpload}
        >
          <input type="file" name="excelFile" accept=".xlsx,.xls" className="form-control" required />
          <button type="submit" className="btn btn-success btn-upload">엑셀 업로드</button>
        </form>
        <button onClick={handleRefresh} className="btn btn-danger btn-reset ms-2">데이터 초기화</button>
      </div>

      <form ref={manageFormRef} className="row g-2 mb-4 stock-actions" onSubmit={handleSave}>
        <div className="col-sm">
          <input ref={itemCodeRef} className="form-control" placeholder="품번" required />
        </div>
        <div className="col-sm">
          <input ref={itemNameRef} className="form-control" placeholder="품명" required />
        </div>
        <div className="col-sm">
          <input ref={colorRef} className="form-control" placeholder="색상" />
        </div>
        <div className="col-sm">
          <input ref={sizeRef} className="form-control" placeholder="사이즈" />
        </div>
        <div className="col-sm">
          <input ref={qtyRef} type="number" className="form-control" placeholder="수량" />
        </div>
        <div className="col-sm">
          <input ref={allocationRef} type="number" className="form-control" placeholder="할당" />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            {editing ? '수정' : '추가'}
          </button>
        </div>
        {editing && (
          <div className="col-auto">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              취소
            </button>
          </div>
        )}
      </form>

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
        <table className="table table-striped table-hover table-bordered shadow-sm rounded bg-white align-middle text-center stock-table">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th onClick={() => changeSort('item_code')} role="button">
                품번 {sortCol === 'item_code' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('item_name')} role="button">
                품명 {sortCol === 'item_name' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('color')} role="button">
                색상 {sortCol === 'color' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('size')} role="button">
                사이즈 {sortCol === 'size' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('qty')} role="button">
                수량 {sortCol === 'qty' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('allocation')} role="button">
                할당 {sortCol === 'allocation' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r._id}
                onClick={() => handleRowClick(r)}
                className={r.qty < 10 ? 'table-danger' : ''}
              >
                <td>{page * pageSize + idx + 1}</td>
                <td>{r.item_code}</td>
                <td>{r.item_name}</td>
                <td>{r.color}</td>
                <td>{r.size}</td>
                <td>{r.qty}</td>
                <td>{r.allocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
