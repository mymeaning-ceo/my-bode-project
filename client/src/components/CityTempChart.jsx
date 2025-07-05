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

import cityCoords from '../../../data/cityCoords.json';

function CityTempChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cityLabels = Object.fromEntries(
    Object.entries(cityCoords).map(([k, v]) => [k, v.label]),
  );

  const fetchData = () => {
    setLoading(true);
    fetch('/api/dashboard/city-temp', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const chartData = {
    labels: data.map((d) => cityLabels[d.city] || d.city),
    datasets: [
      {
        label: '기온(℃)',
        data: data.map((d) => d.temperature),
        backgroundColor: 'rgba(255,99,132,0.6)',
        borderColor: 'rgba(255,99,132,1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `${v}°` },
      },
    },
  };

  return (
    <div>
      <h3>도시별 기온</h3>
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

export default CityTempChart;
