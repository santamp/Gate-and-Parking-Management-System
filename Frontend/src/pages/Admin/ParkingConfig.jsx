import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Clock,
  Loader2,
  X,
  Pencil,
  Plus,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Save,
  Trash2
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

const ParkingConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRateData, setEditRateData] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [newRateData, setNewRateData] = useState({
    vehicleType: '',
    baseFee: '',
    hourlyRate: '',
    dailyMax: '',
    weeklyRate: '',
    monthlyRate: '',
    gracePeriod: 15
  });

  // Mapping for colors based on vehicle type
  const typeConfigs = {
    'Truck (L)': { color: 'bg-primary-600' },
    'Truck (M)': { color: 'bg-indigo-600' },
    'Van / Commercial': { color: 'bg-amber-600' },
    'Private Car': { color: 'bg-emerald-600' },
    'Two Wheeler': { color: 'bg-slate-600' }
  };

  const getDefaultConfig = (type) => typeConfigs[type] || { color: 'bg-gray-600' };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const ratesRes = await adminService.getParkingSettings();

      if (ratesRes.success) {
        const enrichedRates = ratesRes.data.map(rate => ({
          ...rate,
          ...getDefaultConfig(rate.vehicleType)
        }));
        setRates(enrichedRates);
      }
    } catch (error) {
      toast.error('Failed to load parking settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const persistSettings = async (updatedRates) => {
    try {
      setSaving(true);

      const ratesToSave = updatedRates.map(({ _id, vehicleType, baseFee, hourlyRate, dailyMax, weeklyRate, monthlyRate, gracePeriod }) => ({
        _id,
        vehicleType,
        baseFee,
        hourlyRate,
        dailyMax,
        weeklyRate: Number(weeklyRate) || 0,
        monthlyRate: Number(monthlyRate) || 0,
        gracePeriod
      }));

      const ratesRes = await adminService.updateParkingSettings(ratesToSave);

      if (ratesRes.success) {
        toast.success('Configuration synchronized successfully');
        await fetchSettings(); // Re-fetch to get new IDs and confirm state
      }
    } catch (error) {
      toast.error('Failed to sync configurations');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newRateData.vehicleType.trim()) return toast.error('Classification name required');
    if (rates.some(r => r.vehicleType.toLowerCase() === newRateData.vehicleType.toLowerCase())) {
      return toast.error('Classification already exists');
    }

    const newRate = {
      vehicleType: newRateData.vehicleType,
      baseFee: Number(newRateData.baseFee) || 0,
      hourlyRate: Number(newRateData.hourlyRate) || 0,
      dailyMax: Number(newRateData.dailyMax) || 0,
      weeklyRate: Number(newRateData.weeklyRate) || 0,
      monthlyRate: Number(newRateData.monthlyRate) || 0,
      gracePeriod: Number(newRateData.gracePeriod) || 15,
      ...getDefaultConfig(newRateData.vehicleType)
    };

    const updatedRates = [...rates, newRate];
    await persistSettings(updatedRates);

    setNewRateData({
      vehicleType: '',
      baseFee: '',
      hourlyRate: '',
      dailyMax: '',
      weeklyRate: '',
      monthlyRate: '',
      gracePeriod: 15
    });
    setShowAddModal(false);
  };

  const openEditModal = (rate, idx) => {
    setEditRateData({ ...rate });
    setEditIndex(idx);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editRateData.vehicleType.trim()) return toast.error('Classification name required');
    if (rates.some((r, idx) => idx !== editIndex && r.vehicleType.toLowerCase() === editRateData.vehicleType.toLowerCase())) {
      return toast.error('Classification already exists');
    }

    const updatedRates = [...rates];
    updatedRates[editIndex] = {
      ...updatedRates[editIndex],
      ...editRateData,
      baseFee: Number(editRateData.baseFee) || 0,
      hourlyRate: Number(editRateData.hourlyRate) || 0,
      dailyMax: Number(editRateData.dailyMax) || 0,
      weeklyRate: Number(editRateData.weeklyRate) || 0,
      monthlyRate: Number(editRateData.monthlyRate) || 0,
      gracePeriod: Number(editRateData.gracePeriod) || 15,
      ...getDefaultConfig(editRateData.vehicleType)
    };

    await persistSettings(updatedRates);
    setShowEditModal(false);
    setEditRateData(null);
    setEditIndex(null);
  };

  const handleDeleteTrigger = (idx) => {
    setDeleteIndex(idx);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const updatedRates = rates.filter((_, i) => i !== deleteIndex);
    await persistSettings(updatedRates);
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="font-bold tracking-widest text-xs uppercase italic">Syncing Revenue Nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative font-sans">
      {/* Add New Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Define Node</h3>
              <button onClick={() => setShowAddModal(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Classification Name</label>
                <input
                  type="text"
                  value={newRateData.vehicleType}
                  onChange={(e) => setNewRateData({ ...newRateData, vehicleType: e.target.value })}
                  placeholder="e.g. Electric Scooter"
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Base configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={newRateData.baseFee}
                      onChange={(e) => setNewRateData({ ...newRateData, baseFee: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Hourly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={newRateData.hourlyRate}
                      onChange={(e) => setNewRateData({ ...newRateData, hourlyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Daily configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={newRateData.dailyMax}
                      onChange={(e) => setNewRateData({ ...newRateData, dailyMax: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Weekly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={newRateData.weeklyRate}
                      onChange={(e) => setNewRateData({ ...newRateData, weeklyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Monthly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={newRateData.monthlyRate}
                      onChange={(e) => setNewRateData({ ...newRateData, monthlyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Grace Period (Mins)</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <select
                      value={newRateData.gracePeriod}
                      onChange={(e) => setNewRateData({ ...newRateData, gracePeriod: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold text-gray-900 outline-none cursor-pointer appearance-none transition-all"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddNew}
                disabled={saving}
                className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg shadow-sm hover:bg-black active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                {saving ? 'Processing...' : 'Append Classification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editRateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Edit Node</h3>
              <button onClick={() => setShowEditModal(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Classification Name</label>
                <input
                  type="text"
                  value={editRateData.vehicleType}
                  onChange={(e) => setEditRateData({ ...editRateData, vehicleType: e.target.value })}
                  placeholder="e.g. Electric Scooter"
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Base configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={editRateData.baseFee}
                      onChange={(e) => setEditRateData({ ...editRateData, baseFee: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Hourly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={editRateData.hourlyRate}
                      onChange={(e) => setEditRateData({ ...editRateData, hourlyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Daily configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={editRateData.dailyMax}
                      onChange={(e) => setEditRateData({ ...editRateData, dailyMax: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Weekly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={editRateData.weeklyRate}
                      onChange={(e) => setEditRateData({ ...editRateData, weeklyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Monthly configuration</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="number"
                      value={editRateData.monthlyRate}
                      onChange={(e) => setEditRateData({ ...editRateData, monthlyRate: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Grace Period (Mins)</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <select
                      value={editRateData.gracePeriod}
                      onChange={(e) => setEditRateData({ ...editRateData, gracePeriod: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-amber-500 rounded-lg text-sm font-semibold text-gray-900 outline-none cursor-pointer appearance-none transition-all"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-lg shadow-sm hover:bg-amber-700 active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                {saving ? 'Processing...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue config</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Configure vehicle classification and global parking tariffs</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 bg-gray-100 font-sans hover:bg-gray-200 text-gray-900 font-bold px-4 py-2 rounded-lg transition-all uppercase text-[10px] tracking-wider border border-transparent active:scale-95"
          >
            <RotateCcw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all uppercase text-[10px] tracking-wider active:scale-95 group"
          >
            <Plus size={14} />
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Revenue Table Container */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-50">
                    <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Classification</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Base Fee</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hourly</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Daily</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Weekly</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Monthly</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Grace</th>
                    <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rates.map((rate, idx) => (
                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-sm font-semibold text-gray-900 tracking-tight">{rate.vehicleType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-900">
                          <IndianRupee size={12} className="text-amber-500" />
                          {rate.baseFee}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                          <IndianRupee size={10} />
                          {rate.hourlyRate}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                          <IndianRupee size={10} />
                          {rate.dailyMax}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                          <IndianRupee size={10} />
                          {rate.weeklyRate || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                          <IndianRupee size={10} />
                          {rate.monthlyRate || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                          {rate.gracePeriod}m
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rate, idx)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent shadow-sm"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(idx)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent shadow-sm"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rates.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-4">
                <p className="text-xs font-black uppercase tracking-widest italic">No revenue nodes defined</p>
              </div>
            )}
          </div>

        </div>

      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />
    </div>
  );
};

export default ParkingConfig;
