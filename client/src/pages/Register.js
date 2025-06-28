import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('회원가입이 완료되었습니다.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError(data.message || '회원가입 실패');
      }
    } catch (err) {
      setError('서버 오류');
    }
  };

  return (
    <div className="register-container">
      <div className="card shadow-sm register-card">
        <div className="card-body">
          <h5 className="card-title mb-4 text-center">회원가입</h5>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                아이디
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                이름
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                이메일
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={form.email}
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
                className="form-control"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password2" className="form-label">
                비밀번호 확인
              </label>
              <input
                type="password"
                className="form-control"
                id="password2"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              가입하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
