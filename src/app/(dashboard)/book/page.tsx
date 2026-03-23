'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, MapPin, Info, Check, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

function BookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const spaceId = searchParams.get('id');
  const spaceName = searchParams.get('name') || 'Select a Workspace';
  
  const imgParam = searchParams.get('image');
  const spaceImage = imgParam && imgParam !== 'undefined' 
    ? imgParam 
    : 'https://picsum.photos/seed/downtown/1200/400';

  const priceParam = searchParams.get('price');
  const spacePrice = priceParam && priceParam !== 'undefined' ? priceParam : '0';

  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(''); 

  const handleBooking = async () => {
    if (!spaceId) {
      setError('ไม่พบข้อมูลสถานที่ กรุณากลับไปเลือกสถานที่จากหน้า Spaces ใหม่');
      return;
    }
    
    setIsBooking(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // 🟢 อัปเดตข้อมูลที่ส่งไปให้ Backend ใส่เวลาและโต๊ะเข้าไปด้วย
      const res = await axios.post(`http://localhost:5000/api/v1/coworkings/${spaceId}/reservations`, {
        date: date,
        startTime: startTime,
        endTime: endTime,
        desk: selectedDesk
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      setIsSuccess(true);
      
      setTimeout(() => {
        router.push('/dashboard'); 
      }, 2000);

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || err.response?.data?.msg || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
        <img 
          src={spaceImage} 
          alt={spaceName} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <div className="flex items-center gap-2 text-sm font-medium mb-2 opacity-90">
            <MapPin className="w-4 h-4" />
            <span>Bangkok, Thailand</span>
          </div>
          <h1 className="text-3xl font-bold">{spaceName}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Select a Desk</h2>
            </div>
            
            <div className="aspect-[16/9] bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex gap-4 text-xs text-text-muted-light dark:text-text-muted-dark">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div> Available</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary rounded"></div> Selected</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 dark:bg-gray-800 rounded"></div> Occupied</div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-4 max-w-lg mx-auto h-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((desk) => {
                  const isOccupied = [2, 5, 8].includes(desk);
                  const isSelected = selectedDesk === `Desk ${desk}`;
                  
                  return (
                    <button
                      key={desk}
                      disabled={isOccupied}
                      onClick={() => setSelectedDesk(`Desk ${desk}`)}
                      className={`h-16 rounded-xl border transition-all flex items-center justify-center font-medium ${
                        isOccupied 
                          ? 'bg-gray-200 dark:bg-gray-800 border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      D{desk}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Booking Details</h2>
            
            {isSuccess ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm mb-6">Your workspace is ready for you.</p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
                      <input 
                        type="date" 
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full pl-9 pr-2 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                        <input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full pl-9 pr-2 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-light dark:border-border-dark pt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Desk Selection</span>
                    <span className="font-medium">{selectedDesk || 'None'}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Price per day</span>
                    <span className="font-medium">${spacePrice}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${selectedDesk ? spacePrice : '0.00'}</span>
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={handleBooking}
                      disabled={!selectedDesk || isBooking}
                      className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                        selectedDesk 
                          ? 'bg-primary hover:bg-primary-hover text-white' 
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isBooking ? (
                        <>Processing... <Loader2 className="w-5 h-5 animate-spin" /></>
                      ) : selectedDesk ? (
                        <>Confirm Booking <Check className="w-5 h-5" /></>
                      ) : (
                        'Select a Desk'
                      )}
                    </button>
                    <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark mt-3 flex items-center justify-center gap-1">
                      <Info className="w-3 h-3" /> Free cancellation up to 24h before
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Booking Details...</div>}>
      <BookContent />
    </Suspense>
  );
}