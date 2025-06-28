import React from 'react';
import './Header.css';

function Header({ onToggleSidebar }) {
  return (
    <header className="app-header shadow-sm">
      <button type="button" className="btn btn-link" onClick={onToggleSidebar}>
        ☰
      </button>
      <span className="ms-2 fw-bold">내의미</span>
    </header>
  );
}

export default Header;
