import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Car, User, Phone, ArrowRight, X, Loader2, ChevronRight, Search } from 'lucide-react';
import gateService from '../../services/gateService';

const VehicleEntry = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    vehicleType: ''
  });

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await gateService.getVehicleSettings();
        if (response.success && response.data.length > 0) {
          setVehicleTypes(response.data);
          // Do not select first by default as requested
        }
      } catch (error) {
        console.error('Failed to fetch vehicle types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  // Auto-focus search when picker opens
  useEffect(() => {
    if (showTypePicker && searchInputRef.current) {
       searchInputRef.current.focus();
    }
  }, [showTypePicker]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vehicleType) return;

    // Navigate to occupier search to map this vehicle entry, passing the data in state
    navigate('/guard/occupier-search', {
      state: {
        vehicleData: formData,
        vehiclePhoto: photo
      }
    });
  };

  return (
    <div className="space-y-6 pb-6 animate-in slide-in-from-bottom-4 duration-500 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Vehicle Entry</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Enter details below</p>
      </div>

      {/* Photo Capture */}
      <div
        onClick={() => !photoPreview && fileInputRef.current.click()}
        className={`relative overflow-hidden border border-dashed rounded-3xl h-40 flex flex-col items-center justify-center transition-all cursor-pointer ${photoPreview ? 'border-primary-500 bg-gray-900' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400'
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handlePhotoChange}
        />

        {photoPreview ? (
          <>
            <img src={photoPreview} alt="Vehicle" className="w-full h-full object-cover opacity-80" />
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(); }}
              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
              Photo Captured
            </div>
          </>
        ) : (
          <>
            <Camera size={32} className="mb-2 opacity-40" />
            <span className="font-bold text-xs text-gray-400">Add Photo</span>
            <span className="text-[9px] mt-1 uppercase tracking-widest opacity-40">Optional</span>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plate Number */}
        <div>
          <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wide">Vehicle Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Car size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-1 focus:ring-primary-500 outline-none transition-all bg-white font-black text-gray-800 uppercase"
              placeholder="e.g. MH 12 AB 1234"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Vehicle Type Field */}
        <div>
          <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wide">Vehicle Type</label>
          <button
            type="button"
            onClick={() => setShowTypePicker(true)}
            className="w-full px-4 py-3.5 rounded-2x border border-gray-100 flex justify-between items-center bg-white shadow-sm"
          >
            <span className={`text-sm font-black uppercase ${formData.vehicleType ? 'text-gray-900' : 'text-gray-300'}`}>
              {formData.vehicleType || 'SELECT TYPE'}
            </span>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Global Modal Overlay for Picker */}
        {showTypePicker && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="p-4 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Select Vehicle Type</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Pick one from list</p>
               </div>
               <button 
                type="button"
                onClick={() => setShowTypePicker(false)}
                className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100"
               >
                 <X size={20} />
               </button>
            </header>

            {/* Search Bar */}
            <div className="p-4">
               <div className="relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                 <input 
                   ref={searchInputRef}
                   type="text"
                   placeholder="SEARCH TYPE..."
                   className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl text-xs font-black uppercase tracking-widest outline-none border border-transparent focus:border-gray-100 transition-all"
                   value={pickerSearch}
                   onChange={(e) => setPickerSearch(e.target.value)}
                 />
               </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 pb-10">
               <div className="space-y-2">
                 {vehicleTypes
                   .filter(t => t.vehicleType.toLowerCase().includes(pickerSearch.toLowerCase()))
                   .map(type => (
                     <button
                       key={type._id}
                       type="button"
                       onClick={() => {
                         setFormData({ ...formData, vehicleType: type.vehicleType });
                         setShowTypePicker(false);
                         setPickerSearch('');
                       }}
                       className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${
                         formData.vehicleType === type.vehicleType 
                           ? 'bg-primary-50 border border-primary-100' 
                           : 'bg-white border border-gray-100 active:bg-gray-50'
                       }`}
                     >
                        <span className={`font-black uppercase tracking-wide ${
                          formData.vehicleType === type.vehicleType ? 'text-primary-700' : 'text-gray-900'
                        }`}>
                          {type.vehicleType}
                        </span>
                        {formData.vehicleType === type.vehicleType && <div className="h-2 w-2 bg-primary-600 rounded-full shadow-lg shadow-primary-600/30" />}
                     </button>
                   ))}
                 {vehicleTypes.filter(t => t.vehicleType.toLowerCase().includes(pickerSearch.toLowerCase())).length === 0 && (
                   <div className="py-20 text-center opacity-40">
                      <p className="text-xs font-black uppercase tracking-widest italic">No match found</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Driver Name */}
        <div>
          <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wide">Driver Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-1 focus:ring-primary-500 outline-none transition-all bg-white font-black text-gray-800"
              placeholder="Driver's Full Name"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wide">Driver Phone</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              type="tel"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-1 focus:ring-primary-500 outline-none transition-all bg-white font-black text-gray-800"
              placeholder="+91"
              value={formData.driverPhone}
              onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Action */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-sm active:bg-black transition-all"
          >
            Next Step
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleEntry;
