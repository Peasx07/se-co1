'use client';

import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

// สร้าง Type ให้ตรงกับโมเดล Coworking ในฐานข้อมูล
interface Coworking {
  _id: string;
  name: string;
  address: string;
  price_per_hour: number;
  status: string;
  type: string;
}

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState<Coworking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🌟 เพิ่ม API_URL เพื่อให้รองรับการ Deploy บน Vercel
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-august-pen-gay.onrender.com/api/v1';

  // ดึงข้อมูลเมื่อเปิดหน้า
  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      // 🌟 เปลี่ยน localhost เป็น API_URL
      const res = await axios.get(`${API_URL}/coworkings`);
      setSpaces(res.data.data);
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError('ไม่สามารถดึงข้อมูลสถานที่ได้');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันสำหรับ Admin ลบสถานที่ (เรียก API DELETE /api/v1/coworkings/:id)
  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่นี้? ข้อมูลการจองที่เกี่ยวข้องจะถูกลบไปด้วย')) return;
    
    try {
      const token = localStorage.getItem('token');
      // 🌟 เปลี่ยน localhost เป็น API_URL
      await axios.delete(`${API_URL}/coworkings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      // ลบสำเร็จ ให้ดึงข้อมูลมาแสดงใหม่
      fetchSpaces();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('ไม่สามารถลบได้: ' + (err.response?.data?.message || 'เกิดข้อผิดพลาด'));
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Spaces Management</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">Manage your workspace inventory and availability.</p>
        </div>
        {/* ปุ่มนี้เดี๋ยวเราค่อยเชื่อมไปหน้าฟอร์มสร้างสถานที่ (Create Coworking) */}
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Space
        </button>
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
                    ยังไม่มีข้อมูลสถานที่ในระบบ
                  </td>
                </tr>
              ) : (
                spaces.map((space) => (
                  <tr key={space._id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                    <td className="p-4 text-text-muted-light dark:text-text-muted-dark">${space.price_per_hour}</td>
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
                        <button className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-text-muted-light dark:text-text-muted-dark">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(space._id)}
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
    </div>
  );
}