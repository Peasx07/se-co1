'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Coworking {
  _id: string;
  name: string;
  address: string;
  price_per_hour: number;
  type: string;
  rating: number;
  picture?: string;
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Coworking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🌟 เพิ่ม State สำหรับเก็บค่าตัวเลือกการ Sort
  const [sortBy, setSortBy] = useState<string>('default');

  const fallbackImages = [
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572025442646-866d16c84a54?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1628611225249-6c3c7c689552?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
  ];

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/coworkings');
        setSpaces(res.data.data);
      } catch (err) {
        console.error('Error fetching spaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  // 🌟 ฟังก์ชันสำหรับจัดการการ Sort ข้อมูลก่อนนำไปแสดงผล
  const sortedSpaces = [...spaces].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return a.price_per_hour - b.price_per_hour; // ราคาน้อยไปมาก
    } else if (sortBy === 'rating_desc') {
      // เรตติ้งมากไปน้อย (ถ้าไม่มี rating ให้ถือว่าเป็น 0 เพื่อกัน error)
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0; // default (ตามที่ดึงมาจาก API)
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#ea580c]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 🌟 ปรับ Header ให้มี Dropdown สำหรับ Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Spaces</h1>
        
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-[#ea580c] focus:border-[#ea580c] block p-2 outline-none transition-colors shadow-sm cursor-pointer"
          >
            <option value="default">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="rating_desc">Rating: High to Low</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 🌟 เปลี่ยนจาก spaces.map เป็น sortedSpaces.map */}
        {sortedSpaces.map((space, index) => {
          const defaultImage = space.picture || fallbackImages[index % fallbackImages.length];

          return (
            <div 
              key={space._id} 
              className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                <img 
                  src={defaultImage} 
                  alt={space.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImages[index % fallbackImages.length];
                  }}
                />
                
                <div className="absolute top-3 left-3 bg-[#ea580c] text-white text-[10px] font-bold px-2 py-1.5 rounded uppercase tracking-wider shadow-sm">
                  {space.type || 'WORKSPACE'}
                </div>
                
                <div className="absolute top-3 right-3 bg-white text-gray-900 text-[11px] font-bold px-2 py-1.5 rounded flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {space.rating || '4.5'}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-1.5 text-gray-900 dark:text-white line-clamp-1">
                  {space.name}
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1.5 mb-6 line-clamp-1">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  {space.address}
                </p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    ${space.price_per_hour}<span className="text-xs text-gray-500 font-normal">/hr</span>
                  </div>
                  
                  <Link 
                    href={`/book?id=${space._id}&name=${encodeURIComponent(space.name)}&image=${encodeURIComponent(defaultImage)}&price=${space.price_per_hour}&type=${space.type}`}
                    className="text-[#ea580c] hover:text-[#c2410c] font-semibold text-sm transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedSpaces.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No spaces available at the moment.
        </div>
      )}
    </div>
  );
}