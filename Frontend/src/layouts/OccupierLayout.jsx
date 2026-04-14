import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, List, User as UserIcon, LogOut, ShieldCheck, Menu, User, ChevronRight } from 'lucide-react';
import authService from '../services/authService';
import NotificationPanel from '../components/NotificationPanel';

const OccupierLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  // Auto-manage sidebar state on resize and navigation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Home className="w-6 h-6 md:w-5 md:h-5" />, label: 'Home', path: '/occupier', end: true },
    { icon: <ShieldCheck className="w-6 h-6 md:w-5 md:h-5" />, label: 'Approvals', path: '/occupier/approvals', end: false },
    { icon: <List className="w-6 h-6 md:w-5 md:h-5" />, label: 'History', path: '/occupier/history', end: false },
    { icon: <UserIcon className="w-6 h-6 md:w-5 md:h-5" />, label: 'Profile', path: '/occupier/profile', end: false },
  ];

  return (
    <>
      {/* MOBILE LAYOUT (Exactly as originally coded in MobileLayout for occupier) */}
      <div className="md:hidden flex flex-col h-[100dvh] w-full bg-white relative overflow-hidden">
        {/* Top Header */}
        <header className="p-4 shadow-md flex justify-between items-center z-10 text-white bg-indigo-600">
          <div>
            <h1 className="text-lg font-bold">GateSync</h1>
            <p className="text-xs opacity-80">Occupier Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationPanel notificationPath="/occupier/notifications" tone="indigo" />
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <NavLink 
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* DESKTOP/TABLET LAYOUT (Like AdminLayout) */}
      <div className="hidden md:flex h-screen bg-gray-50 overflow-hidden font-sans relative w-full">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col shadow-sm z-50 transition-all duration-300 relative h-full shrink-0 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}>
          <div className={`p-4 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b border-gray-50`}>
             <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
                <div className="h-8 w-8 min-w-[32px] bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <ShieldCheck size={18} />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">GateSync</h1>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest whitespace-nowrap">Occupier Portal</p>
                </div>
             </div>
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
             >
                <Menu size={20} />
             </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center ${isSidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-600/5' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
                title={!isSidebarOpen ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {item.icon}
                      </span>
                      {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
                    </div>
                    {isSidebarOpen && <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'text-gray-300'}`} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-bold text-sm`}
              title={!isSidebarOpen ? "Logout" : ""}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20">
             <div className="flex items-center gap-3">
               <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                 Unit Management System
               </h2>
             </div>
             <div className="flex items-center gap-4">
               <NotificationPanel notificationPath="/occupier/notifications" tone="indigo" />
               <div className="flex flex-col items-end mr-1">
                 <span className="text-xs font-bold text-gray-900">{user?.name || 'Occupier'}</span>
                 <span className="text-[9px] font-medium text-indigo-600 uppercase tracking-tighter">System Access: Unit</span>
               </div>
               <div className="h-8 w-8 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm overflow-hidden flex items-center justify-center text-indigo-600">
                  <User size={16} />
               </div>
             </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 w-full relative">
             <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
                <Outlet />
             </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OccupierLayout;
