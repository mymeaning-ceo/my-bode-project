import React from 'react';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Stock from './pages/Stock';
import Login from './pages/Login';
import Weather from './pages/Weather';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './pages/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/weather" element={<Weather />} />
        </Route>
    </BrowserRouter>
  );
}

export default App;
