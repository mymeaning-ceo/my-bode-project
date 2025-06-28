import React, { useEffect, useState } from 'react';
import './Header.css';

function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
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
        {user && <span className="me-3">{user.name || user.username}</span>}
        <button type="button" className="btn btn-link" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
