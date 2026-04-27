'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import generatePDF from 'react-to-pdf';
import { 
  Users, Calendar, CreditCard, Activity, 
  MoreVertical, Download, Filter, Banknote, CalendarCheck, Building, 
  UserPlus, CalendarPlus, Receipt, BarChart as BarChartIcon, X, Loader2, Edit, Trash2,
  ArrowUpDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SalesDashboardUI from '@/components/SalesDashboardUI';

export default function Admin() {
  const [stats, setStats] = useState({ revenue: 0, members: 0, bookingsToday: 0, occupancy: 0 });
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState('2026'); 
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<any[]>([]); 
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userForm, setUserForm] = useState({ name: '', email: '', telephone: '', password: '', role: 'user' });
  const [bookingForm, setBookingForm] = useState({ coworkingId: '', desk: '', date: '', startTime: '', endTime: '', user: '' });

  // 🟢 Dropdown Menu State (จัดการให้เปิดได้ทีละอัน)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editBookingForm, setEditBookingForm] = useState({ id: '', coworkingId: '', desk: '', date: '', startTime: '', endTime: '' });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // State สำหรับ Filter และ Sort
  const [filterSpace, setFilterSpace] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc'); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'csv' | 'pdf'>('csv');

  const csvLinkRef = React.useRef<any>(null);
  const pdfReportRef = React.useRef<HTMLDivElement>(null);
  //http://localhost:5000/api/v1
  const API_URL = 'https://backend-august-pen-gay.onrender.com/api/v1';

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      const res = await axios.get(`${API_URL}/reservations/dashboard/stats?year=${selectedYear}`, config);
      
      if (res.data.success) {
         const dbStats = res.data.data;
         setStats({ revenue: dbStats.revenue, members: dbStats.members, bookingsToday: dbStats.bookingsToday, occupancy: dbStats.occupancy });
         setAllTransactions(dbStats.recentTransactions); 
         setMonthlyRevenueData(dbStats.monthlyRevenue || []);
      }
    } catch (error) {
      // Error fetching dashboard data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/coworkings`).then(res => setSpaces(res.data.data)).catch(err => {
      // Error fetching coworking spaces
    });
  }, []);

  useEffect(() => { fetchDashboardData(); }, [API_URL, selectedYear]);

  useEffect(() => {
    if (activeModal === 'newBooking' || activeModal === 'editBooking') {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
      axios.get(`${API_URL}/auth/users`, config).then(res => setUsersList(res.data.data || res.data)).catch(err => {
        // Error fetching users
      });
    }
  }, [activeModal]);

  // ระบบกรองและจัดเรียงข้อมูล
  const filteredTransactions = allTransactions
    .filter(t => {
      // กรองสาขา
      const matchSpace = filterSpace === 'All' || t.coworkingId === filterSpace;
      return matchSpace;
    })
    .sort((a, b) => {
      // จัดเรียงข้อมูล
      if (sortBy === 'date-desc') {
        return new Date(b.rawDate || b.time).getTime() - new Date(a.rawDate || a.time).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.rawDate || a.time).getTime() - new Date(b.rawDate || b.time).getTime();
      } else if (sortBy === 'amount-desc') {
        const valA = parseFloat(a.amount.replace(/[^0-9.-]+/g, ""));
        const valB = parseFloat(b.amount.replace(/[^0-9.-]+/g, ""));
        return valB - valA;
      } else if (sortBy === 'amount-asc') {
        const valA = parseFloat(a.amount.replace(/[^0-9.-]+/g, ""));
        const valB = parseFloat(b.amount.replace(/[^0-9.-]+/g, ""));
        return valA - valB;
      }
      return 0;
    });

  const displayRecentTransactions = filteredTransactions.slice(0, 5);

  // ==================== ACTION HANDLERS ====================
  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/reservations/${id}`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      alert('✅ Booking deleted successfully!');
      setOpenMenuId(null); fetchDashboardData();
    } catch (err: any) { alert('❌ Failed to delete: ' + (err.response?.data?.message || err.message)); }
  };

  const handleOpenEdit = (transaction: any) => {
    setEditBookingForm({
      id: transaction.id, coworkingId: transaction.coworkingId || '', desk: transaction.desk || '',
      date: transaction.rawDate || '', startTime: transaction.startTime || '', endTime: transaction.endTime || ''
    });
    setOpenMenuId(null); setActiveModal('editBooking'); 
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/reservations/${editBookingForm.id}`, editBookingForm, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      alert('✅ Booking updated successfully!'); setActiveModal(null); fetchDashboardData();
    } catch (err: any) { alert('❌ Failed to update: ' + (err.response?.data?.message || err.message)); } 
    finally { setIsSubmitting(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/register`, userForm);
      alert('✅ User added successfully!'); setActiveModal(null); setUserForm({ name: '', email: '', telephone: '', password: '', role: 'user' }); fetchDashboardData();
    } catch (err: any) { alert('❌ Failed: ' + (err.response?.data?.message || err.message)); } 
    finally { setIsSubmitting(false); }
  };

  const handleNewBooking = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/coworkings/${bookingForm.coworkingId}/reservations`, bookingForm, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      alert('✅ Booking created successfully!'); setActiveModal(null); setBookingForm({ coworkingId: '', desk: '', date: '', startTime: '', endTime: '', user: '' }); fetchDashboardData();
    } catch (err: any) { alert('❌ Failed: ' + (err.response?.data?.message || err.message)); } 
    finally { setIsSubmitting(false); }
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return alert('Please select a transaction first.');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/reservations/${selectedInvoice.id}/invoice`, 
        { amount: selectedInvoice.amount, date: selectedInvoice.time },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      alert(`✅ Invoice has been sent to ${selectedInvoice.email} successfully!`);
      setActiveModal(null); setSelectedInvoice(null);
    } catch (err: any) { alert('❌ Failed to send invoice: ' + (err.response?.data?.message || err.message)); } 
    finally { setIsSubmitting(false); }
  };

  const handleGenerateReport = () => {
    if (filteredTransactions.length === 0) return alert('No transactions to export.');
    const headers = ['Customer', 'Email', 'Amount', 'Date', 'Status'];
    const csvRows = [headers.join(',')];
    filteredTransactions.forEach(t => {
      const rawAmount = t.amount.replace(/[^0-9.-]+/g, "");
      csvRows.push(`"${t.user}","${t.email}","${rawAmount}","${t.time}","${t.status}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `revenue_report_${selectedYear}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const csvHeaders = [
    { label: 'Customer', key: 'user' },
    { label: 'Email', key: 'email' },
    { label: 'Amount', key: 'amount' },
    { label: 'Date', key: 'time' },
    { label: 'Status', key: 'status' },
    { label: 'Coworking Space', key: 'coworkingName' },
    { label: 'Desk', key: 'desk' },
    { label: 'Start Time', key: 'startTime' },
    { label: 'End Time', key: 'endTime' },
  ];

  const csvData = filteredTransactions.map((item) => ({
    user: item.user,
    email: item.email,
    amount: item.amount,
    time: item.time,
    status: item.status,
    coworkingName: item.coworkingName || 'N/A',
    desk: item.desk || 'N/A',
    startTime: item.startTime || 'N/A',
    endTime: item.endTime || 'N/A',
  }));
  const pdfRows = filteredTransactions.slice(0, 1000);

  const handleConfirmExport = async () => {
    if (selectedExportType === 'csv') {
      csvLinkRef.current?.link?.click();
      setIsExportModalOpen(false);
      return;
    }

    if (pdfReportRef.current) {
      await generatePDF(pdfReportRef, {
        filename: `dashboard-report-${selectedYear}.pdf`,
        page: { margin: 16, format: 'a4', orientation: 'portrait' },
      });
    }
    setIsExportModalOpen(false);
  };

  const statCards = [
    { title: 'Total Revenue', value: `฿${stats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Active Members', value: stats.members.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Bookings Today', value: stats.bookingsToday.toLocaleString(), icon: CalendarCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Space Occupancy', value: `${stats.occupancy}%`, icon: Building, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (loading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  const currentMonthIndex = new Date().getMonth();
  const isCurrentYear = new Date().getFullYear().toString() === selectedYear;

  // 🟢 Component Table Row ที่แก้บั๊กเมนูซ้อนแล้ว (ใช้ menuKey ในการแยกแยะ)
  const TransactionRow = ({ row, menuKey }: { row: any, menuKey: string }) => (
    <tr className="hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors relative">
      <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={`https://picsum.photos/seed/${row.user}/40/40`} alt={row.user} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" /><div><div className="font-medium text-white">{row.user}</div><div className="text-xs text-gray-400">{row.email}</div></div></div></td>
      <td className="px-6 py-4 font-medium text-white">{row.amount}</td>
      <td className="px-6 py-4 text-gray-400">
        {row.time} <br/> <span className="text-xs opacity-70">{row.coworkingName}</span>
      </td>
      <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.statusColor}`}>{row.status}</span></td>
      <td className="px-6 py-4 text-right relative">
        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === menuKey ? null : menuKey); }} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
        {openMenuId === menuKey && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-32 bg-gray-800 dark:bg-gray-800 border border-gray-600 dark:border-gray-600 shadow-xl rounded-xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleOpenEdit(row)} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 dark:hover:bg-gray-700 flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
            <button onClick={() => handleDeleteBooking(row.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 dark:hover:bg-red-900/20 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative" onClick={() => { setOpenMenuId(null); }}>
      <CSVLink
        ref={csvLinkRef}
        data={csvData}
        headers={csvHeaders}
        filename={`dashboard-report-${selectedYear}.csv`}
        className="hidden"
        target="_blank"
      />

      {/* ======================= MODALS ======================= */}
      {/* Export Modal */}
      {isExportModalOpen && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Choose Export Format</h2>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                Select a format to download the current dashboard data.
              </p>
            </div>
            <div className="space-y-3 mb-8">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="csv"
                  checked={selectedExportType === 'csv'}
                  onChange={() => setSelectedExportType('csv')}
                  className="w-4 h-4 mt-0.5 text-primary"
                />
                <div>
                  <p className="text-sm font-semibold">CSV Data File (.csv)</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                    Best for spreadsheet analysis and bulk data processing.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="pdf"
                  checked={selectedExportType === 'pdf'}
                  onChange={() => setSelectedExportType('pdf')}
                  className="w-4 h-4 mt-0.5 text-primary"
                />
                <div>
                  <p className="text-sm font-semibold">Summary Report PDF (.pdf)</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                    Includes revenue chart and transaction table in one report.
                  </p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
              >
                Confirm Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking */}
      {activeModal === 'editBooking' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Booking</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Location / Space</label>
                <select required value={editBookingForm.coworkingId} onChange={e => setEditBookingForm({...editBookingForm, coworkingId: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800">
                  <option value="">-- Select a space --</option>
                  {/* 🟢 กรองเฉพาะ available และยังไม่ถูกลบ (Edit Booking) */}
                  {spaces
                    .filter(s => (!s.status || s.status === 'available') && !s.isDeleted)
                    .map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                  }
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Desk No.</label><input required value={editBookingForm.desk} onChange={e => setEditBookingForm({...editBookingForm, desk: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
                <div><label className="block text-sm mb-1">Date</label><input type="date" required value={editBookingForm.date} onChange={e => setEditBookingForm({...editBookingForm, date: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
                <div><label className="block text-sm mb-1">Start Time</label><input type="time" required value={editBookingForm.startTime} onChange={e => setEditBookingForm({...editBookingForm, startTime: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
                <div><label className="block text-sm mb-1">End Time</label><input type="time" required value={editBookingForm.endTime} onChange={e => setEditBookingForm({...editBookingForm, endTime: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add User */}
      {activeModal === 'addUser' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Add New User</h2><button onClick={() => setActiveModal(null)} className="p-2"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div><label className="block text-sm mb-1">Full Name</label><input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
              <div><label className="block text-sm mb-1">Email</label><input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
              <div><label className="block text-sm mb-1">Telephone</label><input required value={userForm.telephone} onChange={e => setUserForm({...userForm, telephone: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
              <div><label className="block text-sm mb-1">Password</label><input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create User'}</button>
            </form>
          </div>
        </div>
      )}

      {/* New Booking */}
      {activeModal === 'newBooking' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Booking</h2>
              <button onClick={() => setActiveModal(null)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleNewBooking} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Customer</label>
                <select required value={bookingForm.user} onChange={e => setBookingForm({...bookingForm, user: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800">
                  <option value="">-- Select a customer --</option>
                  {usersList.map((u: any) => (<option key={u._id} value={u._id}>{u.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Location / Space</label>
                <select required value={bookingForm.coworkingId} onChange={e => setBookingForm({...bookingForm, coworkingId: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800">
                  <option value="">-- Select a space --</option>
                  {/* 🟢 กรองเฉพาะ available และยังไม่ถูกลบ (New Booking) */}
                  {spaces
                    .filter(s => (!s.status || s.status === 'available') && !s.isDeleted)
                    .map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                  }
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Desk No.</label><input required value={bookingForm.desk} onChange={e => setBookingForm({...bookingForm, desk: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800" /></div>
                <div><label className="block text-sm mb-1">Date</label><input type="date" required value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
                <div><label className="block text-sm mb-1">Start Time</label><input type="time" required value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
                <div><label className="block text-sm mb-1">End Time</label><input type="time" required value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} className="w-full p-2.5 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 scheme-dark"/></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice */}
      {activeModal === 'invoice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {setActiveModal(null); setSelectedInvoice(null);}}>
          <div className="w-full max-w-md rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Quick Invoice</h2><button onClick={() => {setActiveModal(null); setSelectedInvoice(null);}} className="p-2"><X className="w-5 h-5" /></button></div>
            <p className="text-sm text-text-muted-light mb-4">Select a transaction to issue an official invoice to their email.</p>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {filteredTransactions.map((t, i) => (
                <div key={i} onClick={() => setSelectedInvoice(t)} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedInvoice?.id === t.id ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' : 'border-border-light dark:border-zinc-700 hover:border-emerald-500/50'}`}>
                  <div><div className="font-medium text-sm">{t.user}</div><div className="text-xs text-text-muted-light">{t.email}</div></div>
                  <div className={`font-bold ${selectedInvoice?.id === t.id ? 'text-emerald-600' : 'text-emerald-500'}`}>{t.amount}</div>
                </div>
              ))}
            </div>
            <button onClick={handleSendInvoice} disabled={!selectedInvoice || isSubmitting} className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors ${!selectedInvoice ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate & Send Email'}
            </button>
          </div>
        </div>
      )}

      {/* View All Transactions */}
      {isViewAllOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewAllOpen(false)}>
          <div className="w-full max-w-5xl max-h-[80vh] flex flex-col rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl overflow-hidden" onClick={e => { e.stopPropagation(); setOpenMenuId(null); }}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light dark:border-border-dark">
              <div><h2 className="text-xl font-bold">All Transactions</h2><p className="text-sm text-text-muted-light">A complete list of all bookings and payments.</p></div>
              <button onClick={() => setIsViewAllOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 pb-20">
              <table className="w-full text-left text-sm">
                <thead className="bg-background-light dark:bg-background-dark text-text-muted-light sticky top-0 z-10">
                  <tr><th className="px-6 py-4 font-medium">Customer</th><th className="px-6 py-4 font-medium">Amount</th><th className="px-6 py-4 font-medium">Date</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium text-right"></th></tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {/* 🟢 ส่ง menuKey ที่ไม่ซ้ำกันไปให้ Component แถวตาราง */}
                  {filteredTransactions.length > 0 ? filteredTransactions.map((row, i) => <TransactionRow key={`all-${i}`} row={row} menuKey={`all-${i}`} />) : <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted-light">No transactions found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 ส่วน Header หลักของ Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard Overview</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">Welcome back, here's what's happening today.</p>
        </div>
        
        {/* 🟢 เครื่องมือกรองและจัดเรียง (Filter & Sort) */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Filter by Space */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light pointer-events-none" />
            <select 
              value={filterSpace}
              onChange={(e) => setFilterSpace(e.target.value)}
              className="pl-9 pr-8 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            >
              <option value="All">All Spaces</option>
              {spaces.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light pointer-events-none" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-8 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="w-6 h-6" /></div>
              </div>
              <h3 className="text-text-muted-light dark:text-text-muted-dark font-medium text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-border-light dark:border-border-dark pb-4">
            <div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">WorkSpace Dashboard Report</h2>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Summary for year {selectedYear}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-light dark:bg-surface-dark text-text-muted-light dark:text-text-muted-dark border border-border-light dark:border-border-dark">Generated from live dashboard data</span>
          </div>

          {/* Sales Dashboard UI Filters */}
          <SalesDashboardUI role="admin" />

        </div>

        <div className="space-y-8">
          <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveModal('addUser')} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform"><UserPlus className="w-5 h-5" /></div><span className="text-sm font-medium">Add User</span></button>
              <button onClick={() => setActiveModal('newBooking')} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform"><CalendarPlus className="w-5 h-5" /></div><span className="text-sm font-medium">New Booking</span></button>
              <button onClick={() => setActiveModal('invoice')} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform"><Receipt className="w-5 h-5" /></div><span className="text-sm font-medium">Create Invoice</span></button>
              <button onClick={handleGenerateReport} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform"><BarChartIcon className="w-5 h-5" /></div><span className="text-sm font-medium">Generate Report</span></button>
            </div>
          </section>
        </div>
      </div>

      {/* PDF-only container: keep styles simple to avoid oklch parsing issues */}
      <div
        style={{
          position: 'fixed',
          left: '-200vw',
          top: 0,
          width: '1024px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '24px',
          zIndex: -1,
        }}
      >
        <div ref={pdfReportRef}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>WorkSpace Dashboard Report</h2>
            <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '14px' }}>Summary for year {selectedYear}</p>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Recent Transactions</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pdfRows.length > 0 ? pdfRows.map((row, i) => (
                  <tr key={`pdf-row-${i}`}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.user}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.email}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.amount}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.time}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9' }}>{row.status}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}