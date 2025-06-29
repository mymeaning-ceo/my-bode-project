import React, { useState } from 'react';
import MonthlyWeatherChart from '../MonthlyWeatherChart';

function Weather() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  const handleSearch = async () => {
    setError(null);
    setResult(null);
    try {
      const [y, m, d] = date.split('-');
      const res = await fetch(
        `/api/weather/average?year=${y}&month=${m}&day=${d}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('데이터 없음');
    }
  };

  const handleUpload = async (e) => {
    setUploadMsg(null);
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('excelFile', file);
    const res = await fetch('/api/weather/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    setUploadMsg(res.ok ? '업로드 완료' : '업로드 실패');
    e.target.value = '';
  };

  return (
    <div className="container">
      <h2>날씨 조회</h2>
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
          <button type="button" className="btn btn-primary" onClick={handleSearch}>
            검색
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
      <hr />
      <h2>월별 날씨</h2>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="number"
            className="form-control"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="col">
          <input
            type="number"
            min="1"
            max="12"
            className="form-control"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>
      <MonthlyWeatherChart year={year} month={month} />
      <div className="mt-3">
        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
        {uploadMsg && <p>{uploadMsg}</p>}
      </div>
    </div>
  );
}

export default Weather;
