import React, { useEffect, useMemo, useState } from 'react';
import SalesAdSummaryChart from '../components/SalesAdSummaryChart';

function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetch('/api/dashboard/sales-ad-summary', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const changeSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDir]);

  return (
    <div className="container">
      <h2>매출 및 광고비 요약</h2>
      <SalesAdSummaryChart data={sorted} />
      {loading && <p>Loading…</p>}
      {error && !loading && <p role="alert">{error}</p>}
      {!loading && !error && (
        <table className="table table-bordered text-center mt-4">
          <thead>
            <tr>
              <th
                className="text-nowrap"
                role="button"
                onClick={() => changeSort('date')}
              >
                날짜 {sortField === 'date' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="text-nowrap"
                role="button"
                onClick={() => changeSort('sales')}
              >
                매출 {sortField === 'sales' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="text-nowrap"
                role="button"
                onClick={() => changeSort('adCost')}
              >
                광고비 {sortField === 'adCost' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.date}>
                <td className="text-nowrap">{row.date}</td>
                <td>{row.sales.toLocaleString()}</td>
                <td>{row.adCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Analytics;
