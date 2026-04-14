import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Truck, ChevronRight, Clock } from 'lucide-react';
import gateService from '../../services/gateService';

const OccupierHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await gateService.getVehicleLogs();
      setHistory(res.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gate History</h2>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search vehicle no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white font-bold text-gray-900 placeholder:text-gray-300 text-sm"
          />
        </div>
        <button className="h-[52px] w-[52px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors shadow-sm">
          <Filter size={20} />
        </button>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${item.status === 'inside' || item.status === 'approved' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                <Truck size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-gray-900 tracking-tight uppercase">{item.vehicleNumber}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    item.status === 'exited' ? 'bg-gray-50 text-gray-400 border-gray-100' :
                    item.status === 'inside' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              
              <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-gray-400 font-bold">
            No entries found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default OccupierHistory;
