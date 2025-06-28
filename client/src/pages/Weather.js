import React, { useState } from 'react';
import MonthlyWeatherChart from '../MonthlyWeatherChart';

function Weather() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <div className="container">
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
    </div>
  );
}

export default Weather;
