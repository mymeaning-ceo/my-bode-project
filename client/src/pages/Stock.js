import React, { useEffect, useState, useCallback } from 'react';

function Stock() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ itemCode: '', color: '', size: '' });

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({
      start: '0',
      length: '100',
      item_code: form.itemCode,
      color: form.color,
      size: form.size,
    });
    const res = await fetch(`/api/stock?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.data || []);
    }
  }, [form]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <h2>재고 관리</h2>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            type="text"
            name="itemCode"
            className="form-control"
            placeholder="품번"
            value={form.itemCode}
            onChange={onChange}
          />
        </div>
        <div className="col">
          <input
            type="text"
            name="color"
            className="form-control"
            placeholder="색상"
            value={form.color}
            onChange={onChange}
          />
        </div>
        <div className="col">
          <input
            type="text"
            name="size"
            className="form-control"
            placeholder="사이즈"
            value={form.size}
            onChange={onChange}
          />
        </div>
        <div className="col">
          <button className="btn btn-outline-primary w-100" onClick={loadData}>
            검색
          </button>
        </div>
      </div>

      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>품번</th>
            <th>품명</th>
            <th>색상</th>
            <th>사이즈</th>
            <th>수량</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row.item_code}</td>
              <td>{row.item_name}</td>
              <td>{row.color}</td>
              <td>{row.size}</td>
              <td>{row.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Stock;
