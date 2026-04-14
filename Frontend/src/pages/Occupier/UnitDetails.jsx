import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, CreditCard, ChevronRight, Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const UnitDetails = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">

      {/* Profile Card */}
      <div className="flex flex-col items-center py-8">
        <div className="h-28 w-28 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/10 border border-gray-100 flex items-center justify-center mb-6 relative group transition-all duration-500 hover:scale-105">
          <User size={56} className="text-indigo-600 transition-transform group-hover:scale-110" />
          <div className="absolute -bottom-1 -right-1 h-9 w-9 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
            <Shield size={16} fill="currentColor" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user?.name || 'Loading...'}</h2>
        <div className="flex items-center gap-2 mt-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-100 px-3 py-1 rounded-full">
          <MapPin size={12} />
          <span>{user?.role === 'OCCUPIER' ? 'Primary Occupier' : user?.role || 'User'}</span>
        </div>
      </div>

      {/* Unit Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight px-1 uppercase text-[11px] tracking-widest text-gray-400">Account Information</h3>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <div className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
              <p className="font-bold text-gray-900">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
              <p className="font-bold text-gray-900">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-[2rem] flex items-center justify-center gap-3 transition-colors active:scale-[0.98] mt-8"
      >
        <LogOut size={20} />
        Sign Out Securely
      </button>

      <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] pb-10">
        GateSync v1.0.4 • Build 882
      </p>

    </div>
  );
};

export default UnitDetails;
