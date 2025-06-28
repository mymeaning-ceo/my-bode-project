import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>재고관리 시스템</h1>
      <p>
        <Link to="/stock">재고 페이지로 이동</Link>
      </p>
      <p className="mt-3">
        <Link to="/login">로그인 페이지로 이동</Link>
      </p>
    </div>
  );
}

export default Home;
