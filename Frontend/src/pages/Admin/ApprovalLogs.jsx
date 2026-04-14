import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical,
  User,
  Truck,
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import adminService from '../../services/adminService';

const ApprovalLogs = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === 'pending' ? 'PENDING_APPROVAL' : '';
      const data = await adminService.getVehicleLogs({ 
        status: statusFilter,
        limit: 50 
      });
      
      // If 'resolved' tab is active, we filter those manually or by multiple statuses if backend supported it.
      // For now, let's filter purely on results.
      if (activeTab === 'resolved') {
        setLogs(data.logs.filter(l => ['APPROVED', 'REJECTED', 'EXITED'].includes(l.status)));
      } else {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Fetch approvals error:', err);
      setError('Failed to load approval logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const handleOverride = async (id, status) => {
    const reason = window.prompt(`Enter reason for ${status.toLowerCase()}:`);
    if (reason !== null) {
      try {
        await adminService.overrideLogStatus(id, { status, overrideReason: reason });
        fetchApprovals();
      } catch (err) {
        alert('Failed to override status');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Consent Registry</h1>
        <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
          {loading && <Loader2 size={12} className="animate-spin" />}
          Audit history of unit-level destination approvals
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
           <div className="flex bg-gray-50 p-1 rounded-lg">
             {['pending', 'resolved', 'all'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t}
                </button>
             ))}
           </div>
           
           <div className="flex gap-4">
              <button 
                onClick={fetchApprovals}
                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-sm"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
        <table className="w-full text-left">
           <thead>
             <tr className="bg-gray-50/30">
               <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Request Node</th>
               <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Unit Destination</th>
               <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Wait-Time</th>
               <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status Node</th>
               <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Records</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {loading ? (
               [...Array(3)].map((_, i) => (
                 <tr key={i} className="animate-pulse">
                   {[...Array(5)].map((_, j) => (
                     <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-50 rounded w-full"></div></td>
                   ))}
                 </tr>
               ))
             ) : logs.length === 0 ? (
               <tr>
                 <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium uppercase tracking-widest text-xs">
                   No approval logs found
                 </td>
               </tr>
             ) : (
               logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-900 text-white rounded-lg flex items-center justify-center shadow-md">
                        <Truck size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm tracking-tight">{log.vehicleNumber}</div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase">{log.vehicleType} Request</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-1.5 font-semibold text-gray-700 text-sm mb-0.5">
                        <Building2 size={12} className="text-gray-400" />
                        {log.occupierMappedId?.name || 'Gate Access'}
                     </div>
                     <div className="text-[10px] text-gray-400 font-medium">
                       {new Date(log.entryTime).toLocaleDateString()}, {new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider font-mono">
                        <Clock size={12} className={log.status === 'PENDING_APPROVAL' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} />
                        {Math.floor((new Date() - new Date(log.entryTime)) / 60000)}m Elasped
                     </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-2">
                        {log.status === 'APPROVED' && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {log.status === 'PENDING_APPROVAL' && <Clock size={14} className="text-amber-500 animate-pulse" />}
                        {log.status === 'REJECTED' && <XCircle size={14} className="text-rose-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'APPROVED' ? 'text-emerald-500' : 
                          log.status === 'PENDING_APPROVAL' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {log.status.replace('_', ' ')}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                       {log.status === 'PENDING_APPROVAL' ? (
                         <>
                           <button 
                             onClick={() => handleOverride(log._id, 'APPROVED')}
                             title="Approve"
                             className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                           >
                             <CheckCircle2 size={18} />
                           </button>
                           <button 
                             onClick={() => handleOverride(log._id, 'REJECTED')}
                             title="Reject"
                             className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                           >
                             <XCircle size={18} />
                           </button>
                         </>
                       ) : (
                         <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase tracking-wider border border-gray-100 px-1.5 py-0.5 rounded">
                           Resolved
                         </div>
                       )}
                    </div>
                  </td>
                </tr>
               ))
             )}
           </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalLogs;
