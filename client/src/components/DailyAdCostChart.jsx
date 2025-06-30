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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

function DailyAdCostChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard/ad-cost-daily', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  const sliced = data.slice(0, 50);
  const chartData = {
    labels: sliced.map((d) => d.date),
    datasets: [
      {
        label: '광고비',
        data: sliced.map((d) => d.totalCost),
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => v.toLocaleString(),
        },
      },
    },
  };

  return (
    <div>
      <h3>쿠팡 광고비 (일자별)</h3>
      <div style={{ height: '300px' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
}

export default DailyAdCostChart;
