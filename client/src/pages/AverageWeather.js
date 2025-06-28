import React, { useState } from 'react';

function AverageWeather() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/weather/average?date=${date.replace(/-/g, '')}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError('데이터 없음');
      setData(null);
    }
  };

  return (
    <div className="container">
      <h2>일 평균 기온</h2>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" onClick={fetchData}>
            조회
          </button>
        </div>
      </div>
      {error && <p>{error}</p>}
      {data && (
        <table className="table">
          <thead>
            <tr>
              <th>평균 기온(℃)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.averageTemperature}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AverageWeather;
