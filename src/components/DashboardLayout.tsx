import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate
import { LayoutDashboard, Calendar, Users, CreditCard, Settings, LogOut, Bell, Search, Shield, Building, BarChart, CalendarCheck, IdCard, Receipt } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate(); // เรียกใช้งาน useNavigate
  const isAdmin = location.pathname.includes('/admin');

  // ฟังก์ชันสำหรับ Sign Out
  const handleLogout = () => {
    localStorage.removeItem('userRole'); // ลบสิทธิ์การเข้าถึง
    navigate('/login'); // เด้งกลับไปหน้า Login
  };

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

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="font-bold text-xl tracking-tight">WorkSpace</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
            <img src="https://picsum.photos/seed/user/40/40" alt="User" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{isAdmin ? 'Admin User' : 'Alex Johnson'}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">{isAdmin ? 'System Admin' : 'Premium Member'}</p>
            </div>
          </div>
          {/* เพิ่ม onClick={handleLogout} ตรงปุ่มนี้ */}
          <button 
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              <Link to="/book" className="hidden sm:flex bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                Book a Desk
              </Link>
            )}
            {/* Mobile menu button could go here */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}