import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const routes = [
    { path: '/stock', label: '재고 페이지' },
    { path: '/login', label: '로그인 페이지' },
    { path: '/weather', label: '날씨 정보' },
  ];

  return (
    <div className="container">
      <h1>재고관리 시스템</h1>
      <ul>
        {routes.map((r) => (
          <li key={r.path}>
            <Link to={r.path}>{r.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
