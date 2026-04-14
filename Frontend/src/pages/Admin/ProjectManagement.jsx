import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Plus,
  ChevronRight,
  Search,
  LayoutGrid,
  MoreVertical,
  Activity,
  X,
  Loader2,
  Eye,
  Trash2,
  Settings,
  Layers,
  CheckCircle2,
  Box
} from 'lucide-react';
import adminService from '../../services/adminService';
import ProvisionProjectModal from '../../components/ProvisionProjectModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [stats, setStats] = useState({ sites: 0, zones: 0, health: '98%' });

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await adminService.getHierarchy();

      // Transform hierarchy to expected project format for the grid (Project -> Floor -> Unit)
      const transformed = data.map(node => {
        // Count all units in the children sub-tree (Project -> Floor -> Unit)
        let totalCount = 0;
        let occupiedCount = 0;

        node.children?.forEach(floor => {
          floor.children?.forEach(unit => {
            totalCount++;
            if (unit.isOccupied) occupiedCount++;
          });
        });

        const loadPercentage = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

        return {
          id: node._id,
          name: node.name,
          zones: totalCount,
          capacity: `${loadPercentage}%`,
        };
      });

      setProjects(transformed);
      setStats({
        sites: data.length,
        zones: transformed.reduce((acc, curr) => acc + curr.zones, 0)
      });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteStructure(projectToDelete.id);
      await fetchProjects();
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Multi-Project Hub</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Orchestrate and monitor global site infrastructure
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all uppercase text-xs tracking-wider"
        >
          <Plus size={16} className="text-amber-500" />
          Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div>
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Global Sites</h4>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.sites.toString().padStart(2, '0')}</p>
          </div>
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
            <Globe size={18} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-colors">
          <div>
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Units</h4>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.zones}</p>
          </div>
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
            <LayoutGrid size={18} />
          </div>
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100">
          <Loader2 size={48} className="animate-spin text-gray-900 mb-6" />
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Accessing Global Registers...</h2>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 opacity-50">
          <Box size={60} className="text-gray-300 mb-6" />
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">No Projects Isolated</h2>
          <p className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-widest">Awaiting First Deployment Command</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((prj) => (
            <div key={prj.id} className="bg-white rounded-xl border border-gray-100 shadow-sm group hover:shadow-lg transition-all duration-300 overflow-hidden relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center text-amber-600 border border-gray-100 group-hover:bg-gray-900 group-hover:text-amber-500 transition-all duration-300">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{prj.name}</h3>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === prj.id ? null : prj.id);
                      }}
                      className={`p-2 transition-all rounded-lg ${openMenuId === prj.id ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {openMenuId === prj.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <button
                          onClick={() => navigate('/admin/mapping', { state: { projectId: prj.id } })}
                          className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors group"
                        >
                          <Eye size={14} className="text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-xs font-semibold text-gray-700">View Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setProjectToDelete(prj);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-rose-50 transition-colors group"
                        >
                          <Trash2 size={14} className="text-gray-400 group-hover:text-rose-600" />
                          <span className="text-xs font-semibold text-rose-600">Dismantle</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Node Activity</h5>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${parseInt(prj.capacity) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: prj.capacity }}
                      />
                    </div>
                    <p className="text-xs font-bold text-gray-900 mt-2 uppercase tracking-tight">{prj.capacity} Load</p>
                  </div>
                  <div className="space-y-1 text-right border-l border-gray-50 pl-6">
                    <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Unit Count</h5>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{prj.zones.toString().padStart(2, '0')}</p>
                  </div>
                </div>
              </div>

              {/* Background accent */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 pointer-events-none transform translate-x-4 -translate-y-4">
                <Globe size={120} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ProvisionProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={fetchProjects}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        saving={isDeleting}
        title="Dismantle Project?"
        message={`This will permanently remove ${projectToDelete?.name} and all its associated units from the global grid. This action is irreversible.`}
        confirmText="Confirm Deletion"
      />
    </div>
  );
};

export default ProjectManagement;
