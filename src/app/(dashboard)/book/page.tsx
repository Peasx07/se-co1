'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, MapPin, Info, Check, Loader2 } from 'lucide-react';

function BookContent() {
  const searchParams = useSearchParams();
  
  // 🔴 ดึงข้อมูลทั้งหมดจาก URL ถ้าไม่มีให้ใช้ค่าเริ่มต้น
  const spaceName = searchParams.get('name') || 'Downtown Executive Suite';
  const spaceImage = searchParams.get('image') || 'https://picsum.photos/seed/downtown/1200/400';
  const spacePrice = searchParams.get('price') || '$25.00';
  
  // แปลง type จาก URL ให้ตรงกับ id ของ tab อัตโนมัติ
  const rawType = searchParams.get('type');
  let defaultTab = 'hot-desk';
  if (rawType === 'Dedicated Desk') defaultTab = 'dedicated';
  if (rawType === 'Private Office') defaultTab = 'office';
  if (rawType === 'Meeting Room') defaultTab = 'meeting';

  const [selectedTab, setSelectedTab] = useState(defaultTab);
  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  
  const [date, setDate] = useState('2023-09-15');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tabs = [
    { id: 'hot-desk', label: 'Hot Desk' },
    { id: 'dedicated', label: 'Dedicated Desk' },
    { id: 'office', label: 'Private Office' },
    { id: 'meeting', label: 'Meeting Room' },
  ];

  const desks = Array.from({ length: 24 }, (_, i) => ({
    id: `desk-${i + 1}`,
    status: i % 5 === 0 ? 'occupied' : 'available',
    label: `D${i + 1}`
  }));

  const handleBooking = () => {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setIsSuccess(true);
    }, 1500);
  };

  const resetBooking = () => {
    setIsSuccess(false);
    setSelectedDesk(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Header - 🔴 แสดงรูปและชื่อของสถานที่ที่กดมา */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-8">
        <img 
          src={spaceImage} 
          alt={spaceName} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
          <div className="flex items-center gap-2 text-sm font-medium mb-2 opacity-90">
            <MapPin className="w-4 h-4" />
            {spaceName}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{spaceName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Space Type Tabs */}
          <section>
            <h2 className="text-xl font-bold mb-4">Type Space</h2>
            <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 ${
                    selectedTab === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* Floor Plan */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Choose Desk Location</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-text-muted-light dark:text-text-muted-dark">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></div>
                  <span className="text-text-muted-light dark:text-text-muted-dark">Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-text-muted-light dark:text-text-muted-dark">Selected</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-4">
                  {desks.map((desk) => {
                    const isSelected = selectedDesk === desk.id;
                    const isOccupied = desk.status === 'occupied';
                    
                    return (
                      <button
                        key={desk.id}
                        disabled={isOccupied || isSuccess}
                        onClick={() => setSelectedDesk(desk.id)}
                        className={`
                          aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                          ${isOccupied 
                            ? 'bg-red-50 dark:bg-red-900/10 text-red-400 dark:text-red-500 border border-red-100 dark:border-red-900/30 cursor-not-allowed' 
                            : isSelected
                              ? 'bg-primary text-white shadow-md scale-105'
                              : 'bg-gray-50 dark:bg-gray-800/50 text-text-muted-light dark:text-text-muted-dark border border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-primary/5'
                          }
                        `}
                      >
                        {desk.label}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-8 flex justify-between items-center px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-text-muted-light dark:text-text-muted-dark font-medium">
                  <span>Entrance</span>
                  <span>Lounge Area</span>
                  <span>Kitchen</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Booking Details */}
        <div className="lg:col-span-1">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 sticky top-24">
            
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
                <p className="text-text-muted-light dark:text-text-muted-dark mb-6">
                  Desk {selectedDesk?.split('-')[1]} is reserved for you on {date}.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-left mb-6 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Location:</span>
                    <span className="font-medium text-right">{spaceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Time:</span>
                    <span className="font-medium">{startTime} - {endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Amount Paid:</span>
                    <span className="font-medium text-primary">{spacePrice}</span>
                  </div>
                </div>

                <button 
                  onClick={resetBooking}
                  className="w-full py-3 rounded-xl font-medium border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Book Another Space
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6">Booking Details</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
                      <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light dark:text-text-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                        <select 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text-light dark:text-text-dark"
                        >
                          <option>09:00 AM</option>
                          <option>10:00 AM</option>
                          <option>11:00 AM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                        <select 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text-light dark:text-text-dark"
                        >
                          <option>05:00 PM</option>
                          <option>06:00 PM</option>
                          <option>07:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light dark:border-border-dark">
                    <h3 className="font-medium mb-3">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted-light dark:text-text-muted-dark">Location</span>
                        {/* 🔴 แสดงชื่อสถานที่ตามที่กดมา */}
                        <span className="font-medium">{spaceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted-light dark:text-text-muted-dark">Space Type</span>
                        <span className="font-medium">{tabs.find(t => t.id === selectedTab)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted-light dark:text-text-muted-dark">Desk Selection</span>
                        <span className="font-medium">{selectedDesk ? `Desk ${selectedDesk.split('-')[1]}` : 'Not selected'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light dark:border-border-dark">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-lg">Total</span>
                      {/* 🔴 แสดงราคาตามสถานที่ที่กดมา */}
                      <span className="font-bold text-2xl text-primary">{spacePrice}</span>
                    </div>
                    
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

// สร้าง Wrapper ครอบด้วย Suspense 
export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Booking Details...</div>}>
      <BookContent />
    </Suspense>
  );
}