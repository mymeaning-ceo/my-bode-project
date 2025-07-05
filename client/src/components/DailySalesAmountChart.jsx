import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels,
);

function DailySalesAmountChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/coupang-sales', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const labels = data.map((d) => d.settlementId);
  const chartData = {
    labels,
    datasets: [
      {
        label: '정산금액',
        data: data.map((d) =>
          Number(String(d.payoutAmount).replace(/,/g, ''))
        ),
        backgroundColor: 'rgba(153,102,255,0.6)',
        borderColor: 'rgba(153,102,255,1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => Number(v).toLocaleString() },
      },
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (v) => v.toLocaleString(),
      },
    },
  };

  return (
    <div>
      <h3>쿠팡 매출금액</h3>
      {loading && <p>Loading…</p>}
      {error && !loading && <p role="alert">{error}</p>}
      {!loading && !error && (
        <div style={{ height: '300px' }}>
          <Bar options={options} data={chartData} />
        </div>
      )}
    </div>
  );
}

export default DailySalesAmountChart;
