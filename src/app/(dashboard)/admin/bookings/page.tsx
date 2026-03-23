'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreVertical, Edit, Trash2, X, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, Activity, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

type Booking = {
  id: string;
  user: string;
  userId: string; // 🟢 เพิ่ม userId เข้ามาใน Type
  type: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  desk?: string; 
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  // 🟢 เพิ่ม State สำหรับเก็บค่าการค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableSectionElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Backend ควรตั้งค่าให้ API นี้คืนค่าทั้งหมดเมื่อเป็น Admin
      const res = await axios.get('http://localhost:5000/api/v1/reservations', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      const formattedBookings = res.data.data.map((r: any) => {
        const dateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
        return {
          id: r._id,
          user: r.user?.name || 'Unknown User',
          userId: r.user?._id || '', // 🟢 ดึง userId มาจาก Backend
          type: r.coworking?.type ? r.coworking.type.charAt(0).toUpperCase() + r.coworking.type.slice(1) : 'Workspace',
          location: r.coworking?.name || 'Unknown Location',
          date: dateStr,
          startTime: r.startTime || '09:00',
          endTime: r.endTime || '18:00',
          desk: r.desk || '',
          status: 'Active' 
        };
      });
      setBookings(formattedBookings);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจใช่ไหมที่จะลบการจองนี้? (การลบในฐานะ Admin)')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/v1/reservations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setBookings(bookings.filter(booking => booking.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      alert('ไม่สามารถลบรายการได้');
    }
  };

  const handleEditClick = (booking: Booking) => {
    setEditingBooking({ ...booking });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveChanges = async () => {
    if (editingBooking) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/v1/reservations/${editingBooking.id}`, 
          { 
            date: editingBooking.date,
            startTime: editingBooking.startTime,
            endTime: editingBooking.endTime
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          }
        );

        setIsEditModalOpen(false);
        setEditingBooking(null);
        fetchBookings(); 
        alert('อัปเดตการจองสำเร็จ!');
      } catch (err) {
        console.error(err);
        alert('ไม่สามารถแก้ไขข้อมูลได้ โปรดตรวจสอบว่าข้อมูลถูกต้อง');
      }
    }
  };

  const getDisplayTime = (start: string, end: string) => {
    const format12h = (time24: string) => {
      if (!time24) return '';
      const [h, m] = time24.split(':');
      const hours = parseInt(h);
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12.toString().padStart(2, '0')}:${m} ${suffix}`;
    };
    return `${format12h(start)} - ${format12h(end)}`;
  };

  // 🟢 ฟังก์ชันสำหรับกรองข้อมูล (Filter) ตามคำค้นหา
  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.userId.toLowerCase().includes(searchLower) ||    // ค้นหาด้วย User ID
      booking.user.toLowerCase().includes(searchLower) ||      // ค้นหาด้วยชื่อ User
      booking.id.toLowerCase().includes(searchLower) ||        // ค้นหาด้วย Booking ID
      booking.location.toLowerCase().includes(searchLower)     // ค้นหาด้วยชื่อสถานที่
    );
  });

  // 🟢 นำ filteredBookings ไปคำนวณสถิติ เพื่อให้ตัวเลขเปลี่ยนตามการ Filter
  const activeBookingsCount = filteredBookings.filter(b => b.status === 'Active').length;
  const monthlyRevenue = filteredBookings.length * 1500;
  const locationCounts = filteredBookings.reduce((acc, curr) => {
    if(curr.location !== 'Unknown Location') {
      acc[curr.location] = (acc[curr.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const popularSpace = Object.keys(locationCounts).length > 0 
    ? Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b) 
    : 'No Data Found';

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">View and manage all workspace reservations across the system.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
            {/* 🟢 ผูก State การค้นหากับ Input Field */}
            <input 
              type="text" 
              placeholder="Search by User ID, Name, Booking ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          <button className="p-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium">Active Bookings</p>
            <h3 className="text-2xl font-bold">{activeBookingsCount}</h3>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium">Estimated Revenue</p>
            <h3 className="text-2xl font-bold">฿{monthlyRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark font-medium">Popular Space</p>
            <h3 className="text-lg font-bold truncate max-w-[150px]">{popularSpace}</h3>
          </div>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Booking ID</th>
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Member</th>
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Space Type</th>
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Location</th>
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Date & Time</th>
                <th className="p-4 font-medium text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Status</th>
                <th className="p-4 w-14"></th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark" ref={menuRef}>
              {/* 🟢 ใช้ filteredBookings ในการวนลูปแทน bookings ปกติ */}
              {filteredBookings.map((booking, index) => {
                const isBottomRow = index >= filteredBookings.length - 2 && filteredBookings.length > 3;
                return (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 font-medium text-sm whitespace-nowrap">
                    <span className="text-xs text-gray-400">ID:</span> {booking.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {booking.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{booking.user}</span>
                        {/* 🟢 แสดง User ID ย่อให้ Admin เห็นได้ด้วย */}
                        <span className="text-[10px] text-gray-400">uid: {booking.userId.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">
                    {booking.type} {booking.desk && <span className="text-[#ea580c] dark:text-[#ea580c] font-medium ml-1">({booking.desk})</span>}
                  </td>
                  <td className="p-4 text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">{booking.location}</td>
                  <td className="p-4 text-sm text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">
                    {booking.date} <br/>
                    <span className="text-xs opacity-70">{getDisplayTime(booking.startTime, booking.endTime)}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      booking.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative whitespace-nowrap">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                      className="p-1.5 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === booking.id && (
                      <div className={`absolute right-8 w-32 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg z-50 py-1 overflow-hidden ${
                        isBottomRow ? 'bottom-8' : 'top-10'
                      }`}>
                        <button 
                          onClick={() => handleEditClick(booking)}
                          className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(booking.id)}
                          className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
              
              {/* 🟢 แจ้งเตือนเมื่อค้นหาไม่เจอข้อมูล */}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted-light dark:text-text-muted-dark">
                    {searchTerm ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` : "ไม่พบข้อมูลการจองในระบบ"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          {/* ... Modal Code (เหมือนเดิม) ... */}
          <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 className="text-xl font-bold">Edit Booking (Admin)</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full h-[1px] bg-gray-100 dark:bg-border-dark mb-4"></div>

            <div className="px-6 pb-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={editingBooking.location}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-500 appearance-none cursor-not-allowed"
                    disabled
                  >
                    <option value={editingBooking.location}>{editingBooking.location}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Space Type</label>
                  <input 
                    type="text" 
                    value={editingBooking.desk ? `${editingBooking.type} (${editingBooking.desk})` : editingBooking.type}
                    className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-border-dark rounded-lg text-sm text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Status</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      value={editingBooking.status}
                      onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="date" 
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({...editingBooking, date: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="time" 
                      value={editingBooking.startTime}
                      onChange={(e) => setEditingBooking({...editingBooking, startTime: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="time" 
                      value={editingBooking.endTime}
                      onChange={(e) => setEditingBooking({...editingBooking, endTime: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="w-full h-[1px] bg-gray-100 dark:bg-border-dark"></div>

            <div className="p-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold border border-gray-300 dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                className="px-5 py-2.5 text-sm font-semibold bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}