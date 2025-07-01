import React, { useState } from 'react';
import DailySalesAmountChart from '../components/DailySalesAmountChart';
import './SalesAmount.css';

function SalesAmount() {
  const [list, setList] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sortCol, setSortCol] = useState('settlementId');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const res = await fetch(`/api/coupang-sales/fetch?${params}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setList(data);
    }
  };

  const sorted = [...list].sort((a, b) => {
    if (sortCol === 'payoutAmount') {
      return sortDir === 'asc'
        ? a.payoutAmount - b.payoutAmount
        : b.payoutAmount - a.payoutAmount;
    }
    return sortDir === 'asc'
      ? String(a[sortCol]).localeCompare(String(b[sortCol]))
      : String(b[sortCol]).localeCompare(String(a[sortCol]));
  });

  const changeSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="container">
      <h2>쿠팡 매출금액</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchData();
        }}
        className="d-flex gap-2 mb-3"
      >
        <input
          type="date"
          className="form-control"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button type="submit" className="btn btn-primary text-nowrap">
          조회
        </button>
      </form>
      {list.length > 0 && (
        <table className="table table-bordered text-center sales-amount-table">
          <thead>
            <tr>
              <th onClick={() => changeSort('settlementId')} role="button">
                정산ID {sortCol === 'settlementId' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => changeSort('payoutAmount')} role="button">
                금액 {sortCol === 'payoutAmount' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th>시작일</th>
              <th>종료일</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.settlementId}>
                <td>{row.settlementId}</td>
                <td>{Number(row.payoutAmount).toLocaleString()}</td>
                <td>{row.startDate}</td>
                <td>{row.endDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <DailySalesAmountChart />
    </div>
  );
}

export default SalesAmount;
