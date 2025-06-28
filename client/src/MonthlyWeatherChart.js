import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MonthlyWeatherChart({ year, month }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/weather/monthly?year=${year}&month=${month}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json.filter((d) => !d.error));
      } catch (e) {
        setError('데이터 없음');
      }
    }
    fetchData();
  }, [year, month]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!data.length) {
    return <p>Loading...</p>;
  }

  const chartData = {
    labels: data.map((d) => d.date.slice(-2)),
    datasets: [
      {
        label: '기온(℃)',
        data: data.map((d) => d.temperature),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} />;
}

export default MonthlyWeatherChart;
