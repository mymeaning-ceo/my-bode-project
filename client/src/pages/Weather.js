import React from 'react';
import WeatherTable from '../Weather';

function Weather() {
  return (
    <div className="container my-4">
      <h2 className="mb-3">🌤️ 오늘 날씨</h2>
      <WeatherTable />
    </div>
  );
}

export default Weather;
