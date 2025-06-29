import React from 'react';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Stock from './pages/Stock';
import Coupang from './pages/Coupang';
import CoupangAdd from './pages/CoupangAdd';
import CoupangStock from './pages/CoupangStock';
import Login from './pages/Login';
import Register from './pages/Register';
import Weather from './pages/Weather';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './pages/DashboardLayout';
import Board from './pages/Board';
import SalesAmount from './pages/SalesAmount';
import SalesVolume from './pages/SalesVolume';
import Help from './pages/Help';
import AdminRoutes from './routes/AdminRoutes';
import Placeholder from './pages/Placeholder';
import AdHistory from './pages/AdHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/help" element={<Help />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/:shop/board" element={<Board />} />
          <Route path="/sales-amount" element={<SalesAmount />} />
        <Route path="/sales-volume" element={<SalesVolume />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/coupang" element={<Coupang />} />
        <Route path="/coupang/stock" element={<CoupangStock />} />
        <Route path="/coupang-add" element={<CoupangAdd />} />
        <Route path="/ad-history" element={<AdHistory />} />
        <Route path="/:shop/ad-history" element={<AdHistory />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/:shop/:section" element={<Placeholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
