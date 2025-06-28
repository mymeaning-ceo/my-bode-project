import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {});
    fetch('/api/weather/daily')
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  return (
    <header className="app-header shadow-sm">
      <button type="button" className="btn btn-link" onClick={onToggleSidebar}>
        ☰
      </button>
      <span className="ms-2 fw-bold">내의미</span>
      <div className="user-info ms-auto">
        {weather && (
          <span className="me-3">🌡 {weather.temperature ?? '-'}℃</span>
        )}
        {user && (
          <Link to="/profile" className="me-3 text-decoration-none">
            {user.name || user.username}
          </Link>
        )}
        <button type="button" className="btn btn-link" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
