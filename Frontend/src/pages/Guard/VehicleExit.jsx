import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, LogOut, ArrowRight, ArrowRightLeft } from 'lucide-react';
import gateService from '../../services/gateService';
import { toast } from 'react-hot-toast';

const VehicleExit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [insideVehicles, setInsideVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInsideVehicles = async () => {
    try {
      setLoading(true);
      const data = await gateService.getVehicleLogs({ status: 'approved,inside' });
      // Fetch calculation for each vehicle to show amount in the list
      const enriched = await Promise.all(data.data.map(async (v) => {
          try {
              const calc = await gateService.getExitCalculation(v._id);
              return { 
                  ...v, 
                  amount: calc.data.billAmount,
                  durationStr: `${Math.floor(calc.data.durationMinutes / 60)}h ${calc.data.durationMinutes % 60}m`,
                  calcData: calc.data
              };
          } catch {
              return { ...v, amount: 0, durationStr: 'N/A' };
          }
      }));
      setInsideVehicles(enriched);
    } catch (error) {
      console.error('Error fetching inside vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInsideVehicles();
  }, []);

  React.useEffect(() => {
    if (location.state?.successMessage) {
      toast(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const filtered = insideVehicles.filter(v => v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleProcessExit = async (vehicle) => {
    if (vehicle.amount > 0) {
      navigate('/guard/payment', { 
          state: { 
              vehicle: { 
                  logId: vehicle._id,
                  plate: vehicle.vehicleNumber, 
                  amount: vehicle.amount,
                  calcData: vehicle.calcData
              } 
          } 
      });
    } else {
      try {
          if (window.confirm(`Process free exit for ${vehicle.vehicleNumber}?`)) {
              await gateService.registerVehicleExit(vehicle._id);
              fetchInsideVehicles();
          }
      } catch (error) {
          alert(error.message || 'Exit failed');
      }
    }
  };

  return (
    <div className="space-y-6 pb-6 animate-in slide-in-from-right duration-300 fade-in max-w-5xl mx-auto">
       {/* Header */}
       <div className="px-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Vehicle Exit</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Vehicle Checkout</p>
      </div>

       {/* Search Input */}
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 ring-0 focus:ring-1 focus:ring-primary-500 transition-all bg-white shadow-sm font-black text-gray-800 uppercase"
          placeholder="TYPE VEHICLE NO..."
        />
      </div>

      <div className="grid gap-4 pt-2 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(v => (
            <div key={v._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ArrowRightLeft size={60} />
                </div>
                
                <h4 className="font-black text-xl text-gray-900 tracking-wide mb-1 flex items-center gap-2">
                    {v.vehicleNumber}
                </h4>
                <p className="text-sm text-gray-500 font-semibold mb-3">
                    {v.occupierMappedId?.name || 'Gate Access'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Entry Time</span>
                        <span className="font-bold text-gray-800 text-sm">
                            {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Duration</span>
                        <span className="font-bold text-gray-800 text-sm">{v.durationStr}</span>
                    </div>
                </div>

                <button 
                  onClick={() => handleProcessExit(v)}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all active:scale-[0.98] ${
                      v.amount > 0 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-gray-900 text-white shadow-sm'
                  }`}
                >
                    {v.amount > 0 ? (
                        <>Pay ₹{v.amount} & Exit <ArrowRight size={18} /></>
                    ) : (
                        <>Free Exit <LogOut size={18} /></>
                    )}
                </button>
            </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            <p>No active vehicles inside match "{searchTerm}"</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default VehicleExit;
