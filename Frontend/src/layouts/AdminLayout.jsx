import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  Users,
  Map,
  FileText,
  LogOut,
  CreditCard,
  ShieldAlert,
  Truck,
  Building2,
  Activity,
  ChevronRight,
  Zap
} from 'lucide-react';
import authService from '../services/authService';


const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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


  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <Building2 size={20} />, label: 'Warehouses', path: '/admin/projects' },
    { icon: <Map size={20} />, label: 'Warehouse Mapping', path: '/admin/mapping' },
    { icon: <Users size={20} />, label: 'User Management', path: '/admin/users' },
    { icon: <Truck size={20} />, label: 'Vehicle Logs', path: '/admin/vehicle-logs' },
    { icon: <ShieldAlert size={20} />, label: 'Approval Logs', path: '/admin/approval-logs' },
    { icon: <CreditCard size={20} />, label: 'Billing & Payments', path: '/admin/billing' },
    { icon: <Zap size={20} />, label: 'Revenue Config', path: '/admin/revenue' },
    { icon: <Activity size={20} />, label: 'Audit Logs', path: '/admin/audit-logs' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col shadow-sm z-50 transition-all duration-300 fixed md:relative h-full ${isSidebarOpen
          ? 'translate-x-0 w-72'
          : '-translate-x-full md:translate-x-0 md:w-20'
        }`}>
        <div className={`p-4 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b border-gray-50`}>
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="h-8 w-8 min-w-[32px] bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
              <Truck size={18} />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">GateSync</h1>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest whitespace-nowrap">Admin Control</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `
                flex items-center ${isSidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-amber-50 text-amber-700 shadow-sm shadow-amber-600/5'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
              title={!isSidebarOpen ? item.label : ''}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {item.icon}
                    </span>
                    {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
                  </div>
                  {isSidebarOpen && <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-amber-400' : 'text-gray-300'}`} />}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors md:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
              Centralized Management System
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-gray-900">Super Admin</span>
              <span className="text-[9px] font-medium text-amber-600 uppercase tracking-tighter">System Access: Full</span>
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-full border border-gray-100 shadow-sm overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
