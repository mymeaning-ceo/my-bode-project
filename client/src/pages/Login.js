import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

/**
 * 로그인 페이지 (React)
 * 기존 EJS 로그인 화면보다 간결한 형태로 구성했습니다.
 */

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || '로그인 실패');
      }
    } catch (err) {
      setError('서버 오류');
    }
  };

  return (
    <div className="login-container">
      <div className="card shadow-sm login-card">
        <div className="card-body">
          <h5 className="card-title mb-4 text-center">로그인</h5>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                아이디
              </label>
              <input
                type="text"
                name="username"
                id="username"
                className="form-control"
                value={form.username}
                onChange={handleChange}
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
                value={form.password}
                onChange={handleChange}
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
