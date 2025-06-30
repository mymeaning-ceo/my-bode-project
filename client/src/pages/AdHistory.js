import React, { useEffect, useMemo, useState } from 'react';

// React version of coupangAdd functionality for ad-history
function AdHistory() {
  const initialForm = {
    '날짜': '',
    '광고집행 옵션ID': '',
    '광고집행 상품명': '',
    '노출수': '',
    '클릭수': '',
    '광고비': '',
    '클릭률': '',
  };

  const pageSize = 50;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [file, setFile] = useState(null);
  const [viewMode, setViewMode] = useState('detail'); // detail, product, date
  const [sortCol, setSortCol] = useState('날짜');
  const [sortDir, setSortDir] = useState('asc');
  const [prodSortCol, setProdSortCol] = useState('상품명');
  const [prodSortDir, setProdSortDir] = useState('asc');
  const [dateSortDir, setDateSortDir] = useState('asc');
  const totalPages = Math.ceil(total / pageSize) || 1;

  const loadData = async () => {
    const params = new URLSearchParams({
      start: String((page - 1) * pageSize),
      length: String(pageSize),
      search: keyword,
    });
    const res = await fetch(`/api/coupang-add?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
      setTotal(data.recordsFiltered || 0);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword]);

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
    setPage(1);
    loadData();
  };

  const handleReset = async () => {
    await fetch('/api/coupang-add', { method: 'DELETE', credentials: 'include' });
    setPage(1);
    loadData();
  };

  const changeSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const changeProdSort = (col) => {
    if (prodSortCol === col) {
      setProdSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setProdSortCol(col);
      setProdSortDir('asc');
    }
  };

  const toggleDateSort = () => {
    setDateSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
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

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      const numericCols = ['노출수', '클릭수', '광고비', '클릭률'];
      if (numericCols.includes(sortCol)) {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortCol, sortDir]);

  const sortedProductSummary = useMemo(() => {
    const arr = [...productSummary];
    arr.sort((a, b) => {
      let av = a[prodSortCol];
      let bv = b[prodSortCol];
      const numericCols = ['노출수', '클릭수', '광고비', '클릭률'];
      if (numericCols.includes(prodSortCol)) {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      if (av < bv) return prodSortDir === 'asc' ? -1 : 1;
      if (av > bv) return prodSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [productSummary, prodSortCol, prodSortDir]);

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

  const sortedDateSummary = useMemo(() => {
    const arr = [...dateSummary];
    arr.sort((a, b) => {
      const av = a.날짜;
      const bv = b.날짜;
      if (av < bv) return dateSortDir === 'asc' ? -1 : 1;
      if (av > bv) return dateSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [dateSummary, dateSortDir]);

  return (
    <div className="container">
      <h2>광고 내역</h2>
      <div className="d-flex gap-2 mb-3">
        <form onSubmit={handleUpload} className="d-flex gap-2">
          <input
            type="file"
            className="form-control"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" className="btn btn-success text-nowrap">업로드</button>
        </form>
        <button type="button" className="btn btn-danger text-nowrap" onClick={handleReset}>
          초기화
        </button>
      </div>
      <div className="input-group mb-3">
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
        <button
          className="btn btn-outline-primary text-nowrap"
          onClick={() => {
            setPage(1);
            loadData();
          }}
        >
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
                <th
                  key={key}
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => changeSort(key)}
                  role="button"
                >
                  {key} {sortCol === key && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows
              .filter((row) => row['광고집행 상품명'].includes(keyword))
              .map((row) => (
                <tr key={row._id}>
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
              <th
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => changeProdSort('상품명')}
                role="button"
              >
                상품명 {prodSortCol === '상품명' && (prodSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeProdSort('노출수')} role="button">
                노출수 합 {prodSortCol === '노출수' && (prodSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeProdSort('클릭수')} role="button">
                클릭수 합 {prodSortCol === '클릭수' && (prodSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeProdSort('광고비')} role="button">
                광고비 합 {prodSortCol === '광고비' && (prodSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeProdSort('클릭률')} role="button">
                클릭률(%) {prodSortCol === '클릭률' && (prodSortDir === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProductSummary.map((row) => (
              <tr key={row.상품명}>
                <td style={{ whiteSpace: 'nowrap' }}>{row.상품명}</td>
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
              <th
                style={{ whiteSpace: 'nowrap' }}
                onClick={toggleDateSort}
                role="button"
              >
                날짜 {dateSortDir === 'asc' ? '▲' : '▼'}
              </th>
              <th>광고비 합</th>
            </tr>
          </thead>
          <tbody>
            {sortedDateSummary.map((row) => (
              <tr key={row.날짜}>
                <td>{row.날짜}</td>
                <td>{row.광고비.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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

export default AdHistory;
