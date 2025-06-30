import React from 'react';
import DailyAdCostChart from '../components/DailyAdCostChart';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-grid">
      <div className="grid-item">
        <DailyAdCostChart />
      </div>
      <div className="grid-item">2</div>
      <div className="grid-item">3</div>
      <div className="grid-item">4</div>
    </div>
  );
}

export default Dashboard;
