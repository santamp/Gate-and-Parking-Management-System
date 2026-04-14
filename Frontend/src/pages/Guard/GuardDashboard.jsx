import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle, LogOut, Map as MapIcon, Loader2 } from 'lucide-react';
import gateService from '../../services/gateService';
import { useSocket } from '../../context/SocketContext';

const GuardDashboard = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await gateService.getVehicleLogs();
        setLogs(response.data);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    };

    const handleLogUpdated = (updatedLog) => {
      setLogs((prev) =>
        prev.map((log) => (log._id === updatedLog._id ? { ...log, ...updatedLog } : log))
      );
    };

    socket.on('new_vehicle_log', handleNewLog);
    socket.on('log_updated', handleLogUpdated);

    return () => {
      socket.off('new_vehicle_log', handleNewLog);
      socket.off('log_updated', handleLogUpdated);
    };
  }, [socket]);

  const pendingCount = logs.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-6 md:space-y-8 pb-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Welcome Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Main Gate</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{logs.filter(l => ['inside', 'approved', 'pending'].includes(l.status)).length} active today</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => navigate('/guard/entry')}
          className="bg-emerald-500 rounded-3xl p-5 shadow-md hover:bg-emerald-600 active:scale-95 transition-all flex flex-col items-center gap-2 text-center text-white"
        >
          <div className="bg-white/20 text-white p-2.5 rounded-2xl backdrop-blur-sm">
            <PlusCircle size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-xs">Vehicle Entry</h3>
            <p className="text-[8px] text-emerald-100 font-bold uppercase tracking-widest mt-0.5">Start record</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/guard/exit')}
          className="bg-rose-500 rounded-3xl p-5 shadow-md hover:bg-rose-600 active:scale-95 transition-all flex flex-col items-center gap-2 text-center text-white"
        >
          <div className="bg-white/20 text-white p-2.5 rounded-2xl backdrop-blur-sm">
            <LogOut size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-xs">Vehicle Exit</h3>
            <p className="text-[8px] text-rose-100 font-bold uppercase tracking-widest mt-0.5">Checkout</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/guard/site-map')}
          className="bg-blue-500 rounded-3xl p-5 shadow-md hover:bg-blue-600 active:scale-95 transition-all flex flex-col items-center gap-2 text-center text-white"
        >
          <div className="bg-white/20 text-white p-2.5 rounded-2xl backdrop-blur-sm">
            <MapIcon size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-xs">Search Unit</h3>
            <p className="text-[8px] text-blue-100 font-bold uppercase tracking-widest mt-0.5">Find resident</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/guard/pending')}
          className="bg-amber-500 rounded-3xl p-5 shadow-md hover:bg-amber-600 active:scale-95 transition-all flex flex-col items-center gap-2 text-center text-white relative"
        >
          {pendingCount > 0 && (
            <span className="absolute top-4 right-4 bg-white text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">{pendingCount}</span>
          )}
          <div className="bg-white/20 text-white p-2.5 rounded-2xl backdrop-blur-sm">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-xs">Pending</h3>
            <p className="text-[8px] text-amber-100 font-bold uppercase tracking-widest mt-0.5">Approvals</p>
          </div>
        </button>
      </div>

      {/* Live Queue */}
      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Activity</h3>
        </div>
        
        <div className="space-y-3">
          {loading ? (
             <div className="flex justify-center py-10 italic opacity-40">
                <Loader2 size={32} className="animate-spin" />
             </div>
          ) : logs.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 italic text-gray-400 text-xs font-bold uppercase">
                Zero traffic detected
             </div>
          ) : (
            logs.slice(0, 5).map(log => (
              <div key={log._id} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transform transition-all hover:scale-[1.01] ${log.status === 'exited' ? 'opacity-60' : ''}`}>
                <div className="flex gap-3 items-center">
                  <div className={`p-2.5 rounded-full shadow-inner ${
                    log.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    log.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    log.status === 'exited' ? 'bg-red-100 text-red-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {log.status === 'pending' ? <Clock size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{log.vehicleNumber}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {log.occupierMappedId?.name} • <span className="text-green-600 italic">Unit {log.unitName}</span>
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                   log.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                   log.status === 'rejected' ? 'text-red-600 bg-red-50' :
                   log.status === 'exited' ? 'text-red-600 bg-red-50' :
                   log.status === 'inside' ? 'text-green-600 bg-green-50' :
                   'text-gray-600 bg-gray-50'
                }`}>
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
};

export default GuardDashboard;
