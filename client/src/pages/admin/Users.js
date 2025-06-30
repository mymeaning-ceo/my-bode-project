import React, { useEffect, useState } from 'react';

function Users() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container">
      <h2 className="mb-3">사용자 관리</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>아이디</th>
            <th>이름</th>
            <th>권한</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.name}</td>
              <td>{u.role || 'user'}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(u._id)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
