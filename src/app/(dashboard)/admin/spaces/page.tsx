'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building, Plus, Trash2, Edit, X, Clock, 
  Loader2, AlertTriangle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import Alert from '@/components/Alert';
import { validateThaiTelephone } from '@/lib/telephoneValidation';

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
  isDeleted?: boolean; // 🟢 เพิ่ม property สำหรับบอกสถานะถังขยะ
}

// Type สำหรับการทำ Multi-sort
type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof Coworking;
  direction: SortDirection;
}

// Type สำหรับการทำ Multi-sort
type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof Coworking;
  direction: SortDirection;
}

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState<Coworking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination States (เพิ่มใหม่)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isCustomRows, setIsCustomRows] = useState(false);
  const [customRowsValue, setCustomRowsValue] = useState<number | ''>('');

  // Modals States...
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Coworking | null>(null);

  // States สำหรับ Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [spaceToProcess, setSpaceToProcess] = useState<Coworking | null>(null);
  const [deleteActionType, setDeleteActionType] = useState<'soft' | 'hard'>('soft');
  const [isDeleting, setIsDeleting] = useState(false);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'warning'; } | null>(null);

// เปลี่ยนพอร์ต 5000 ให้ตรงกับพอร์ตที่ Backend ในเครื่องคุณรันอยู่นะครับ
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

  // จัดการการปิด Modal
  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setCreateError('');
    setCreating(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditError('');
    setEditing(false);
    setEditingSpace(null);
  }, []);

  const openDeleteModal = (id: string) => {
    setSpaceToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setSpaceToDelete(null);
    setIsDeleting(false);
  }, []);

  // Keyboard events
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addModalOpen) closeAddModal();
        if (editModalOpen) closeEditModal();
        if (deleteModalOpen) closeDeleteModal();
      }
      
      const isTyping = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLSelectElement;
      if (isTyping) return;

      if (e.key === 'ArrowLeft') setCurrentPage((prev) => Math.max(prev - 1, 1));
      else if (e.key === 'ArrowRight') setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addModalOpen, editModalOpen, deleteModalOpen, closeAddModal, closeEditModal, closeDeleteModal]);

  const confirmDelete = async () => {
    if (!spaceToDelete) return;
    setIsDeleting(true);
    const token = localStorage.getItem('token');

    try {
      if (deleteActionType === 'soft') {
        await axios.put(`${API_URL}/coworkings/${spaceToProcess._id}`, { isDeleted: true }, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // 🟢 เปลี่ยนข้อความตรงนี้
        setAlert({ message: 'Space Archived Successfully 📦', type: 'warning' });
      } else {
        await axios.delete(`${API_URL}/coworkings/${spaceToProcess._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setAlert({ message: 'Permanently Deleted 🚫', type: 'error' });
      }
      
      fetchSpaces();
      closeDeleteModal();
      
      setAlert({
        message: 'Deleted successfully 🎉',
        type: 'error' 
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      console.error('Delete error:', err);
      setAlert({
        message: 'cannot delete: ' + (ax.response?.data?.message || 'An error occurred.'),
        type: 'error'
      });
      closeDeleteModal();
    } finally { setIsDeleting(false); }
  };

  const openEditModal = (space: Coworking) => {
    setEditingSpace(space);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleCreateSpace = async (e: React.FormEvent<HTMLFormElement>) => { /* เดิม */ 
    e.preventDefault();
    setCreateError('');
    const token = localStorage.getItem('token');
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    const payload = {
      name: fd.get('name') as string,
      address: fd.get('address') as string,
      telephone: fd.get('telephone') as string,
      price_per_hour: Number(fd.get('price_per_hour')),
      openTime: fd.get('open_time') as string,
      closeTime: fd.get('close_time') as string,
      type: fd.get('type') as string,
      status: fd.get('status') as string,
    };

    const phoneCheck = validateThaiTelephone(payload.telephone);
    if (phoneCheck.ok === false) {
      setCreateError((phoneCheck as any).message);
      return;
    }
    payload.telephone = phoneCheck.normalized;

    setCreating(true);
    try {
      await axios.post(`${API_URL}/coworkings`, payload, { headers: { Authorization: `Bearer ${token}` } });
      form.reset(); closeAddModal(); fetchSpaces();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'cannot add space');
    } finally { setCreating(false); }
  };

  const handleUpdateSpace = async (e: React.FormEvent<HTMLFormElement>) => { /* เดิม */ 
    e.preventDefault();
    setEditError('');
    if (!editingSpace) return;
    const token = localStorage.getItem('token');
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: fd.get('name') as string,
      address: fd.get('address') as string,
      telephone: fd.get('telephone') as string,
      price_per_hour: Number(fd.get('price_per_hour')),
      openTime: fd.get('open_time') as string,
      closeTime: fd.get('close_time') as string,
      type: fd.get('type') as string,
      status: fd.get('status') as string,
    };

    const phoneCheck = validateThaiTelephone(payload.telephone);
    if (phoneCheck.ok === false) {
      setEditError((phoneCheck as any).message);
      return;
    }
    payload.telephone = phoneCheck.normalized;

    setEditing(true);
    try {
      await axios.put(`${API_URL}/coworkings/${editingSpace._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      closeEditModal(); fetchSpaces();
      setAlert({ message: 'Updated Successfully 🎉', type: 'success' });
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'cannot update space');
      setAlert({ message: 'Failed to update space 🚫', type: 'error' });
    } finally { setEditing(false); }
  };

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
        <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Spaces Management</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">Manage your workspace inventory and availability.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => { setCreateError(''); setAddModalOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Space
          </button>
        )}
      </div>

      {/* 🟢 ส่วนที่เพิ่ม: Tabs สลับโหมด Active / Recycle Bin */}
      <div className="flex gap-2">
        <button 
          onClick={() => { setViewMode('active'); setCurrentPage(1); }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all border ${
            viewMode === 'active' 
            ? 'bg-primary text-white border-primary shadow-md' 
            : 'bg-surface-light dark:bg-surface-dark text-text-muted-light border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          Active Spaces
        </button>
        <button 
          onClick={() => { setViewMode('recycle'); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border ${
            viewMode === 'recycle' 
            ? 'bg-red-500 text-white border-red-500 shadow-md' 
            : 'bg-surface-light dark:bg-surface-dark text-text-muted-light border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Trash className="w-4 h-4" /> Recycle Bin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        
        {/* --- Pagination Top/Bottom Controls --- */}
        {processedSpaces.length > 0 && (
          <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 bg-background-light dark:bg-background-dark/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark">Rows:</span>
              <select
                value={isCustomRows ? 'custom' : rowsPerPage}
                onChange={(e) => {
                  if (e.target.value === 'custom') { setIsCustomRows(true); setCustomRowsValue(''); } 
                  else { setIsCustomRows(false); setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }
                }}
                className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/60 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="custom">Custom</option>
              </select>
              {isCustomRows && (
                <input
                  type="number" min="1" value={customRowsValue}
                  onChange={(e) => {
                    const val = e.target.value; setCustomRowsValue(val ? parseInt(val, 10) : '');
                    if (val && !isNaN(parseInt(val, 10))) { setRowsPerPage(parseInt(val, 10)); setCurrentPage(1); }
                  }}
                  placeholder="e.g. 15"
                  className="w-20 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/60 text-gray-900 dark:text-white"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                Page <span className="font-medium text-gray-900 dark:text-white">{totalPages === 0 ? 0 : currentPage}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                <span className="hidden sm:inline"> ({processedSpaces.length} items)</span>
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || totalPages === 0} className="p-1.5 rounded-lg border border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-gray-600 dark:text-gray-400">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg border border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-gray-600 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}    

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
              {processedSpaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted-light dark:text-text-muted-dark">
                    No spaces found in the system
                  </td>
                </tr>
              ) : (
                displayedSpaces.map((space) => (
                  <tr key={space._id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`font-medium block ${viewMode === 'recycle' ? 'text-text-muted-light line-through' : ''}`}>{space.name}</span>
                          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{space.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted-light dark:text-text-muted-dark capitalize">{space.type}</td>
                    <td className="p-4 text-text-muted-light dark:text-text-muted-dark">฿{space.price_per_hour}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          space.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          space.status === 'unavailable' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                        {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(space)}
                          className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-text-muted-light dark:text-text-muted-dark"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
      </div>

      {/* MODALS คงเดิมด้านล่าง (ตัดออกเพื่อให้เห็นภาพรวมสั้นลง แต่เวลาใช้งานจริงให้คง Modal ไว้เหมือนเดิมครับ) */}
      {/* ... (Modal Create) ... */}
      {/* ... (Modal Edit) ... */}
      {/* ... (Modal Delete) ... */}


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

      {/* ================= 🟢 MODAL คุมการลบ (SOFT & HARD DELETE) ================= */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation" onClick={closeDeleteModal}>
          <div role="dialog" className="w-full max-w-md rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex flex-col items-center text-center p-6 pt-8">
              
              {/* เปลี่ยนสีและไอคอนตามประเภทการลบ */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${deleteActionType === 'soft' ? 'bg-orange-500/20' : 'bg-red-500/20'}`}>
                {deleteActionType === 'soft' ? <Trash2 className="w-8 h-8 text-orange-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">
                {deleteActionType === 'soft' ? 'Move to Recycle Bin?' : 'Permanently Delete?'}
              </h2>
              
              <p className="text-zinc-400 mb-6 text-sm">
                {deleteActionType === 'soft' ? (
                  // 🟢 เปลี่ยนข้อความตรงนี้
                  <>Are you sure you want to archive "{spaceToProcess?.name}"?<br/>It will be hidden from users but can be restored later.</>
                ) : (
                  <>Are you sure you want to permanently delete this space?<br/>This action cannot be undone and will delete related records.</>
                )}
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
                  onClick={confirmDeleteAction} 
                  disabled={isDeleting} 
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                    deleteActionType === 'soft' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {/* 🟢 เปลี่ยนข้อความบนปุ่มตรงนี้ */}
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (deleteActionType === 'soft' ? 'Archive Space' : 'Yes, Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}