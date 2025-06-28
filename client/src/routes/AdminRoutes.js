import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Admin from '../pages/Admin';
import AdminBanner from '../pages/admin/Banner';
import AdminLogo from '../pages/admin/Logo';
import AdminUsers from '../pages/admin/Users';
import AdminPermissions from '../pages/admin/Permissions';
import AdminBoards from '../pages/admin/Boards';

/**
 * Router for admin pages. This nested router keeps admin related
 * paths grouped together and makes it easy to add new admin pages
 * without touching the top-level App router.
 */
function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Admin />} />
      <Route path="banner" element={<AdminBanner />} />
      <Route path="logo" element={<AdminLogo />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="permissions" element={<AdminPermissions />} />
      <Route path="boards" element={<AdminBoards />} />
      <Route path="*" element={<Navigate to="." />} />
    </Routes>
  );
}

export default AdminRoutes;
