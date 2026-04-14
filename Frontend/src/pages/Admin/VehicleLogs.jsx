import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Truck, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useSocket } from '../../context/SocketContext';

const VehicleLogs = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const statusMap = {
        'In-Gate': 'inside',
        'Out-Gate': 'exited',
        'all': ''
      };
      
      const data = await adminService.getVehicleLogs({
        status: statusMap[activeFilter] || '',
        search,
        page,
        limit: 10
      });
      
      setLogs(data.logs);
      setTotalPages(data.pages);
      setTotalRecords(data.total);
    } catch (err) {
      console.error('Fetch logs error:', err);
      setError('Failed to load vehicle logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeFilter, page]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (newLog) => {
      setLogs((prev) => {
        if (
          page === 1 &&
          (activeFilter === 'all' ||
            (activeFilter === 'In-Gate' && newLog.status === 'inside') ||
            (activeFilter === 'Out-Gate' && newLog.status === 'exited'))
        ) {
          return [newLog, ...prev].slice(0, 10);
        }
        return prev;
      });
      setTotalRecords((prev) => prev + 1);
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
  }, [socket, page, activeFilter]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchLogs();
    }
  };

  const getTimeString = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'Active';
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Movement Registry</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Unified view of all vehicle transit and analytics
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-all uppercase text-xs tracking-wider">
            <Calendar size={16} />
            Date Range
          </button>
          <button className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all uppercase text-xs tracking-wider">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-50 p-1 rounded-lg">
          {['all', 'In-Gate', 'Out-Gate'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveFilter(tab);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${activeFilter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search Vehicle ID..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-gray-900 rounded-lg w-64 text-sm font-medium transition-all"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-lg ring-1 ring-gray-200 transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tables View */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Log Entity</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transit Detail</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Node Status</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Temporal Metrics</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium uppercase tracking-widest text-xs">
                  No vehicle logs found
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
                        <div className="text-[10px] text-gray-400 font-medium">
                          REF: {log._id.slice(-6).toUpperCase()} • {log.vehicleType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                         <MapPin size={10} className="text-gray-400" />
                         {log.occupierMappedId?.name || 'Gate Access'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium ml-4">
                        Driver: {log.driverName || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${log.status === 'inside' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <div className={`h-1 w-1 rounded-full ${log.status === 'inside' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {log.status === 'inside' ? 'In-Gate' : 'Out-Gate'}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                            <ArrowDownRight size={8} className="text-emerald-500" /> Entry
                          </span>
                          <span className="text-[11px] font-semibold text-gray-900">{getTimeString(log.entryTime)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                            <ArrowUpRight size={8} className="text-rose-500" /> Exit
                          </span>
                          <span className="text-[11px] font-semibold text-gray-900">{getTimeString(log.exitTime)}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                     <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-900 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 mb-0.5">
                           <Clock size={8} />
                           {calculateDuration(log.entryTime, log.exitTime)}
                        </div>
                        {log.status === 'exited' && (
                          <div className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            log.billingStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.billingStatus}
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
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
             Showing {logs.length} of {totalRecords} Records
           </span>
           <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 transition-all disabled:opacity-30"
              >
                 <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-3 bg-gray-900 rounded-lg text-[10px] font-bold text-white">
                {page} / {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 transition-all disabled:opacity-30"
              >
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleLogs;
