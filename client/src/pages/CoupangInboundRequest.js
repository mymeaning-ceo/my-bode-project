import { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import useCoupangStocks from '../hooks/useCoupangStocks';
import './CoupangStock.css';

function CoupangInboundRequest() {
  const pageSize = 50;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [threshold, setThreshold] = useState(0);
  const [sortCol, setSortCol] = useState('Sales in the last 30 days');
  const [sortDir, setSortDir] = useState('desc');
  const debouncedThreshold = useDebounce(threshold, 300);

  const { data, isFetching } = useCoupangStocks({
    page,
    sort: sortCol,
    order: sortDir,
    shortage: true,
  });

  useEffect(() => {
    if (data) setTotal(data.total || 0);
  }, [data]);

  const totalPages = Math.ceil(total / pageSize) || 1;

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
      <h2>입고 요청</h2>
      <div className="d-flex gap-2 align-items-end mb-3">
        <div>
          <label htmlFor="threshold" className="form-label mb-0 me-1">
            재고 임계값
          </label>
          <input
            id="threshold"
            type="number"
            className="form-control d-inline-block"
            style={{ width: '6rem' }}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
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
            <th onClick={() => changeSort('Shortage quantity')} role="button">
              부족재고량 {sortCol === 'Shortage quantity' && (sortDir === 'asc' ? '▲' : '▼')}
            </th>
          </tr>
        </thead>
        <tbody>
          {(data?.data || []).map((row, idx) => {
            const shortage = Number(row['Shortage quantity'] || 0);
            return (
              <tr key={idx} className={shortage > debouncedThreshold ? 'table-danger' : ''}>
                <td>{row['Option ID']}</td>
                <td className="text-start">{row['Product name']}</td>
                <td className="text-start">{row['Option name']}</td>
                <td>{row['Offer condition']}</td>
                <td>{Number(row['Orderable quantity (real-time)'] || 0).toLocaleString()}</td>
                <td>{shortage.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isFetching && <div className="text-center py-2">로딩 중...</div>}
      {totalPages > 1 && (
        <nav className="d-flex justify-content-center my-3">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
              <button className="page-link" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                다음
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default CoupangInboundRequest;
