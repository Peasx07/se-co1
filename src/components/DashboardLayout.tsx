'use client';

import Link from 'next/link';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { LayoutDashboard, Calendar, Users, CreditCard, Settings, LogOut, Bell, Search, Shield, Building, BarChart, CalendarCheck, IdCard, Receipt } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const isAdmin = location?.includes('/admin');

  // 🌟 1. สร้างตัวแปร URL โดยดึงจาก Environment ant
  // (แก้ลิงก์ข้างล่างนี้ให้ตรงกับ URL Render ของคุณด้วยนะครับ)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-august-pen-gay.onrender.com/api/v1';

  const navItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Building, label: 'Spaces', path: '/admin/spaces' },
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Users, label: 'Members', path: '/admin/members' },
    { icon: BarChart, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Building, label: 'Spaces', path: '/spaces' },
    { icon: CalendarCheck, label: 'Bookings', path: '/book' },
    { icon: Users, label: 'Members', path: '/members' },
    { icon: IdCard, label: 'Membership', path: '/membership' },
    { icon: Receipt, label: 'Invoices', path: '/invoices' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];
  
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 🌟 2. เปลี่ยน localhost เป็น API_URL
      await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      }
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="font-bold text-xl tracking-tight">WorkSpace</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-3 py-2">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPs4iZAW-L2ig0iTXMC8fo-r0t6FiEcdU23A&s" alt="User" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{isAdmin ? 'Admin User' : 'Jame Dawson'}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">{isAdmin ? 'System Admin' : 'Premium Member'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full text-left mt-2 flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light dark:text-text-dark"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            {!isAdmin && (
              <Link href="/book" className="hidden sm:flex bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                Book a Desk
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}