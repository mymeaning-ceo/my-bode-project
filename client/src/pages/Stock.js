import React, { useEffect, useRef, useState, useMemo } from 'react';
import { utils, write, book_new, book_append_sheet } from 'xlsx';
import { saveAs } from 'file-saver';
import './Stock.css';

const transformData = (rows) => {
  const itemCodeMapper = { TMDROM6: 'TMDROMA', TMDROM7: 'TMDROMB' };
  const itemNameMapper = {
    'OM)TRY즈로즈#06': 'OM)TRY즈로즈#0A',
    'OM)TRY즈로즈#07': 'OM)TRY즈로즈#0B',
  };
  const colorMapper = { GA: '회색', UD: '네이비', BK: '검정', AD: '진회색' };

  const groupedData = {};
  rows.forEach((row) => {
    const 품번 = itemCodeMapper[row.item_code] || row.item_code;
    const 품명 = itemNameMapper[row.item_name] || row.item_name;
    const 색상 = colorMapper[row.color?.substring(0, 2)] || row.color;
    const key = `${품번}-${품명}-${색상}-${row.size}-${row.allocation}`;
    if (groupedData[key]) {
      groupedData[key].수량 += Number(row.qty);
    } else {
      groupedData[key] = {
        순번: Object.keys(groupedData).length + 1,
        품번,
        품명,
        색상,
        사이즈: row.size,
        수량: Number(row.qty),
        할당: row.allocation,
      };
    }
  });
  return Object.values(groupedData);
};

const exportToExcel = (data) => {
  const wsData = [
    ['순번', '품번', '품명', '색상', '사이즈', '수량', '할당'],
    ...data.map((d) => [d.순번, d.품번, d.품명, d.색상, d.사이즈, d.수량, d.할당]),
  ];
  const ws = utils.aoa_to_sheet(wsData);
  const colWidths = wsData[0].map((_, idx) =>
    Math.max(...wsData.map((row) => String(row[idx]).length)) + 2,
  );
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  wsData[0].forEach((_, i) => {
    const cell = utils.encode_cell({ r: 0, c: i });
    if (ws[cell]) ws[cell].s = { font: { bold: true } };
  });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'inventory.xlsx');
};

const columns = [
  { key: 'item_code', label: '품번' },
  { key: 'item_name', label: '품명' },
  { key: 'color', label: '색상' },
  { key: 'size', label: '사이즈' },
  { key: 'qty', label: '수량' },
  { key: 'allocation', label: '할당' },
];

const columnIndex = columns.reduce(
  (acc, col, idx) => {
    acc[col.key] = idx + 1;
    return acc;
  },
  { seq: 0 },
);

function Stock() {
  const [searchItemCode, setSearchItemCode] = useState('');
  const [searchItemName, setSearchItemName] = useState('');
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

  const transformedRows = useMemo(() => transformData(rows), [rows]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      start: page * pageSize,
      length: pageSize,
      'order[0][column]': columnIndex[sortCol],
      'order[0][dir]': sortDir,
      item_code: searchItemCode.trim(),
      item_name: searchItemName.trim(),
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
  }, [page, sortCol, sortDir, searchItemCode, searchItemName, searchColor, searchSize]);


  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleRefresh = () => {
    setSearchItemCode('');
    setSearchItemName('');
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
          className="d-flex gap-2 flex-nowrap align-items-end"
        >
          <input
            type="file"
            name="excelFile"
            accept=".xlsx,.xls"
            className="form-control"
            required
          />
          <button type="submit" className="btn btn-success btn-upload">업로드</button>
        </form>
        <button onClick={handleRefresh} className="btn btn-danger btn-reset">초기화</button>
        <button
          type="button"
          className="btn btn-outline-success"
          onClick={() => exportToExcel(transformedRows)}
        >
          엑셀 다운로드
        </button>
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
          <label htmlFor="itemName" className="form-label">상품명</label>
          <input
            type="text"
            id="itemName"
            className="form-control"
            placeholder="상품명 입력"
            value={searchItemName}
            onChange={(e) => {
              setSearchItemName(e.target.value);
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
                <th onClick={() => changeSort('seq')} role="button" className="no-wrap">
                  # 순번{' '}
                  {sortCol === 'seq' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
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
              {transformedRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.순번}</td>
                  <td>{r.품번}</td>
                  <td>{r.품명}</td>
                  <td>{r.색상}</td>
                  <td>{r.사이즈}</td>
                  <td>{r.수량}</td>
                  <td>{r.할당}</td>
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
