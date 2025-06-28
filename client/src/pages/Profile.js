import React, { useEffect, useState } from 'react';
import './Profile.css';

function Profile() {
  const [form, setForm] = useState({ email: '', phone: '', password: '', password2: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm((f) => ({ ...f, email: data.user.email || '', phone: data.user.phone || '' }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setMessage('회원정보가 수정되었습니다.');
      setForm((f) => ({ ...f, password: '', password2: '' }));
    } else {
      setMessage(data.message || '수정 실패');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card card p-4">
        <h3 className="mb-3">회원정보 수정</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">연락처</label>
            <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">새 비밀번호</label>
            <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">비밀번호 확인</label>
            <input type="password" className="form-control" name="password2" value={form.password2} onChange={handleChange} />
          </div>
          <button className="btn btn-primary w-100">수정하기</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
