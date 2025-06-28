import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
  const ptyMap = { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {});

    fetch('/api/weather/daily', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setWeather(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  return (
    <header className="app-header shadow-sm">
      <button type="button" className="btn menu-btn" onClick={onToggleSidebar}>
        ☰
      </button>
      <Link to="/dashboard" className="ms-2 fw-bold brand-link">
        내의미
      </Link>
      <Link to="/help" className="ms-3">도움말</Link>
      {weather && (
        <div className="weather-info ms-3">
          <span>
            {weather.temperature ?? '-'}℃ {skyMap[weather.sky] ?? weather.sky ?? '-'}{' '}
            {ptyMap[weather.precipitationType] ?? weather.precipitationType ?? '-'}
          </span>
        </div>
      )}
      <div className="user-info ms-auto">
        {user && <span className="me-3">{user.name || user.username}</span>}
        <button type="button" className="btn btn-link" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
