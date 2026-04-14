import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  TrendingUp,
  ArrowUpRight,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  PieChart,
  Calendar,
  Loader2,
  RefreshCw,
  IndianRupee
} from 'lucide-react';
import adminService from '../../services/adminService';

const BillingPayments = () => {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billingData, dashboardStats] = await Promise.all([
        adminService.getBilling(),
        adminService.getStats()
      ]);
      setBills(billingData.bills);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Fetch billing error:', err);
      setError('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettle = async (id) => {
    if (window.confirm('Confirm payment settlement for this record?')) {
      try {
        await adminService.updateBillingStatus(id, 'PAID');
        fetchData();
      } catch (err) {
        alert('Failed to update payment status');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ledger & Revenue</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Financial auditing and transaction settlement
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all uppercase text-xs tracking-wider"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold uppercase text-[10px] tracking-widest animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle size={18} />
          {error} (Check if backend is running on port 5001)
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-900 text-white rounded-lg shadow-md">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">+Live</span>
          </div>
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</h4>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">₹{stats?.finance?.revenueToday ?? '0'}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-600 text-white rounded-lg shadow-md">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase font-mono">
              Gross Monthly
            </span>
          </div>
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Monthly Revenue</h4>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            ₹{stats?.finance?.revenueMonth ?? '0'}
          </p>
        </div>
        <div className="bg-gray-900 p-5 rounded-xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <IndianRupee size={60} />
          </div>
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Vehicles Inside</h4>
          <p className="text-2xl font-bold tracking-tight mb-2 text-amber-500">{stats?.vehicles?.inside ?? '0'}</p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Ledger Journal</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="TXN ID / Entity..." className="pl-9 pr-4 py-2 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-900 w-64 transition-all" />
            </div>
            <button className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/30">
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Reference ID</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Assignment</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hours/Duration</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Method/TxID</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Settlement</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status Node</th>
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
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium uppercase tracking-widest text-xs">
                  No billing records found
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-900 text-white rounded-lg shadow-sm">
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm tracking-tight">{bill.vehicleLogId?.vehicleNumber || 'N/A'}</div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase">REF: {bill._id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="font-semibold text-gray-700">{bill.vehicleLogId?.occupierMappedId?.name || 'Gate Access'}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{new Date(bill.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <Clock size={12} className="text-gray-400" />
                      {bill.durationMinutes > 60 ? `${Math.floor(bill.durationMinutes / 60)}h ${bill.durationMinutes % 60}m` : `${bill.durationMinutes}m`}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs">
                    <div className="font-semibold text-gray-700 uppercase">{bill.paymentMethod || 'NONE'}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{bill.transactionId || '--'}</div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="font-bold text-gray-900 text-base tracking-tight">₹{bill.billAmount}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {bill.status === 'PAID' && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {bill.status === 'UNPAID' && <Clock size={14} className="text-amber-500 animate-pulse" />}
                        {bill.status === 'FAILED' && <AlertCircle size={14} className="text-rose-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${bill.status === 'PAID' ? 'text-emerald-500' :
                          bill.status === 'UNPAID' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                          {bill.status}
                        </span>
                      </div>
                      {bill.status === 'UNPAID' && (
                        <button
                          onClick={() => handleSettle(bill._id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all opacity-0 group-hover:opacity-100 shadow-md shadow-emerald-500/10"
                        >
                          Mark Paid
                        </button>
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

export default BillingPayments;
