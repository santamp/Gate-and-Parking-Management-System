import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Plus,
  MapPin,
  Layers,
  ArrowRight,
  MoreHorizontal,
  LayoutGrid,
  Info,
  Loader2,
  RefreshCw,
  Box,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  Table as TableIcon,
  List,
  Filter
} from 'lucide-react';
import adminService from '../../services/adminService';
import ProvisionProjectModal from '../../components/ProvisionProjectModal';

const WarehouseMapping = () => {
  const location = useLocation();
  const [hierarchy, setHierarchy] = useState([]);
  const [activeMappings, setActiveMappings] = useState([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mapping View State
  const [tableSearch, setTableSearch] = useState('');

  // Mapping Modal State
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showProjectProvisionModal, setShowProjectProvisionModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);

  // Table Structure Addition State
  const [structureModal, setStructureModal] = useState({ show: false, type: '' });
  const [structureFormData, setStructureFormData] = useState({ name: '', parentId: '' });

  // Flatten hierarchy data for table view
  const getFlattenedData = () => {
    const flatData = [];
    const currentProject = hierarchy[selectedProjectIndex];
    if (!currentProject) return [];

    currentProject.children?.forEach(floor => {
      floor.children?.forEach(unit => {
        flatData.push({
          ...unit,
          floorName: floor.name,
          projectName: currentProject.name
        });
      });
    });
    return flatData;
  };

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const data = await adminService.getHierarchy();
      setHierarchy(data);

      // Handle pre-selection from navigation state
      const targetProjectId = location.state?.projectId;
      if (targetProjectId && data.length > 0) {
        const index = data.findIndex(p => p._id === targetProjectId);
        if (index !== -1) setSelectedProjectIndex(index);
      }

      const mappings = await adminService.getMappings();
      setActiveMappings(mappings);
    } catch (err) {
      console.error('Fetch hierarchy error:', err);
      setError('Failed to load site mapping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleAddStructure = async (type, parentId = null) => {
    // For PROJECTS, use the new modal
    if (type === 'PROJECT') {
      setShowProjectProvisionModal(true);
      return;
    }

    const name = window.prompt(`Enter name for new ${type}:`);
    if (name) {
      try {
        await adminService.createStructure({ name, type, parentId });
        fetchHierarchy();
      } catch (err) {
        alert('Failed to add structure');
      }
    }
  };

  const handleCustomStructureSubmit = async (e) => {
    e.preventDefault();
    if (!structureFormData.name || !structureFormData.parentId) return;
    try {
      await adminService.createStructure({ 
        name: structureFormData.name, 
        type: structureModal.type, 
        parentId: structureFormData.parentId 
      });
      fetchHierarchy();
      setStructureModal({ show: false, type: '' });
      setStructureFormData({ name: '', parentId: '' });
    } catch (err) {
      alert('Failed to add structure');
    }
  };

  const openMappingModal = async (unit) => {
    setSelectedUnit(unit);
    setShowMappingModal(true);
    try {
      setMappingLoading(true);
      const userData = await adminService.getUsers({ role: 'OCCUPIER' });
      setUsers(userData.users || userData.data || (Array.isArray(userData) ? userData : []));
    } catch (err) {
      console.error('Failed to fetch occupiers:', err);
    } finally {
      setMappingLoading(false);
    }
  };

  const handleMapOccupier = async (userId) => {
    try {
      setMappingLoading(true);
      await adminService.mapOccupierToUnit({
        occupierId: userId,
        unitId: selectedUnit._id
      });
      setShowMappingModal(false);
      fetchHierarchy();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to map occupier');
    } finally {
      setMappingLoading(false);
    }
  };

  const currentProject = hierarchy[selectedProjectIndex];

  if (loading && hierarchy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-gray-100 italic">
        <Loader2 size={48} className="animate-spin text-gray-900 mb-4" />
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Compiling Neural Mapping...</h2>
      </div>
    );
  }

  const getOccupierForUnit = (unitId) => {
    return activeMappings.find(m => m.unitId?._id === unitId || m.unitId === unitId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entity Mapping</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Comprehensive management of site mapping and infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHierarchy}
            className="p-2 bg-gray-900 text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Horizontal Project Selector */}
      <div className="bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <LayoutGrid size={12} />
          Active Projects
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
          {hierarchy.map((project, idx) => (
            <button
              key={project._id}
              onClick={() => setSelectedProjectIndex(idx)}
              className={`min-w-[200px] p-4 rounded-xl text-left transition-all group flex items-center justify-between border-2 shrink-0 ${selectedProjectIndex === idx
                ? 'bg-gray-900 border-gray-800 text-white shadow-lg'
                : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${selectedProjectIndex === idx ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight truncate max-w-[100px]">{project.name}</div>
                  <div className={`text-[10px] font-medium ${selectedProjectIndex === idx ? 'text-gray-400' : 'text-gray-400'}`}>
                    {project.children?.length || 0} Floors
                  </div>
                </div>
              </div>
              {selectedProjectIndex === idx && <ArrowRight size={14} className="text-amber-500" />}
            </button>
          ))}

          <button
            onClick={() => handleAddStructure('PROJECT')}
            className="min-w-[160px] p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider shrink-0"
          >
            <Plus size={16} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Hierarchy View OR Table View */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 min-h-[600px] relative overflow-hidden">
          {!currentProject ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 mt-20">
              <Box size={60} className="mb-4" />
              <p className="font-bold uppercase tracking-wider text-xs">No projects discovered</p>
            </div>
          ) : (
              <div className="space-y-4 font-sans">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Unit Repository</h2>
                    <p className="text-[10px] font-medium text-gray-400">Flattened Tabular Infrastructure View</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    <div className="flex items-center gap-2 sm:mr-2 sm:pr-4 sm:border-r border-gray-200">
                       <button 
                         onClick={() => setStructureModal({show: true, type: 'FLOOR'})}
                         className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap"
                       >
                         + Floor
                       </button>
                       <button 
                         onClick={() => setStructureModal({show: true, type: 'UNIT'})}
                         className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap"
                       >
                         + Unit
                       </button>
                    </div>

                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search node..."
                        className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg font-semibold text-xs focus:ring-1 focus:ring-gray-900 outline-none transition-all w-full sm:w-48"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                        <th className="px-6 py-3">Structure</th>
                        <th className="px-6 py-3">Unit Node</th>
                        <th className="px-6 py-3">Primary Entity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Operational Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {getFlattenedData().filter(u =>
                        u.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        u.floorName?.toLowerCase().includes(tableSearch.toLowerCase())
                      ).map(unit => {
                        const mapping = getOccupierForUnit(unit._id);
                        return (
                          <tr key={unit._id} className="group transition-all hover:bg-gray-50/50">
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-[10px] uppercase text-gray-400 tracking-tight">{unit.projectName}</span>
                                <span className="font-bold text-[10px] uppercase text-gray-900">{unit.floorName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 bg-gray-900 text-amber-500 rounded flex items-center justify-center shadow-sm">
                                  <Box size={12} />
                                </div>
                                <span className="font-bold text-sm text-gray-900">{unit.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              {mapping ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs text-gray-900 uppercase">{mapping.occupierId?.name}</span>
                                  <span className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">{mapping.occupierId?.email}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Unmapped</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${mapping ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                <div className={`h-1 w-1 rounded-full ${mapping ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                {mapping ? 'Synced' : 'Available'}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <button
                                onClick={() => openMappingModal(unit)}
                                className={`p-2 rounded-lg transition-all ${mapping ? 'bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white' : 'bg-amber-500 text-white shadow-sm hover:scale-105 active:scale-95'}`}
                              >
                                {mapping ? <RefreshCw size={14} /> : <UserPlus size={14} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Info Card (Always visible at bottom) */}
            <div className="mt-8 flex items-start gap-4 p-6 bg-gray-900 rounded-xl text-white shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-5 -mr-8 -mt-8 group-hover:rotate-12 transition-transform duration-1000">
                <Building2 size={180} />
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl text-amber-500 border border-white/10 shadow-inner relative z-10">
                <Info size={20} />
              </div>
              <div className="relative z-10">
                <h5 className="text-base font-bold text-amber-500">Mapping Neural Network</h5>
                <p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed">
                  Mapped units are highlighted in <span className="text-emerald-400 font-bold">EMERALD</span>. Click on a unit to manage occupier mapping.
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Assign Occupier</h2>
                <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mt-0.5">Unit Node: {selectedUnit?.name}</p>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
               >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Seach entity..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg font-semibold text-xs focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {mappingLoading && users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 opacity-40">
                    <Loader2 size={24} className="animate-spin mb-2" />
                    <p className="text-[10px] font-bold text-gray-400">Scanning...</p>
                  </div>
                ) : (Array.isArray(users) ? users : []).filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase())).map(user => (
                  <button
                    key={user._id}
                    onClick={() => handleMapOccupier(user._id)}
                    disabled={mappingLoading}
                    className="w-full p-3 rounded-xl border border-gray-100 hover:border-gray-900 text-left flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{user.name}</div>
                        <div className="text-[10px] font-medium text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Info size={18} className="text-white" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase leading-relaxed italic">
                Mapping an occupier to a unit enables direct communication between guard terminals and the entity for entrance approvals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Structure Addition Modal */}
      {structureModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Add {structureModal.type}</h2>
                <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mt-0.5">Manual Infrastructure Provisioning</p>
              </div>
              <button
                onClick={() => setStructureModal({ show: false, type: '' })}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCustomStructureSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Select Parent Node</label>
                <select 
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 transition-all custom-select"
                  value={structureFormData.parentId}
                  onChange={(e) => setStructureFormData({...structureFormData, parentId: e.target.value})}
                  required
                >
                  <option value="">-- Choose Parent --</option>
                  {structureModal.type === 'FLOOR' && currentProject && (
                    <option value={currentProject._id}>{currentProject.name} (Warehouse Node)</option>
                  )}
                  {structureModal.type === 'UNIT' && currentProject?.children?.map(f => (
                    <option key={f._id} value={f._id}>{f.name} (Floor Node)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Node Name</label>
                <input 
                  type="text"
                  placeholder={`ENTER ${structureModal.type} IDENTIFIER...`}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                  value={structureFormData.name}
                  onChange={(e) => setStructureFormData({...structureFormData, name: e.target.value})}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full p-2.5 bg-gray-900 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-black transition-all active:scale-95 shadow-sm mt-2"
              >
                Provision Infrastructure
              </button>
            </form>
          </div>
        </div>
      )}

      <ProvisionProjectModal
        isOpen={showProjectProvisionModal}
        onClose={() => setShowProjectProvisionModal(false)}
        onProjectCreated={fetchHierarchy}
      />
    </div>
  );
};

export default WarehouseMapping;
