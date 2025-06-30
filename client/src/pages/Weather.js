import React, { useState, useRef } from 'react';

function Weather() {
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [dbYear, setDbYear] = useState(now.getFullYear());
  const [dbMonth, setDbMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);

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
    e.preventDefault();
    if (!fileRef.current || fileRef.current.files.length === 0) return;
    const formData = new FormData();
    formData.append('excelFile', fileRef.current.files[0]);
    const res = await fetch('/api/weather/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (res.ok) {
      setUploadMsg('업로드 완료');
      fileRef.current.value = '';
    } else {
      setUploadMsg('업로드 실패');
    }
    setTimeout(() => setUploadMsg(null), 3000);
  };

  const handleDbSearch = async () => {
    const res = await fetch(
      `/api/weather/monthly-db?year=${dbYear}&month=${dbMonth}`,
      { credentials: 'include' },
    );
    if (res.ok) {
      const data = await res.json();
      setRecords(data);
    } else {
      setRecords([]);
    }
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
      <h2>엑셀 업로드</h2>
      <form onSubmit={handleUpload} className="d-flex flex-nowrap gap-2 mb-3" encType="multipart/form-data">
        <input type="file" ref={fileRef} className="form-control" accept=".xlsx,.xls" />
        <button type="submit" className="btn btn-success">업로드</button>
      </form>
      {uploadMsg && <p>{uploadMsg}</p>}
      <h2 className="mt-4">업로드 데이터 조회</h2>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="number"
            className="form-control"
            value={dbYear}
            onChange={(e) => setDbYear(e.target.value)}
          />
        </div>
        <div className="col">
          <input
            type="number"
            min="1"
            max="12"
            className="form-control"
            value={dbMonth}
            onChange={(e) => setDbMonth(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button type="button" className="btn btn-primary" onClick={handleDbSearch}>
            조회
          </button>
        </div>
      </div>
      {records.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>기온</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td>{r.date || r._id}</td>
                <td>{r.temperature ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Weather;
