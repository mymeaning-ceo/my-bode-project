import React from 'react';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Stock from './pages/Stock';
import Login from './pages/Login';
import Weather from './pages/Weather';
import AverageTemp from './pages/AverageTemp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/weather/average" element={<AverageTemp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
