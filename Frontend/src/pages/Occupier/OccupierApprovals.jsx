import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Clock, Truck, Info, Search } from 'lucide-react';
import gateService from '../../services/gateService';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import authService from '../../services/authService';

const OccupierApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!socket || !user) return;

    socket.emit('join_unit_room', user._id);

    const handleNewLog = () => {
      fetchPendingRequests();
    };

    const handleLogUpdated = () => {
      fetchPendingRequests();
    };

    socket.on(`unit_${user._id}`, handleNewLog);
    socket.on('log_updated', handleLogUpdated);

    return () => {
      socket.off(`unit_${user._id}`, handleNewLog);
      socket.off('log_updated', handleLogUpdated);
    };
  }, [socket]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await gateService.getVehicleLogs({ status: 'pending' });
      setRequests(res.data);
    } catch (error) {
      toast.error('Error fetching pending requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        'not-mine': 'not_my_vehicle'
      };

      await gateService.updateVehicleStatus(id, { status: statusMap[action] });
      toast.success(`Vehicle entry ${action}ed`);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-gray-400 mt-4 font-medium">Loading approval requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pending Approvals</h2>
        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{requests.length} Requests</span>
      </div>

      {requests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {requests.map(request => (
            <div key={request._id} className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900">{request.vehicleNumber}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{request.vehicleType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold">{new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Driver Details</span>
                    <button className="text-indigo-600"><Info size={14} /></button>
                  </div>
                  <p className="text-sm font-bold text-gray-700">{request.driverName || 'Not Specified'}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Verified by Security • Entry Gate</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(request._id, 'reject')}
                    className="flex-1 bg-white hover:bg-red-50 border border-gray-200 text-red-600 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2"
                  >
                    <X size={18} /> Reject
                  </button>
                   <button 
                    onClick={() => handleAction(request._id, 'not-mine')}
                    className="px-4 bg-gray-50 text-gray-400 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-all text-xs"
                    title="Not My Vehicle"
                  >
                    Not Mine
                  </button>
                  <button 
                    onClick={() => handleAction(request._id, 'approve')}
                    className="flex-[1.5] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex justify-center items-center gap-2"
                  >
                    <Check size={18} /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <Check size={48} strokeWidth={3} />
          </div>
          <h3 className="text-xl font-black text-gray-900">All Caught Up!</h3>
          <p className="text-sm text-gray-400 mt-2 font-medium">No pending gate approval requests at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default OccupierApprovals;
