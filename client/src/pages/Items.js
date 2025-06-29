import React, { useEffect, useState } from 'react';

function Items() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: '' });
  const [editing, setEditing] = useState(null);

  const fetchItems = async () => {
    const res = await fetch('/api/items', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/items/${editing._id}` : '/api/items';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, price: Number(form.price) }),
      credentials: 'include',
    });
    if (res.ok) {
      setForm({ name: '', price: '' });
      setEditing(null);
      fetchItems();
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price });
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) fetchItems();
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4">Items</h2>
      <form onSubmit={handleSubmit} className="mb-3 d-flex gap-2">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="form-control"
          required
        />
        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="form-control"
          required
        />
        <button className="btn btn-primary" type="submit">
          {editing ? 'Update' : 'Add'}
        </button>
      </form>
      <ul className="list-group">
        {items.map((item) => (
          <li key={item._id} className="list-group-item d-flex justify-content-between">
            <span>
              {item.name} - {item.price}
            </span>
            <span>
              <button
                type="button"
                className="btn btn-sm btn-secondary me-2"
                onClick={() => handleEdit(item)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(item._id)}
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Items;
