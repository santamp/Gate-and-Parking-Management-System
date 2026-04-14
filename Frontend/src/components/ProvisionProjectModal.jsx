import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Loader2, 
  Settings, 
  Layers, 
  CheckCircle2, 
  Box 
} from 'lucide-react';
import adminService from '../services/adminService';

const ProvisionProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    numFloors: 1,
    unitsPerFloor: 1,
    autoGenerateUnits: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName || formData.numFloors < 1) {
      alert("Please enter project name and valid floor count.");
      return;
    }
    setLoading(true);
    try {
      await adminService.provisionProject({
        projectName: formData.projectName,
        numFloors: formData.numFloors,
        unitsPerFloor: formData.unitsPerFloor,
        autoGenerateUnits: formData.autoGenerateUnits
      });
      onProjectCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to provision project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl my-auto overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white relative">
           <div className="absolute right-0 top-0 opacity-10 p-4">
             <Settings size={120} className="animate-spin-slow" />
           </div>
           <div className="relative z-10">
             <h2 className="text-3xl font-black uppercase italic tracking-tighter">Infrastructure Provisioning</h2>
             <p className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] mt-2">Flexible Architectural Deployment</p>
           </div>
           <button 
             onClick={onClose}
             className="relative z-10 p-3 hover:bg-white/10 rounded-2xl transition-colors"
           >
             <X size={28} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
           {/* Section 1: Project Identity */}
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-8 bg-amber-500 rounded-full" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 italic">Project Identity</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic px-2">Project Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="ENTER HUB NAME..."
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-[2rem] font-black text-sm uppercase italic tracking-widest focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all"
                      value={formData.projectName}
                      onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           {/* Section 2: Architectural Scope */}
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-8 bg-indigo-500 rounded-full" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 italic">Architectural Scope</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic px-2">Total Floors</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-lg focus:border-amber-500 outline-none transition-all"
                      value={formData.numFloors}
                      onChange={(e) => setFormData({...formData, numFloors: parseInt(e.target.value) || 1})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic px-2">Units per Floor</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-lg focus:border-emerald-500 outline-none transition-all"
                      value={formData.unitsPerFloor}
                      onChange={(e) => setFormData({...formData, unitsPerFloor: parseInt(e.target.value) || 1})}
                    />
                 </div>
              </div>
           </div>

           {/* Section 3: Unit Intelligence Toggle */}
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-8 bg-emerald-500 rounded-full" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 italic">Neural Unit Generation</h3>
              </div>
              <div className="flex items-center gap-4 p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100">
                 <input 
                   type="checkbox"
                   id="autoGen"
                   className="h-8 w-8 rounded-xl text-emerald-600 focus:ring-emerald-500 border-2 border-emerald-200"
                   checked={formData.autoGenerateUnits}
                   onChange={(e) => setFormData({...formData, autoGenerateUnits: e.target.checked})}
                 />
                 <div>
                    <label htmlFor="autoGen" className="text-sm font-black uppercase italic tracking-tight text-gray-900 cursor-pointer">Auto-Generate Unit Nodes</label>
                    <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest leading-relaxed italic mt-1">
                      Enabling this will automatically populate each floor based on individual building specs.
                    </p>
                 </div>
              </div>
           </div>
        </form>

        <div className="p-8 md:p-10 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-4 text-gray-400">
              <div className={`h-3 w-3 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                {loading ? 'Compiling Heterogeneous Architecture...' : 'Ready for Complex Deployment'}
              </span>
           </div>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="px-12 py-5 bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-black transition-all shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3 italic"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
             Finalize Deployment
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProvisionProjectModal;
