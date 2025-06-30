import React, { useEffect, useMemo, useState } from 'react';

/**
 * 쿠팡 광고비 페이지 - React 버전
 * 엑셀 업로드와 데이터 초기화 기능을 제공하며
 * 서버의 DB 자료를 조회하여 테이블로 보여준다.
 */

function CoupangAdd() {
  const initialForm = {
    '날짜': '',
    '광고집행 상품명': '',
    '노출수': '',
    '클릭수': '',
    '광고비': '',
    '클릭률': '',
  };

  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [file, setFile] = useState(null);
  const [viewMode, setViewMode] = useState('detail'); // detail, product, date

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

  const trimmedName = (name = '') => {
    const idx = name.indexOf(',');
    return idx >= 0 ? name.slice(0, idx).trim() : name;
  };

  const productSummary = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const key = trimmedName(r['광고집행 상품명']);
      if (!map.has(key)) {
        map.set(key, { 노출수: 0, 클릭수: 0, 광고비: 0 });
      }
      const item = map.get(key);
      item.노출수 += Number(r['노출수']) || 0;
      item.클릭수 += Number(r['클릭수']) || 0;
      item.광고비 += Number(r['광고비']) || 0;
    });
    return Array.from(map.entries()).map(([name, v]) => ({
      상품명: name,
      노출수: v.노출수,
      클릭수: v.클릭수,
      광고비: v.광고비,
      클릭률: v.노출수 ? ((v.클릭수 / v.노출수) * 100).toFixed(2) : '0',
    }));
  }, [rows]);

  const dateSummary = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const key = r['날짜'];
      if (!map.has(key)) {
        map.set(key, { 광고비: 0 });
      }
      map.get(key).광고비 += Number(r['광고비']) || 0;
    });
    return Array.from(map.entries()).map(([date, v]) => ({ 날짜: date, 광고비: v.광고비 }));
  }, [rows]);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container">
      <h2>쿠팡 매출/광고비</h2>
      <form onSubmit={handleUpload} className="mb-3 d-flex gap-2">
        <input
          type="file"
          className="form-control"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" className="btn btn-success">업로드</button>
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          초기화
        </button>
      </form>
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
      <div className="mb-3">
        <button
          type="button"
          className="btn btn-outline-secondary me-2"
          onClick={() => setViewMode('detail')}
        >
          원본 보기
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary me-2"
          onClick={() => setViewMode('product')}
        >
          상품명 통합
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setViewMode('date')}
        >
          일자별 합산
        </button>
      </div>

      {viewMode === 'detail' && (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              {Object.keys(initialForm).map((key) => (
                <th key={key} style={{ whiteSpace: 'nowrap' }}>
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((row) => row['광고집행 상품명'].includes(keyword))
              .map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(initialForm).map((key) => (
                    <td key={key}>{row[key]}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {viewMode === 'product' && (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>상품명</th>
              <th>노출수 합</th>
              <th>클릭수 합</th>
              <th>광고비 합</th>
              <th>클릭률(%)</th>
            </tr>
          </thead>
          <tbody>
            {productSummary.map((row) => (
              <tr key={row.상품명}>
                <td>{row.상품명}</td>
                <td>{row.노출수.toLocaleString()}</td>
                <td>{row.클릭수.toLocaleString()}</td>
                <td>{row.광고비.toLocaleString()}</td>
                <td>{row.클릭률}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewMode === 'date' && (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>날짜</th>
              <th>광고비 합</th>
            </tr>
          </thead>
          <tbody>
            {dateSummary.map((row) => (
              <tr key={row.날짜}>
                <td>{row.날짜}</td>
                <td>{row.광고비.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CoupangAdd;
