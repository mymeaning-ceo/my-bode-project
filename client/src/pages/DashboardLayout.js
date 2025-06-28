import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './DashboardLayout.css';

function DashboardLayout() {
  const [showSidebar, setShowSidebar] = useState(false);

  const handleToggle = () => {
    setShowSidebar((prev) => !prev);
  };

  return (
    <div className="dashboard-layout">
      <Header onToggleSidebar={handleToggle} />
      {showSidebar && <Sidebar />}
      <main className={`dashboard-main ${showSidebar ? 'with-sidebar' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
