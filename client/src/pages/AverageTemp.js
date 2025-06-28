import React, { useState } from 'react';

function AverageTemp() {
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);
    setResult(null);
    try {
      const [year, month, day] = date.split('-');
      const res = await fetch(
        `/api/weather/average?year=${year}&month=${month}&day=${day}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('데이터 없음');
    }
  };

  return (
    <div className="container">
      <h2>평균 기온 조회</h2>
      <div className="row g-2 mb-3">
        <div className="col-auto">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" onClick={handleSearch}>
            조회
          </button>
        </div>
      </div>
      {error && <p>{error}</p>}
      {result && !error && (
        <table className="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>평균 기온(℃)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{result.date}</td>
              <td>{result.averageTemperature}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AverageTemp;
