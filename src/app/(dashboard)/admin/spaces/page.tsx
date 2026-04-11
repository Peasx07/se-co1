'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building, Plus, Trash2, Edit, X, Clock, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Alert from '@/components/Alert';
import { validateThaiTelephone } from '@/lib/telephoneValidation';

// เพิ่มฟิลด์ที่ตกหล่นใน Interface เพื่อให้แก้ไขฟอร์มได้ครบถ้วน
interface Coworking {
  _id: string;
  name: string;
  address: string;
  telephone?: string;
  price_per_hour: number;
  openTime?: string;
  closeTime?: string;
  status: string;
  type: string;
}

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState<Coworking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // States สำหรับ Create
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // States สำหรับ Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Coworking | null>(null);

  // States สำหรับ Delete Confirmation (เพิ่มใหม่)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  //สำหรับเรียกใช้ Alert งับ
  const [alert, setAlert] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-august-pen-gay.onrender.com/api/v1';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('userRole') === 'admin');
    }
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const res = await axios.get(`${API_URL}/coworkings`);
      setSpaces(res.data.data);
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError('ไม่สามารถดึงข้อมูลสถานที่ได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการปิด Modal เพิ่มข้อมูล
  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setCreateError('');
    setCreating(false);
  }, []);

  // จัดการการปิด Modal แก้ไขข้อมูล
  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditError('');
    setEditing(false);
    setEditingSpace(null);
  }, []);

  // ฟังก์ชันจัดการ Modal ยืนยันการลบ (เพิ่มใหม่)
  const openDeleteModal = (id: string) => {
    setSpaceToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setSpaceToDelete(null);
    setIsDeleting(false);
  }, []);

  // รองรับการกดปุ่ม ESC เพื่อปิด Modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addModalOpen) closeAddModal();
        if (editModalOpen) closeEditModal();
        if (deleteModalOpen) closeDeleteModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addModalOpen, editModalOpen, deleteModalOpen, closeAddModal, closeEditModal, closeDeleteModal]);

  // ฟังก์ชันลบข้อมูล (แก้ไขให้ทำงานร่วมกับ Modal และ Alert ของคุณ)
  const confirmDelete = async () => {
    if (!spaceToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/coworkings/${spaceToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchSpaces();
      closeDeleteModal();
      
      // เรียกใช้ Alert เมื่อลบสำเร็จ
      setAlert({
        message: 'Deleted successfully 🎉',
        type: 'error' // เปลี่ยนจาก 'success' เป็น 'error' เพื่อให้แสดงพื้นหลังสีแดง
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      console.error('Delete error:', err);
      setAlert({
        message: 'cannot delete: ' + (ax.response?.data?.message || 'An error occurred.'),
        type: 'error'
      });
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // ฟังก์ชันเปิด Modal แก้ไขและดึงข้อมูลเดิมมาใส่
  const openEditModal = (space: Coworking) => {
    setEditingSpace(space);
    setEditError('');
    setEditModalOpen(true);
  };

  // ฟังก์ชันสร้างข้อมูลใหม่
  const handleCreateSpace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError('');

    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || role !== 'admin') {
      setCreateError('Only administrators (admins) can add locations');
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string)?.trim();
    const address = (fd.get('address') as string)?.trim();
    const telephoneRaw = (fd.get('telephone') as string)?.trim();
    const priceRaw = fd.get('price_per_hour') as string;
    const open_time = (fd.get('open_time') as string) || '';
    const close_time = (fd.get('close_time') as string) || '';
    const type = (fd.get('type') as string) || 'desk';
    const status = (fd.get('status') as string) || 'available';

    const price_per_hour = Number(priceRaw);
    if (!name || !address || !telephoneRaw || Number.isNaN(price_per_hour) || price_per_hour < 0 || !open_time || !close_time) {
      setCreateError('Please fill in all the information completely and accurately');
      return;
    }

    const phoneCheck = validateThaiTelephone(telephoneRaw);
    if (phoneCheck.ok === false) {
      setCreateError(phoneCheck.message);
      return;
    }

    const payload = {
      name, address, telephone: phoneCheck.normalized, price_per_hour, openTime: open_time, closeTime: close_time, type, status,
    };

    setCreating(true);
    try {
      await axios.post(`${API_URL}/coworkings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      form.reset();
      closeAddModal();
      fetchSpaces(); // โหลดข้อมูลใหม่หลังจากสร้างเสร็จ
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; msg?: string } } };
      setCreateError(ax.response?.data?.message || ax.response?.data?.msg || 'cannot add space');
    } finally {
      setCreating(false);
    }
  };

  // ฟังก์ชันอัปเดตข้อมูล (ส่ง PUT/PATCH ไปที่ Backend)
  const handleUpdateSpace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError('');

    if (!editingSpace) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setEditError('Session expired. Please log in again.');
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string)?.trim();
    const address = (fd.get('address') as string)?.trim();
    const telephoneRaw = (fd.get('telephone') as string)?.trim();
    const priceRaw = fd.get('price_per_hour') as string;
    const open_time = (fd.get('open_time') as string) || '';
    const close_time = (fd.get('close_time') as string) || '';
    const type = (fd.get('type') as string) || 'desk';
    const status = (fd.get('status') as string) || 'available';

    const price_per_hour = Number(priceRaw);
    
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น
    if (!name || !address || !telephoneRaw || Number.isNaN(price_per_hour) || price_per_hour < 0 || !open_time || !close_time) {
      setEditError('Please fill in all the information completely and accurately');
      return;
    }

    const phoneCheck = validateThaiTelephone(telephoneRaw);
    if (phoneCheck.ok === false) {
      setEditError(phoneCheck.message);
      return;
    }

    const payload = {
      name, address, telephone: phoneCheck.normalized, price_per_hour, openTime: open_time, closeTime: close_time, type, status,
    };

    setEditing(true);
    try {
      // ส่งคำสั่งอัปเดตไปที่ Backend (ใช้ PUT method)
      await axios.put(`${API_URL}/coworkings/${editingSpace._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      closeEditModal();
      fetchSpaces(); // รีเฟรชข้อมูลในตารางใหม่

      setAlert({
        message: 'Updated Successfully 🎉',
        type: 'success',
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; msg?: string } } };
      setEditError(ax.response?.data?.message || ax.response?.data?.msg || 'cannot update space');
      setAlert({
        message: 'Failed to update space 🚫',
        type: 'error',
      });
    } finally {
      setEditing(false);
    }
  };

  const displayedSpaces = showAll ? spaces : spaces.slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(null)}
      />
    )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Spaces Management</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">Manage your workspace inventory and availability.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Space
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
                <th className="p-4 font-semibold text-text-muted-light dark:text-text-muted-dark">Space Name</th>
                <th className="p-4 font-semibold text-text-muted-light dark:text-text-muted-dark">Type</th>
                <th className="p-4 font-semibold text-text-muted-light dark:text-text-muted-dark">Price/Hour</th>
                <th className="p-4 font-semibold text-text-muted-light dark:text-text-muted-dark">Status</th>
                <th className="p-4 font-semibold text-text-muted-light dark:text-text-muted-dark text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted-light dark:text-text-muted-dark">
                    No spaces found in the system
                  </td>
                </tr>
              ) : (
                displayedSpaces.map((space) => (
                  <tr
                    key={space._id}
                    className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-medium block">{space.name}</span>
                          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{space.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted-light dark:text-text-muted-dark capitalize">{space.type}</td>
                    <td className="p-4 text-text-muted-light dark:text-text-muted-dark">฿{space.price_per_hour}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          space.status === 'available'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : space.status === 'unavailable'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ผูกฟังก์ชัน openEditModal เข้ากับปุ่ม Edit */}
                        <button 
                          onClick={() => openEditModal(space)}
                          className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-text-muted-light dark:text-text-muted-dark"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* ผูกฟังก์ชันเปิด Delete Modal ตรงนี้ */}
                        <button
                          onClick={() => openDeleteModal(space._id)}
                          className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 rounded-lg transition-colors text-text-muted-light dark:text-text-muted-dark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {spaces.length > 5 && (
          <div className="p-4 border-t border-border-light dark:border-border-dark flex justify-center bg-background-light dark:bg-background-dark/50">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50"
            >
              {showAll ? 'Show Less' : `View All (${spaces.length})`}
            </button>
          </div>
        )}        
      </div>

      {/* ================= MODAL เพิ่มข้อมูล (CREATE) ================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation" onClick={closeAddModal}>
          <div role="dialog" className="w-full max-w-xl rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-2">
              <h2 className="text-lg font-bold text-white">Add New Space</h2>
              <button type="button" onClick={closeAddModal} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="px-6 pb-6 pt-2 space-y-4">
              {createError && <div className="text-sm text-red-400 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{createError}</div>}
              {/* === ซ่อนฟอร์ม Create ไว้ (เหมือนของเดิม) === */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name <span className="text-primary">*</span></label>
                <input name="name" required placeholder="e.g. The Hub Bangkok" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Address <span className="text-primary">*</span></label>
                <input name="address" required placeholder="e.g. 123 Sukhumvit Rd, Bangkok" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Telephone <span className="text-primary">*</span></label>
                  <input name="telephone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="0812345678 or 02-123-4567" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                  <p className="mt-1 text-xs text-zinc-500">number only, starts with 0 and has 9 or 10 digits</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Price / Hour (฿) <span className="text-primary">*</span></label>
                  <input name="price_per_hour" type="number" min={0} step={1} required placeholder="150" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Open Time <span className="text-primary">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input name="open_time" type="time" required className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 scheme-dark" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Close Time <span className="text-primary">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input name="close_time" type="time" required className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 scheme-dark" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Type <span className="text-primary">*</span></label>
                  <select name="type" defaultValue="desk" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 appearance-none cursor-pointer">
                    <option value="desk">Desk</option>
                    <option value="room">Room</option>
                    <option value="meeting">Meeting room</option>
                    <option value="private">Private office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
                  <select name="status" defaultValue="available" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 appearance-none cursor-pointer">
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button type="button" onClick={closeAddModal} className="flex-1 py-3 rounded-xl font-semibold border-2 border-zinc-500 text-white bg-transparent hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL แก้ไขข้อมูล (EDIT) ================= */}
      {editModalOpen && editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation" onClick={closeEditModal}>
          <div role="dialog" className="w-full max-w-xl rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-2">
              <h2 className="text-lg font-bold text-white">Edit Space</h2>
              <button type="button" onClick={closeEditModal} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSpace} className="px-6 pb-6 pt-2 space-y-4">
              {editError && <div className="text-sm text-red-400 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{editError}</div>}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name <span className="text-primary">*</span></label>
                <input name="name" defaultValue={editingSpace.name} required className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Address <span className="text-primary">*</span></label>
                <input name="address" defaultValue={editingSpace.address} required className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Telephone <span className="text-primary">*</span></label>
                  <input name="telephone" type="tel" inputMode="numeric" autoComplete="tel" defaultValue={editingSpace.telephone} required placeholder="0812345678 หรือ 02-123-4567" className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                  <p className="mt-1 text-xs text-zinc-500">number only, starts with 0 and has 9 or 10 digits</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Price / Hour (฿) <span className="text-primary">*</span></label>
                  <input name="price_per_hour" type="number" min={0} step={1} defaultValue={editingSpace.price_per_hour} required className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Open Time <span className="text-primary">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input name="open_time" type="time" defaultValue={editingSpace.openTime} required className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 scheme-dark" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Close Time <span className="text-primary">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input name="close_time" type="time" defaultValue={editingSpace.closeTime} required className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 scheme-dark" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Type <span className="text-primary">*</span></label>
                  <select name="type" defaultValue={editingSpace.type} className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 appearance-none cursor-pointer">
                    <option value="desk">Desk</option>
                    <option value="room">Room</option>
                    <option value="meeting">Meeting room</option>
                    <option value="private">Private office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
                  <select name="status" defaultValue={editingSpace.status} className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 appearance-none cursor-pointer">
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button type="button" onClick={closeEditModal} className="flex-1 py-3 rounded-xl font-semibold border-2 border-zinc-500 text-white bg-transparent hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={editing} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {editing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ยืนยันการลบ (DELETE CONFIRMATION) ================= */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation" onClick={closeDeleteModal}>
          <div role="dialog" className="w-full max-w-md rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex flex-col items-center text-center p-6 pt-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirm Deletion</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Are you sure you want to delete this space?<br/>
                All related bookings will also be deleted<br/>and this action cannot be undone.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                <button 
                  type="button" 
                  onClick={closeDeleteModal} 
                  className="flex-1 py-3 rounded-xl font-semibold border-2 border-zinc-600 text-zinc-300 bg-transparent hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmDelete} 
                  disabled={isDeleting} 
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}