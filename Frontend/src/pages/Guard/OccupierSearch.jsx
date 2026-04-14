import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Building, ArrowRight, Loader2 } from 'lucide-react';
import gateService from '../../services/gateService';

const OccupierSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicleData, vehiclePhoto } = location.state || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOccupier, setSelectedOccupier] = useState(null);
  const [occupiers, setOccupiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    // If no vehicle data, redirect back
    if (!vehicleData) {
      navigate('/guard/entry');
      return;
    }

    const fetchOccupiers = async () => {
      try {
        setLoading(true);
        const response = await gateService.getOccupiers();
        setOccupiers(response.data);
      } catch (err) {
        setError('Failed to fetch occupiers. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupiers();
  }, [vehicleData, navigate]);

  const filteredOccupiers = occupiers.filter(occ => 
    occ.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (occ.unit && occ.unit.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (occ.block && occ.block.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirm = async () => {
    if (submitLockRef.current) return;
    if (!selectedOccupier || !vehicleData) return;

    try {
      submitLockRef.current = true;
      setSubmitting(true);
      setError(null);

      // Prepare FormData for multi-part submission
      // Find the full object to get both User and Unit IDs
      const selectedObj = occupiers.find(o => o._id === selectedOccupier);
      if (!selectedObj) return;

      const formData = new FormData();
      formData.append('vehicleNumber', vehicleData.vehicleNumber);
      formData.append('vehicleType', vehicleData.vehicleType);
      formData.append('driverName', vehicleData.driverName);
      formData.append('driverPhone', vehicleData.driverPhone);
      formData.append('occupierMappedId', selectedObj.occupierUserId);
      if (selectedObj.unitId) {
        formData.append('unitId', selectedObj.unitId);
      }

      if (vehiclePhoto) {
        formData.append('vehiclePhoto', vehiclePhoto);
      }

      await gateService.registerVehicleEntry(formData);
      
      // Success - navigate to pending list
      navigate('/guard/pending', { 
        state: { successMessage: 'Vehicle entry request submitted successfully!' } 
      });
    } catch (err) {
      if (err.data?.existingLogId && ['pending', 'approved'].includes(err.data.status)) {
        navigate('/guard/pending', {
          state: { successMessage: err.message || 'Vehicle already has an active entry request.' }
        });
        return;
      }

      if (err.data?.existingLogId && err.data.status === 'inside') {
        navigate('/guard/exit', {
          state: { successMessage: err.message || 'Vehicle is already inside. Please process exit first.' }
        });
        return;
      }

      setError(err.message || 'Error registering vehicle. Please try again.');
      console.error(err);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6 animate-in slide-in-from-right duration-300 fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Select Unit</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Where is the vehicle going?</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || submitting}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 focus:ring-1 focus:ring-primary-500 transition-all bg-white shadow-sm font-black text-gray-800 disabled:opacity-50 uppercase text-xs"
          placeholder="TYPE UNIT OR NAME..."
        />
      </div>

      {/* Results List */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 font-inter mt-4">
        {loading ? 'Fetching units...' : `Available Units (${filteredOccupiers.length})`}
      </h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-primary-500" />
            <p className="text-sm font-medium">Loading occupiers...</p>
          </div>
        ) : (
          filteredOccupiers.map(occ => (
            <div 
              key={occ._id}
              onClick={() => !submitting && setSelectedOccupier(occ._id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedOccupier === occ._id ? 'bg-primary-50 border-primary-500 shadow-md scale-[1.02]' : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'} ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`p-2.5 rounded-xl ${selectedOccupier === occ._id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{occ.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 font-medium font-inter">
                      <MapPin size={14} className="text-primary-500" />
                      {occ.unit || 'A-1'} • {occ.block || 'Main Block'}
                    </div>
                  </div>
                </div>
                
                {/* Radio mock */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-2 ${selectedOccupier === occ._id ? 'border-primary-500' : 'border-gray-300'}`}>
                  {selectedOccupier === occ._id && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && filteredOccupiers.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            <p>No occupiers found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Confirmation Button Fixed at Bottom */}
      {selectedOccupier && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/10 backdrop-blur-md border-t border-gray-100 animate-in slide-in-from-bottom pb-[88px]">
          <div className="max-w-md mx-auto">
             <button 
               onClick={handleConfirm}
               disabled={submitting}
               className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-sm transition-all"
             >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Finish Entry
                    <ArrowRight size={18} />
                  </>
                )}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupierSearch;
