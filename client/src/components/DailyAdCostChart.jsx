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

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: '광고비',
        data: data.map((d) => d.totalCost),
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  return (
    <div>
      <h3>쿠팡 광고비 (일자별)</h3>
      <Bar data={chartData} />
    </div>
  );
}

export default DailyAdCostChart;
