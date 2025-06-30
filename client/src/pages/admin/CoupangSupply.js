import React, { useState, useEffect, useRef } from 'react';

function CoupangSupply() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const fileRef = useRef(null);

  const fetchData = async () => {
    const res = await fetch('/api/coupang-supply', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setItems(data.data);
      setTotal(data.totalStockValue);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileRef.current || fileRef.current.files.length === 0) return;
    const formData = new FormData();
    formData.append('excelFile', fileRef.current.files[0]);
    const res = await fetch('/api/coupang-supply/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (res.ok) {
      fetchData();
      fileRef.current.value = '';
    }
  };

  return (
    <div>
      <h2>쿠팡 공급가 관리</h2>
      <form onSubmit={handleUpload} className="d-flex gap-2 mb-3" encType="multipart/form-data">
        <input type="file" ref={fileRef} className="form-control" accept=".xlsx,.xls" />
        <button type="submit" className="btn btn-success">업로드</button>
        <a href="/api/coupang-supply/download" className="btn btn-secondary">다운로드</a>
      </form>
      <p>총 재고 금액: {total.toLocaleString()} 원</p>
      {items.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Option ID</th>
              <th>Supply Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.optionId}>
                <td>{i.optionId}</td>
                <td>{i.supplyPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CoupangSupply;
