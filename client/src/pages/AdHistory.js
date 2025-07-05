import React, { useEffect, useMemo, useState } from 'react';
import DailyAdCostChart from '../components/DailyAdCostChart';

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
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState('detail'); // detail, product, date
  const [sortCol, setSortCol] = useState('날짜');
  const [sortDir, setSortDir] = useState('asc');
  const [prodSortCol, setProdSortCol] = useState('상품명');
  const [prodSortDir, setProdSortDir] = useState('asc');
  const [dateSortDir, setDateSortDir] = useState('asc');
  const [productSummary, setProductSummary] = useState([]);
  const [dateSummary, setDateSummary] = useState([]);
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

  const fetchProductSummary = async () => {
    const res = await fetch('/api/coupang-add/summary/product', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setProductSummary(data);
    }
  };

  const fetchDateSummary = async () => {
    const res = await fetch('/api/ad-history/update', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setDateSummary(data);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(t);
  }, [page, keyword]);

  useEffect(() => {
    if (viewMode === 'product') fetchProductSummary();
    if (viewMode === 'date') fetchDateSummary();
  }, [viewMode]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('excelFile', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/coupang-add/upload');
    xhr.withCredentials = true;
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress(percent);
      }
    };
    xhr.onload = () => {
      setUploadProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        alert('업로드 완료');
        setFile(null);
        setPage(1);
        loadData();
        fetchProductSummary();
        fetchDateSummary();
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

  const handleReset = async () => {
    await fetch('/api/coupang-add', { method: 'DELETE', credentials: 'include' });
    alert('초기화 완료');
    setPage(1);
    loadData();
    fetchProductSummary();
    fetchDateSummary();
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
        {uploadProgress > 0 && (
          <div className="progress align-self-center" style={{ width: '150px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
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
                    <td key={key}>
                      {numericFields.includes(key)
                        ? Number(row[key]).toLocaleString()
                        : row[key]}
                    </td>
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
        <>
          <DailyAdCostChart />
          <table className="table table-bordered text-center mt-3">
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
        </>
      )}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}

export default AdHistory;
