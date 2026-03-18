/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import Admin from './pages/Admin';
import AdminSpaces from './pages/AdminSpaces';
import AdminBookings from './pages/AdminBookings';
import AdminMembers from './pages/AdminMembers';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import UserMembership from './pages/UserMembership';
import UserSpaces from './pages/UserSpaces';
import UserMembers from './pages/UserMembers';
import UserInvoices from './pages/UserInvoices';
import UserSettings from './pages/UserSettings';
import { useEffect } from 'react';

// 1. สร้าง Component สำหรับดักจับ Route (Protected Route)
function ProtectedRoute({ requireAdmin }: { requireAdmin?: boolean }) {
  // ดึงสิทธิ์จาก localStorage ที่ตั้งไว้ตอน Login
  const userRole = localStorage.getItem('userRole');

  // ถ้ายังไม่มี Role (ยังไม่ Login) ให้เด้งไปหน้า Login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // ถ้าหน้านี้ต้องการสิทธิ์ Admin แต่ Role ไม่ใช่ Admin ให้เด้งไปหน้า Dashboard
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // ถ้าผ่านเงื่อนไขหมด แสดงว่ามีสิทธิ์ ให้แสดงผลหน้า Component นั้นได้ตามปกติ (Outlet)
  return <Outlet />;
}

function ThemeManager() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isAdmin]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ThemeManager />
      <Routes>
        {/* Public Routes - ใครก็เข้าได้ */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected Routes - ต้อง Login ก่อนถึงจะเข้าข้างในนี้ได้ */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            
            {/* User Routes - เข้าได้ทั้ง User และ Admin */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/spaces" element={<UserSpaces />} />
            <Route path="/book" element={<Book />} />
            <Route path="/members" element={<UserMembers />} />
            <Route path="/membership" element={<UserMembership />} />
            <Route path="/invoices" element={<UserInvoices />} />
            <Route path="/settings" element={<UserSettings />} />

            {/* Admin Routes - ซ้อน ProtectedRoute อีกชั้น ให้เฉพาะ Admin เข้าได้เท่านั้น */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/spaces" element={<AdminSpaces />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

          </Route>
        </Route>
      </Routes>
    </Router>
  );
}