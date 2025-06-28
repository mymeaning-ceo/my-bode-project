import { useEffect, useState } from 'react';

function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather/daily');
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await res.json();
        setWeather(data);
      } catch (e) {
        setError('데이터 없음');
      }
    }
    fetchWeather();
  }, []);

  const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
  const ptyMap = { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>기온(℃)</th>
          <th>하늘상태</th>
          <th>강수형태</th>
        </tr>
      </thead>
      <tbody>
        {error && (
          <tr>
            <td colSpan="3">{error}</td>
          </tr>
        )}
        {weather && !error && (
          <tr>
            <td>{weather.temperature ?? '-'}</td>
            <td>{skyMap[weather.sky] ?? weather.sky ?? '-'}</td>
            <td>{ptyMap[weather.precipitationType] ?? weather.precipitationType ?? '-'}</td>
          </tr>
        )}
        {!weather && !error && (
          <tr>
            <td colSpan="3">Loading...</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default Weather;
