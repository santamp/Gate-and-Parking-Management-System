import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, List, User as UserIcon, LogOut, ShieldCheck, Menu, User, ChevronRight } from 'lucide-react';
import authService from '../services/authService';

const MobileLayout = () => {
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
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/guard', end: true },
    { icon: <List className="w-5 h-5" />, label: 'History', path: '/guard/logs', end: false },
    { icon: <UserIcon className="w-5 h-5" />, label: 'Profile', path: '/guard/profile', end: false },
  ];

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col h-[100dvh] w-full bg-slate-50 relative overflow-hidden font-sans">
        {/* Top Header */}
        <header className="p-4 border-b border-gray-200 flex justify-between items-center z-10 bg-white shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-800 tracking-tight">GateSync</h1>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Duty: Main Gate</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <LogOut size={18} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around p-2 z-10 shadow-lg pb-safe">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${isActive ? 'text-white bg-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* DESKTOP/TABLET LAYOUT (Like AdminLayout but with Dark Theme) */}
      <div className="hidden md:flex h-screen bg-slate-50 overflow-hidden font-sans relative w-full">
        {/* Sidebar */}
        <aside className={`bg-slate-800 flex flex-col shadow-xl z-50 transition-all duration-300 relative h-full shrink-0 ${isSidebarOpen ? 'w-72' : 'w-20'
          }`}>
          <div className={`p-4 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b border-slate-700`}>
            <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
              <div className="h-8 w-8 min-w-[32px] bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <ShieldCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-black text-white tracking-tight whitespace-nowrap">Society Guard</h1>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest whitespace-nowrap">Security Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
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
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
                `}
                title={!isSidebarOpen ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        {item.icon}
                      </span>
                      {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
                    </div>
                    {isSidebarOpen && <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-indigo-200' : 'text-slate-300'}`} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-xl transition-all duration-200 font-bold text-sm`}
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
          <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                Security Checkpoint Access
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-bold text-slate-800">{user?.name || 'Security Guard'}</span>
                <span className="text-[9px] font-medium text-indigo-600 uppercase tracking-tighter">System Access: Guard</span>
              </div>
              <div className="h-8 w-8 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm overflow-hidden flex items-center justify-center text-indigo-600">
                <User size={16} />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 w-full relative">
            <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MobileLayout;
