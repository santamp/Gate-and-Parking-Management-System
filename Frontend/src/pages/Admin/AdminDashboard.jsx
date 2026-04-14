import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Truck,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import adminService from '../../services/adminService';

const StatCard = ({ title, value, change, trend, icon, color, loading }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} text-white shadow-lg`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <h3 className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1">{title}</h3>
    {loading ? (
      <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    )}
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const stats = await adminService.getStats();
        setData(stats);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100">
        <XCircle size={40} className="text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-500 font-medium mb-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Vehicles Inside',
      value: data?.vehicles?.inside ?? '0',
      trend: 'up',
      icon: <Truck size={24} />,
      color: 'bg-primary-600'
    },
    {
      title: 'Total Warehouses',
      value: data?.infrastructure?.projects ?? '0',
      trend: 'up',
      icon: <TrendingUp size={24} />,
      color: 'bg-indigo-600'
    },
    {
      title: 'Daily Revenue',
      value: `₹${data?.finance?.revenueToday ?? '0'}`,
      trend: 'up',
      icon: <CreditCard size={24} />,
      color: 'bg-emerald-600'
    },
    {
      title: 'Total Units',
      value: data?.infrastructure?.units ?? '0',
      trend: 'up',
      icon: <Users size={24} />,
      color: 'bg-amber-600'
    },
  ];

  const recentLogs = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-gray-500 font-medium mt-1 text-xs flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Global analytics and real-time activity
          </p>
        </div>
        <div className="flex gap-2 mb-1">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Live Feed Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      <div>
        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Live Vehicle Logs</h2>
            <button className="text-xs font-semibold text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors bg-amber-50 px-3 py-1.5 rounded-lg">View All Logs</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vehicle ID</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium uppercase tracking-widest text-xs">
                      No recent vehicle activity found
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">{log.vehicleNumber}</div>
                        <div className="text-[10px] text-gray-400 font-medium">REF: {log._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-700 text-sm">{log.driverName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                          {log.vehicleType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {log.status === 'inside' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {log.status === 'exited' && <Clock size={14} className="text-indigo-500" />}
                          {log.status === 'pending' && <AlertCircle size={14} className="text-amber-500" />}
                          {log.status === 'rejected' && <XCircle size={14} className="text-rose-500" />}
                          <span className={`text-xs font-bold uppercase tracking-wider ${log.status === 'inside' ? 'text-emerald-500' :
                            log.status === 'exited' ? 'text-indigo-500' :
                              log.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {log.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                        {new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
