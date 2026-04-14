import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  LogIn,
  LogOut,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Car,
  SlidersHorizontal,
  X,
  CalendarRange,
  Building2,
  Check,
} from 'lucide-react';
import gateService from '../../services/gateService';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { label: 'All',      value: '' },
  { label: 'Inside',   value: 'inside,approved' },
  { label: 'Exited',   value: 'exited' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

const STATUS_META = {
  inside:         { label: 'INSIDE',    bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-500 animate-pulse' },
  approved:       { label: 'APPROVED',  bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-500 animate-pulse' },
  exited:         { label: 'EXITED',    bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-500' },
  pending:        { label: 'PENDING',   bg: 'bg-yellow-50',   text: 'text-yellow-700',  dot: 'bg-yellow-400' },
  rejected:       { label: 'REJECTED',  bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-400' },
  not_my_vehicle: { label: 'DISMISSED', bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-300' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${time}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function countActiveFilters({ dateFrom, dateTo, unitId }) {
  return [dateFrom, dateTo, unitId].filter(Boolean).length;
}

// ─── Filter Drawer ────────────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, units, applied, onApply }) => {
  const [dateFrom, setDateFrom] = useState(applied.dateFrom || '');
  const [dateTo,   setDateTo]   = useState(applied.dateTo   || '');
  const [unitId,   setUnitId]   = useState(applied.unitId   || '');
  const drawerRef = useRef(null);

  // Sync with parent applied state when drawer opens
  useEffect(() => {
    if (open) {
      setDateFrom(applied.dateFrom || '');
      setDateTo(applied.dateTo   || '');
      setUnitId(applied.unitId   || '');
    }
  }, [open, applied]);

  const handleApply = () => {
    onApply({ dateFrom, dateTo, unitId });
    onClose();
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    setUnitId('');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-5 space-y-5"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Filters</h3>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
              Refine your log results
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* ── Date Range ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="text-primary-500" />
            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Date Range</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || todayISO()}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={todayISO()}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 transition-all"
              />
            </div>
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Today',      from: todayISO(),                                 to: todayISO() },
              { label: 'Yesterday',  from: (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })(), to: (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })() },
              { label: 'Last 7 days',from: (() => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().split('T')[0]; })(), to: todayISO() },
              { label: 'This month', from: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })(), to: todayISO() },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => { setDateFrom(preset.from); setDateTo(preset.to); }}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  dateFrom === preset.from && dateTo === preset.to
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Unit Filter ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-primary-500" />
            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Unit</span>
          </div>
          {units.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No units available</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              <button
                onClick={() => setUnitId('')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  unitId === '' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Units
                {unitId === '' && <Check size={13} className="text-primary-600" />}
              </button>
              {units.map(unit => (
                <button
                  key={unit._id}
                  onClick={() => setUnitId(unit._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    unitId === unit._id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{unit.label}</span>
                  {unitId === unit._id && <Check size={13} className="text-primary-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-2">
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs font-black text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-all"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-2xl bg-gray-900 text-xs font-black text-white uppercase tracking-wider hover:bg-black transition-all shadow-sm active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const History = () => {
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [units,        setUnits]        = useState([]);

  // Search (committed on Enter/blur)
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');

  // Status pill filter
  const [statusFilter, setStatusFilter] = useState('');

  // Advanced filters (applied via drawer)
  const [appliedFilters, setAppliedFilters] = useState({ dateFrom: '', dateTo: '', unitId: '' });

  // Drawer open state
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // Pagination
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = 10;

  // Load units once
  useEffect(() => {
    gateService.getUnits().then(res => setUnits(res.data || [])).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gateService.getVehicleLogs({
        vehicleNumber: search   || undefined,
        status:        statusFilter || undefined,
        unitId:        appliedFilters.unitId   || undefined,
        dateFrom:      appliedFilters.dateFrom || undefined,
        dateTo:        appliedFilters.dateTo   || undefined,
        page,
        limit: LIMIT,
      });
      setLogs(data.data || []);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      setError(err?.message || 'Failed to load logs. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, appliedFilters, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const commitSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const activeFilterCount = countActiveFilters(appliedFilters);

  return (
    <div className="space-y-4 pb-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="sticky top-0 bg-gray-50 pt-2 pb-3 z-10 space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Logs</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Vehicle traffic history
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Advanced filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`relative p-2 rounded-xl border transition-colors ${
                activeFilterCount > 0
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-100 text-gray-400 hover:text-gray-700'
              }`}
            >
              <SlidersHorizontal size={17} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Refresh */}
            <button
              onClick={() => { setPage(1); fetchLogs(); }}
              className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
            onBlur={commitSearch}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-1 focus:ring-primary-500 focus:outline-none font-bold text-gray-800 uppercase text-xs placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 transition-all"
            placeholder="Search by vehicle number…"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 size={15} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleStatusChange(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                statusFilter === f.value
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {appliedFilters.dateFrom && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black">
                <CalendarRange size={10} />
                From {appliedFilters.dateFrom}
                <button onClick={() => { handleApplyFilters({ ...appliedFilters, dateFrom: '' }); }} className="ml-0.5 hover:text-primary-900"><X size={10} /></button>
              </span>
            )}
            {appliedFilters.dateTo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black">
                <CalendarRange size={10} />
                To {appliedFilters.dateTo}
                <button onClick={() => { handleApplyFilters({ ...appliedFilters, dateTo: '' }); }} className="ml-0.5 hover:text-primary-900"><X size={10} /></button>
              </span>
            )}
            {appliedFilters.unitId && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black">
                <Building2 size={10} />
                {units.find(u => u._id === appliedFilters.unitId)?.label || 'Unit'}
                <button onClick={() => { handleApplyFilters({ ...appliedFilters, unitId: '' }); }} className="ml-0.5 hover:text-primary-900"><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* ── Log list ── */}
      <div className="space-y-2.5">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-md" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Car size={32} className="mx-auto text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">No logs found</p>
            <p className="text-xs text-gray-300">Try adjusting your search or filters</p>
          </div>
        ) : (
          logs.map((log) => {
            const exited = log.status === 'exited';
            const meta   = STATUS_META[log.status] || STATUS_META.pending;

            return (
              <div
                key={log._id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 hover:border-gray-200 transition-colors"
              >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-full flex-shrink-0 ${exited ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {exited ? <LogOut size={18} /> : <LogIn size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-gray-900 text-sm tracking-tight truncate">{log.vehicleNumber}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs font-semibold text-gray-500 truncate">
                        {log.occupierMappedId?.name || 'Gate Access'}
                      </span>
                      {log.unitName && log.unitName !== 'N/A' && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                          <span className="text-[10px] text-gray-400 font-semibold truncate flex items-center gap-0.5">
                            <Building2 size={9} /> {log.unitName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-medium">
                      <Clock size={9} />
                      <span>{formatDate(log.entryTime)}</span>
                      {exited && log.exitTime && (
                        <>
                          <span className="mx-0.5">→</span>
                          <span>{formatDate(log.exitTime)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: status badge */}
                <div className={`flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg ${meta.bg} ${meta.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {totalRecords} total records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1.5 bg-gray-900 rounded-lg text-[10px] font-black text-white">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Drawer ── */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        units={units}
        applied={appliedFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default History;
