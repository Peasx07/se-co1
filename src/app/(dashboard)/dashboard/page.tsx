'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, Clock, MapPin, CreditCard, ArrowRight, 
  MoreHorizontal, Users, IdCard, CalendarCheck, 
  CalendarPlus, UserPlus, Map, 
  Edit, Trash2, X 
} from 'lucide-react';

// 🟢 1. เพิ่มฟิลด์ desk ใน Type Booking ด้วย
type Booking = {
  id: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  desk?: string; 
};

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/reservations', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      // 🟢 2. แมปข้อมูลใหม่ ดึง startTime และ endTime จาก Backend มาใช้ตรงๆ
      const formattedBookings = res.data.data.map((r: any) => {
        // ดึงแค่วันที่ YYYY-MM-DD จาก UTC string ของ MongoDB
        const dateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
        
        return {
          id: r._id,
          type: r.coworking?.type ? r.coworking.type.charAt(0).toUpperCase() + r.coworking.type.slice(1) : 'Workspace',
          date: dateStr,
          startTime: r.startTime || '09:00', // ใช้ค่าจาก DB
          endTime: r.endTime || '18:00',     // ใช้ค่าจาก DB
          location: r.coworking?.name || 'Unknown Location',
          desk: r.desk || ''                 // ใช้ค่าจาก DB
        };
      });
      setBookings(formattedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleEditClick = (booking: Booking) => {
    setEditingBooking({ ...booking });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveChanges = async () => {
    if (editingBooking) {
      try {
        const token = localStorage.getItem('token');
        
        // 🟢 3. ส่งข้อมูลไปอัปเดต ต้องส่งทั้ง date, startTime, endTime เข้าไป
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
        fetchBookings(); // โหลดข้อมูลใหม่หลังจากแก้เสร็จ
        alert('อัปเดตการจองสำเร็จ!');
      } catch (err) {
        console.error(err);
        alert('แก้ไขไม่สำเร็จ โปรดตรวจสอบข้อมูล');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจใช่ไหมที่จะยกเลิกการจองนี้?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/v1/reservations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      alert('ไม่สามารถลบการจองได้');
    }
  };

  const getDisplayDate = (dateStr: string) => {
    if (!dateStr) return { day: '', month: '' };
    const [, month, day] = dateStr.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      day: parseInt(day),
      month: monthNames[parseInt(month) - 1] || ''
    };
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-text-muted-light dark:text-text-muted-dark">Here's what's happening with your workspace today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <IdCard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Membership</h3>
          </div>
          <p className="text-2xl font-bold mb-1">Resident Plan</p>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Renews on Oct 1, 2026</p>
        </div>
        
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Credits</h3>
          </div>
          <p className="text-2xl font-bold mb-1">12 Hours</p>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Meeting room time remaining</p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Next Booking</h3>
          </div>
          <p className="text-2xl font-bold mb-1">Tomorrow</p>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Hot Desk • Downtown Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upcoming Bookings</h2>
              <Link href="/book" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark">
              
              {bookings.length > 0 ? (
                bookings.map((booking) => {
                  const { day, month } = getDisplayDate(booking.date);
                  const displayTime = getDisplayTime(booking.startTime, booking.endTime);

                  return (
                    <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-light dark:border-border-dark last:border-0 relative">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase">{month}</span>
                          <span className="text-xl font-bold">{day}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{booking.type} {booking.desk && <span className="text-primary text-sm ml-2">({booking.desk})</span>}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {displayTime}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                          className="p-2 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {openMenuId === booking.id && (
                          <div className="absolute right-6 top-14 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-border-light dark:border-border-dark py-1 z-10 overflow-hidden">
                            <button
                              onClick={() => handleEditClick(booking)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Booking
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-text-muted-light dark:text-text-muted-dark">
                  No upcoming bookings.
                </div>
              )}
            </div>
          </section>

          {/* ... (ส่วนอื่นๆ ของ Dashboard เหมือนเดิม) ... */}
          <section>
            <h2 className="text-xl font-bold mb-4">Current Hub Location</h2>
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-800 relative">
                <img src="https://picsum.photos/seed/map/800/400" alt="Map" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white dark:bg-surface-dark p-3 rounded-xl shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Downtown Hub</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">123 Business Ave, Suite 100</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium">Open until 10:00 PM</span>
                <button className="text-sm font-medium text-primary hover:underline">Get Directions</button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/spaces" className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-primary transition-colors flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Book Desk</span>
              </Link>
              <button className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-primary transition-colors flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Invite Guest</span>
              </button>
              <button className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-primary transition-colors flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Buy Credits</span>
              </button>
              <button className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-border-light dark:border-border-dark hover:border-primary transition-colors flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center">
                  <Map className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">View Map</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* --- Popup Modal สำหรับ Edit --- */}
      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 className="text-xl font-bold">Edit Booking</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full h-[1px] bg-gray-100 dark:bg-border-dark mb-4"></div>

            {/* ฟอร์มแก้ไข */}
            <div className="px-6 pb-6 space-y-5">
              
              {/* Location (Disable ไว้) */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={editingBooking.location}
                    onChange={(e) => setEditingBooking({...editingBooking, location: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm focus:outline-none appearance-none"
                    disabled
                  >
                    <option value={editingBooking.location}>{editingBooking.location} {editingBooking.desk ? `(${editingBooking.desk})` : ''}</option>
                  </select>
                </div>
              </div>
              
              {/* Date */}
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

              {/* Time (Start & End) */}
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

            {/* Footer Buttons */}
            <div className="p-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold border border-gray-300 dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                className="px-5 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
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