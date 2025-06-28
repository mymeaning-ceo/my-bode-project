import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="hero">
      <h1 className="display-4 mb-3">내의미 업무용 웹앱</h1>
      <p className="lead mb-4">업무 효율을 높이는 간단한 통합 관리 도구입니다.</p>
      <Link to="/login" className="btn btn-primary btn-lg">
        시작하기
      </Link>
    </div>
  );
}

export default Home;
