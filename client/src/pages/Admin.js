import React from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

function Admin() {
  return (
    <div className="admin-page">
      <h1 className="mb-3">관리자 메뉴</h1>
      <ul className="admin-menu list-group">
        <li className="list-group-item">
          <Link to="/admin/users">사용자 관리</Link>
        </li>
        <li className="list-group-item">
          <Link to="/admin/permissions">접근 권한 설정</Link>
        </li>
        <li className="list-group-item">
          <Link to="/admin/banner">배너 이미지 관리</Link>
        </li>
        <li className="list-group-item">
          <Link to="/admin/logo">브랜드 로고 관리</Link>
        </li>
      </ul>
    </div>
  );
}

export default Admin;
