import React, { useEffect, useState } from 'react';

/**
 * 쿠팡 광고비 페이지 - React 버전
 * 엑셀 업로드와 데이터 초기화 기능을 제공하며
 * 서버의 DB 자료를 조회하여 테이블로 보여준다.
 */

function CoupangAdd() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [file, setFile] = useState(null);

  const loadData = async () => {
    const params = new URLSearchParams({ start: '0', length: '1000', search: keyword });
    const res = await fetch(`/api/coupang-add?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('excelFile', file);
    await fetch('/api/coupang-add/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    setFile(null);
    loadData();
  };

  const handleReset = async () => {
    await fetch('/api/coupang-add', { method: 'DELETE', credentials: 'include' });
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container">
      <h2>쿠팡 매출/광고비</h2>
      <form onSubmit={handleUpload} className="mb-3 d-flex gap-2">
        <input
          type="file"
          className="form-control"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" className="btn btn-success">
          엑셀 업로드
        </button>
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          데이터 초기화
        </button>
      </form>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-outline-primary" onClick={loadData}>
          검색
        </button>
      </div>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>날짜</th>
            <th>상품명</th>
            <th>노출수</th>
            <th>클릭수</th>
            <th>광고비</th>
            <th>클릭률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row['날짜']}</td>
              <td className="text-start">{row['광고집행 상품명']}</td>
              <td>{Number(row['노출수'] || 0).toLocaleString()}</td>
              <td>{Number(row['클릭수'] || 0).toLocaleString()}</td>
              <td>{Number(row['광고비'] || 0).toLocaleString()}</td>
              <td>{row['클릭률']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoupangAdd;
