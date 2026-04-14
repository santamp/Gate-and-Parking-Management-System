import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Bell, Clock, Truck, ChevronRight, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import gateService from '../../services/gateService';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const OccupierDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, today: 0, guests: 0 });
  const [pendingLog, setPendingLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_unit_room', user._id);

    const handleNewLog = (event) => {
      const log = event?.data || event;
      const logOccupierId = log?.occupierMappedId?._id || log?.occupierMappedId;
      if (!logOccupierId || logOccupierId === user._id) {
        toast('New Gate Approval Request!', { 
          id: log._id || 'new-gate-approval', 
          icon: '🔔', 
          duration: 5000 
        });
      }
      fetchDashboardData();
    };

    const handleLogUpdated = (updatedLog) => {
      // If it belongs to us, refresh
      fetchDashboardData();
    };

    socket.on(`unit_${user._id}`, handleNewLog);
    socket.on('new_vehicle_log', handleNewLog);
    socket.on('log_updated', handleLogUpdated);

    return () => {
      socket.off(`unit_${user._id}`, handleNewLog);
      socket.off('new_vehicle_log', handleNewLog);
      socket.off('log_updated', handleLogUpdated);
    };
  }, [socket, user]);

  const fetchDashboardData = async () => {
    try {
      const res = await gateService.getVehicleLogs();
      const logs = res.data;

      const pending = logs.filter(l => l.status === 'pending');
      const todayLogs = logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString());
      const guestLogs = todayLogs.filter(l => l.vehicleType === 'Guest' || l.vehicleType === 'Car');

      setStats({
        pending: pending.length,
        today: todayLogs.length,
        guests: guestLogs.length
      });

      if (pending.length > 0) {
        setPendingLog(pending[0]);
      } else {
        setPendingLog(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await gateService.updateVehicleStatus(id, { status });
      toast.success(`Entry ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">

      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {pendingLog ? `Unit ${pendingLog.unitName}` : user?.name || 'Welcome!'}
          </h2>
          <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-wider">
            {pendingLog ? `${pendingLog.blockName} • ${user?.name}` : 'Welcome Back'}
          </p>
        </div>
        <button className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors relative">
          <Bell size={24} />
          {stats.pending > 0 && (
            <div className="absolute top-3 right-3 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending</p>
          <p className={`text-xl font-black ${stats.pending > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today</p>
          <p className="text-xl font-black text-emerald-600">{stats.today}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Guests</p>
          <p className="text-xl font-black text-amber-500">{stats.guests}</p>
        </div>
      </div>

      {/* Action Required Board */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Action Required</h3>
        <button
          onClick={() => navigate('/occupier/approvals')}
          className="text-indigo-600 text-sm font-bold hover:underline"
        >
          View All
        </button>
      </div>

      {/* Pending Vehicle Card */}
      {pendingLog ? (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-1 ring-red-50 group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
          <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
            <div className="flex gap-2 items-center text-red-600">
              <ShieldAlert size={20} className="animate-pulse" />
              <span className="font-black text-[10px] tracking-[0.2em] uppercase">Gate Approval Request</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={12} />
              <span className="text-[10px] font-bold">
                {new Date(pendingLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="p-6 flex gap-5">
            <div className="h-20 w-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-indigo-200 transition-colors">
              <Truck size={32} className="text-gray-300 group-hover:text-indigo-300 transition-colors" />
            </div>

            <div className="flex-1">
              <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{pendingLog.vehicleNumber}</h4>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100">{pendingLog.vehicleType}</span>
              </div>
              <p className="text-sm text-gray-500 mt-3 font-semibold leading-relaxed">
                Driver: {pendingLog.driverName || 'Not Specified'} <br />
                <span className="text-[11px] text-gray-400">Security Check Passed • Entry Gate</span>
              </p>
            </div>
          </div>

          <div className="flex bg-gray-50/50 p-4 gap-4 border-t border-gray-100">
            <button
              onClick={() => handleAction(pendingLog._id, 'rejected')}
              className="flex-1 bg-white hover:bg-red-50 border border-gray-200 text-red-600 font-black text-sm py-4 rounded-2xl shadow-sm transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              <X size={18} /> Reject
            </button>
            <button
              onClick={() => handleAction(pendingLog._id, 'approved')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-indigo-500/40 transition-all flex justify-center items-center gap-2"
            >
              <Check size={18} /> Approve
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 text-center">
          <Check className="mx-auto text-emerald-500 mb-3" size={32} />
          <p className="font-black text-emerald-900">All Captured Up!</p>
          <p className="text-xs text-emerald-600 font-bold uppercase mt-1">No pending actions required</p>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="text-lg font-black text-gray-900 tracking-tight pt-2">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <button
          onClick={() => navigate('/occupier/profile')}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left group"
        >
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <User size={24} />
          </div>
          <h4 className="font-black text-gray-900">Unit Details</h4>
          <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Manage Profile</p>
        </button>

        <button
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left group"
          onClick={() => navigate('/occupier/history')}
        >
          <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <h4 className="font-black text-gray-900">Entry Logs</h4>
          <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">View History</p>
        </button>
      </div>

    </div>
  );
};

export default OccupierDashboard;
