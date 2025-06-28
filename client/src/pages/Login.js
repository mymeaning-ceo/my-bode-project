import React from 'react';
import './Login.css';

/**
 * 로그인 페이지 (React)
 * 기존 EJS 로그인 화면보다 간결한 형태로 구성했습니다.
 */

function Login() {
  return (
    <div className="login-container">
      <div className="card shadow-sm login-card">
        <div className="card-body">
          <h5 className="card-title mb-4 text-center">🔐 로그인</h5>
          <form action="/login" method="POST">
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                아이디
              </label>
              <input
                type="text"
                name="username"
                id="username"
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="form-control"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
