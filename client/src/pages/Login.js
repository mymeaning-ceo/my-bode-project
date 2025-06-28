import './Login.css';

function Login() {
  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2 className="mb-4 text-center">로그인</h2>
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
  );
}

export default Login;
