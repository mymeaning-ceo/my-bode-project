import React from 'react';
import DailyAdCostChart from '../components/DailyAdCostChart';
import CityTempChart from '../components/CityTempChart';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-grid">
      <div className="grid-item">
        <DailyAdCostChart />
      </div>
      <div className="grid-item">
        <CityTempChart />
      </div>
      <div className="grid-item">3</div>
      <div className="grid-item">4</div>
    </div>
  );
}

export default Dashboard;
