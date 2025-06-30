import React, { useEffect, useRef, useState } from 'react';
import './CoupangStock.css';
import { useQueryClient } from '@tanstack/react-query';
import useDebounce from '../hooks/useDebounce';
import useCoupangStocks from '../hooks/useCoupangStocks';

const BRANDS = ['트라이', 'BYC', '제임스딘'];

function CoupangStock() {
  const pageSize = 50;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [sortCol, setSortCol] = useState('Product name');
  const [sortDir, setSortDir] = useState('asc');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();
  const totalPages = Math.ceil(total / pageSize) || 1;

  const debouncedKeyword = useDebounce(keyword, 300);

  const { data, isFetching } = useCoupangStocks({
    page,
    keyword: debouncedKeyword,
    brand,
    sort: sortCol,
    order: sortDir,
  });

  useEffect(() => {
    if (data) {
      setTotal(data.total || 0);
    }
  }, [data]);

  const handleUpload = (e) => {
    e.preventDefault();
    if (fileRef.current.files.length === 0) return;
    const formData = new FormData();
    formData.append('excelFile', fileRef.current.files[0]);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/coupang/upload');
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };
    xhr.onload = () => {
      setUploadProgress(0);
      if (xhr.status === 200) {
        alert('업로드 완료');
        fileRef.current.value = '';
        setPage(1);
        queryClient.invalidateQueries({ queryKey: ['coupangStock'] });
      } else {
        alert('업로드 실패');
      }
    };
    xhr.onerror = () => {
      setUploadProgress(0);
      alert('업로드 실패');
    };
    xhr.send(formData);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('모든 데이터를 삭제하시겠습니까?')) return;
    const res = await fetch('/api/coupang', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      alert('초기화 완료');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['coupangStock'] });
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
    setPage(1);
  };


  return (
    <div className="container">
      <h2>쿠팡 재고</h2>
      <form onSubmit={handleUpload} className="coupang-stock-actions d-flex gap-2 mb-3">
        <input type="file" ref={fileRef} className="form-control" accept=".xlsx,.xls" />
        <button type="submit" className="btn btn-success">엑셀 업로드</button>
        <button type="button" onClick={handleDeleteAll} className="btn btn-danger ms-auto">
          데이터 초기화
        </button>
      </form>
      {uploadProgress > 0 && (
        <div className="progress mb-3" style={{ height: '24px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${uploadProgress}%` }}
          >
            {uploadProgress}%
          </div>
        </div>
      )}
      <div className="row g-2 mb-3 coupang-stock-search align-items-end">
        <div className="col-auto">
          <select
            className="form-select"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setPage(1);
            }}
          >
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
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="col-auto">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              queryClient.invalidateQueries({ queryKey: ['coupangStock'] });
            }}
            className="btn btn-primary text-nowrap"
          >
            검색
          </button>
        </div>
      </div>
      <table className="table table-bordered text-center auto-width coupang-stock-table">
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
          {(data?.data || []).map((row, idx) => (
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
      <nav className="d-flex justify-content-center my-3">
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
          </li>
          {(() => {
            const groupSize = 10;
            const start = Math.floor((page - 1) / groupSize) * groupSize + 1;
            const end = Math.min(start + groupSize - 1, totalPages);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
              <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                <button type="button" className="page-link" onClick={() => setPage(p)}>
                  {p}
                </button>
              </li>
            ));
          })()}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default CoupangStock;
