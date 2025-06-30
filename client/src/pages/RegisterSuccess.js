import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function RegisterSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="register-container">
      <div className="card shadow-sm register-card text-center p-4">
        <div className="alert alert-success mb-3">
          🎉 회원가입이 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다...
        </div>
        <button onClick={() => navigate('/login')} className="btn btn-primary">
          바로 이동
        </button>
      </div>
    </div>
  );
}

export default RegisterSuccess;
