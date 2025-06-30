import React, { useEffect, useState } from 'react';

function Permissions() {
  const [views, setViews] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [users, setUsers] = useState([]);

  const loadData = async () => {
    const res = await fetch('/api/admin/permissions', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setViews(data.views);
      setPermissions(data.permissions || {});
      setUsers(data.users || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCheckLogin = (view) => {
    setPermissions({
      ...permissions,
      [view]: {
        ...(permissions[view] || {}),
        loginRequired: !(permissions[view]?.loginRequired),
        allowedUsers: permissions[view]?.allowedUsers || [],
      },
    });
  };

  const onToggleUser = (view, userId) => {
    const current = permissions[view]?.allowedUsers || [];
    const exists = current.includes(userId);
    const updated = exists ? current.filter((u) => u !== userId) : [...current, userId];
    setPermissions({
      ...permissions,
      [view]: {
        ...(permissions[view] || {}),
        allowedUsers: updated,
        loginRequired: permissions[view]?.loginRequired || false,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = new URLSearchParams();
    Object.entries(permissions).forEach(([view, perm]) => {
      if (perm.loginRequired) body.append('view', view);
      perm.allowedUsers?.forEach((u) => body.append('user_' + view, u));
    });
    await fetch('/api/admin/permissions', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    loadData();
  };

  return (
    <div className="container">
      <h2 className="mb-3">접근 권한 설정</h2>
      <form onSubmit={handleSubmit}>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>View</th>
              <th>Login Required</th>
              <th>Allowed Users</th>
            </tr>
          </thead>
          <tbody>
            {views.map((v) => {
              const perm = permissions[v] || { allowedUsers: [] };
              return (
                <tr key={v}>
                  <td>{v}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={perm.loginRequired || false}
                      onChange={() => onCheckLogin(v)}
                    />
                  </td>
                  <td>
                    {users.map((u) => (
                      <label key={u._id} className="me-2">
                        <input
                          type="checkbox"
                          className="me-1"
                          checked={perm.allowedUsers.includes(u._id)}
                          onChange={() => onToggleUser(v, u._id)}
                        />
                        {u.username}
                      </label>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="submit" className="btn btn-primary">저장</button>
      </form>
    </div>
  );
}

export default Permissions;
