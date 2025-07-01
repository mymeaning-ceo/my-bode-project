import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
  Legend,
);

function YearlyWeatherChart({ year }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/weather/yearly-db?year=${year}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('failed');
        const json = await res.json();
        setData(json.filter((d) => d.temperature !== undefined));
      } catch (err) {
        setError('데이터 없음');
      }
    }
    fetchData();
  }, [year]);

  if (error) return <p>{error}</p>;
  if (!data.length) return <p>Loading...</p>;

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const monthAvg = months.map((m) => {
    const temps = data
      .filter((d) => d._id.slice(4, 6) === m && d.temperature !== null)
      .map((d) => Number(d.temperature));
    if (!temps.length) return null;
    const sum = temps.reduce((a, b) => a + b, 0);
    return Number((sum / temps.length).toFixed(1));
  });

  const chartData = {
    labels: months.map((m) => `${m}월`),
    datasets: [
      {
        label: '평균 기온(℃)',
        data: monthAvg,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} />;
}

YearlyWeatherChart.propTypes = {
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default YearlyWeatherChart;
