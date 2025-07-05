import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

function CityTempChart() {
  const [city, setCity] = useState("seoul");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cities = [
    { label: "서울", value: "seoul" },
    { label: "부산", value: "busan" },
    { label: "대구", value: "daegu" },
    { label: "인천", value: "incheon" },
    { label: "광주", value: "gwangju" },
    { label: "대전", value: "daejeon" },
  ];

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/dashboard/city-temp?city=${city}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [city]);

  const chartData = {
    labels: data.map((d) => d.time.slice(11, 16)),
    datasets: [
      {
        label: "기온(℃)",
        data: data.map((d) => d.temperature),
        borderColor: "rgba(255,99,132,1)",
        backgroundColor: "rgba(255,99,132,0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { callback: (v) => `${v}°` },
      },
    },
  };

  return (
    <div>
      <h3>도시별 기온</h3>
      <div className="mb-2">
        <select
          className="form-select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {loading && <p>Loading…</p>}
      {error && !loading && <p role="alert">{error}</p>}
      {!loading && !error && (
        <div style={{ height: "300px" }}>
          <Line options={options} data={chartData} />
        </div>
      )}
    </div>
  );
}

export default CityTempChart;
