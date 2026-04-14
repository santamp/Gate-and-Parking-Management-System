import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  ArrowLeft,
  Loader2,
  RefreshCw,
  Box,
  Info,
  Search,
  User,
  Car,
  Clock,
  CheckCircle2,
  X,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const SiteMap = () => {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const data = await adminService.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      console.error('Fetch hierarchy error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // Helper to flatten hierarchy into a linear list of units
  const flattenedUnits = useMemo(() => {
    const units = [];
    
    const traverse = (node, path = []) => {
      if (node.type === 'UNIT') {
        units.push({
          ...node,
          fullPath: path.join(' > ')
        });
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          traverse(child, [...path, node.name]);
        });
      }
    };

    hierarchy.forEach(project => {
      traverse(project);
    });

    return units;
  }, [hierarchy]);

  // Filtering & Sorting
  const filteredUnits = useMemo(() => {
    let result = flattenedUnits.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.occupier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.activeVehicles?.some(v => v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested objects or special cases
        if (sortConfig.key === 'occupier') aVal = a.occupier?.name || '';
        if (sortConfig.key === 'occupier') bVal = b.occupier?.name || '';
        if (sortConfig.key === 'status') {
            const getStatusRank = (u) => {
                if (u.activeVehicles?.some(v => v.status === 'pending')) return 1;
                if (u.activeVehicles?.some(v => v.status === 'inside' || v.status === 'approved')) return 2;
                if (u.occupier) return 3;
                return 4;
            };
            aVal = getStatusRank(a);
            bVal = getStatusRank(b);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [flattenedUnits, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper to get status color and label
  const getUnitStatus = (unit) => {
    if (unit.activeVehicles && unit.activeVehicles.length > 0) {
      const v = unit.activeVehicles[0];
      if (v.status === 'pending') return { color: 'bg-amber-500', text: 'INCOMING', theme: 'amber' };
      if (v.status === 'inside' || v.status === 'approved') return { color: 'bg-emerald-500', text: 'INSIDE', theme: 'emerald' };
    }
    if (unit.occupier) return { color: 'bg-blue-500', text: 'ASSIGNED', theme: 'blue' };
    return { color: 'bg-gray-300', text: 'VACANT', theme: 'gray' };
  };

  // Unit Detail Modal Component
  const UnitModal = ({ unit, onClose }) => {
    if (!unit) return null;
    const status = getUnitStatus(unit);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center border border-gray-100">
                <Box size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{unit.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Unit Details</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 pb-0 flex flex-wrap gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                 status.theme === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                 status.theme === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                 status.theme === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}>
                {status.text}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Occupier Section */}
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assigned Occupier</h4>
              {unit.occupier ? (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase italic">{unit.occupier.name}</p>
                    <p className="text-xs text-gray-500 font-bold">{unit.occupier.email}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 text-center py-6">
                  <p className="text-xs font-bold text-gray-400 uppercase italic">No assigned occupant</p>
                </div>
              )}
            </div>

            {/* Live Vehicle Section */}
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Live Telemetry</h4>
              {unit.activeVehicles && unit.activeVehicles.length > 0 ? (
                <div className="space-y-3">
                  {unit.activeVehicles.map((v, idx) => (
                    <div key={v._id || idx} className="bg-gray-900 rounded-2xl p-4 text-white flex items-center justify-between border border-gray-800 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${v.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-lg`}>
                          <Car size={24} />
                        </div>
                        <div>
                          <p className="font-black text-lg uppercase italic leading-tight">{v.vehicleNumber}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             {v.status === 'pending' ? (
                               <>
                                 <Clock size={12} className="text-amber-400" />
                                 <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Awaiting Entry Approval</span>
                               </>
                             ) : (
                               <>
                                 <CheckCircle2 size={12} className="text-emerald-400" />
                                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Verified on Premises</span>
                               </>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center py-6">
                   <p className="text-xs font-bold text-gray-400 uppercase italic">No active vehicle traffic</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0">
             <button 
               onClick={onClose}
               className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg"
             >
               Close Terminal
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-bottom duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 px-1">
          <button 
            onClick={() => navigate('/guard')}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Search Unit</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Find units & residents</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={fetchHierarchy}
                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-gray-600 active:rotate-180 duration-500"
            >
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative w-full md:w-96">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="TYPE UNIT, NAME, OR VEHICLE..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary-500 outline-none shadow-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 px-2">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-gray-500 uppercase">Live {filteredUnits.filter(u => u.activeVehicles?.length > 0).length}</span>
                 </div>
                 <div className="h-4 w-[1px] bg-gray-200" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredUnits.length} Total Nodes</span>
              </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white">
                        <th 
                            className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                            onClick={() => requestSort('name')}
                        >
                            <div className="flex items-center gap-2">
                                Unit ID <ArrowUpDown size={12} />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                            onClick={() => requestSort('fullPath')}
                        >
                            <div className="flex items-center gap-2">
                                Location Path <ArrowUpDown size={12} />
                            </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Occupier
                        </th>
                        <th 
                            className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                            onClick={() => requestSort('status')}
                        >
                            <div className="flex items-center gap-2">
                                Status <ArrowUpDown size={12} />
                            </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                            Telemetery / Action
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="py-20 text-center">
                                <Loader2 size={32} className="animate-spin mx-auto mb-3 text-primary-600" />
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Grid Data...</p>
                            </td>
                        </tr>
                    ) : filteredUnits.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="py-20 text-center text-gray-400 italic font-bold uppercase tracking-widest text-xs">
                                No nodes match your search
                            </td>
                        </tr>
                    ) : (
                        filteredUnits.map((u) => {
                            const status = getUnitStatus(u);
                            const activeVehicle = u.activeVehicles?.[0];
                            return (
                                <tr key={u._id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="font-black text-gray-900 uppercase italic text-sm">{u.name}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate max-w-[200px]">
                                            {u.fullPath}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        {u.occupier ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-xs font-black text-gray-700 uppercase italic truncate max-w-[150px]">
                                                    {u.occupier.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-300 uppercase">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${status.color} ${status.theme !== 'gray' ? 'animate-pulse shadow-lg' : ''}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                status.theme === 'amber' ? 'text-amber-600' :
                                                status.theme === 'emerald' ? 'text-emerald-600' :
                                                status.theme === 'blue' ? 'text-blue-600' :
                                                'text-gray-400'
                                            }`}>
                                                {status.text}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {activeVehicle && (
                                                <div className="bg-gray-900 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                                                    <Car size={12} className={activeVehicle.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'} />
                                                    <span className="text-[10px] font-black italic">{activeVehicle.vehicleNumber}</span>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => setSelectedUnit(u)}
                                                className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white rounded-xl transition-all shadow-sm border border-gray-100"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
          </div>
      </div>

      <UnitModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
    </div>
  );
};

export default SiteMap;


