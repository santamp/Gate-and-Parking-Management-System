import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Search,
  Filter,
  User,
  Settings,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  CreditCard,
  Zap,
  ToggleLeft,
  ToggleRight,
  X,
  Car,
  BadgeCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import adminService from '../../services/adminService';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS = {
  ENTRY_REGISTERED:    { label: 'Entry Registered',   color: 'blue',   icon: <ArrowDownLeft size={13} /> },
  ENTRY_APPROVED:      { label: 'Approved',            color: 'green',  icon: <CheckCircle2 size={13} /> },
  ENTRY_REJECTED:      { label: 'Rejected',            color: 'red',    icon: <XCircle size={13} /> },
  ENTRY_OVERRIDE:      { label: 'Override (Guard)',    color: 'orange', icon: <Zap size={13} /> },
  ENTRY_NOT_MY_VEHICLE:{ label: 'Not My Vehicle',      color: 'purple', icon: <Car size={13} /> },
  PAYMENT_PROCESSED:   { label: 'Payment',             color: 'teal',   icon: <CreditCard size={13} /> },
  EXIT_RECORDED:       { label: 'Exit Recorded',       color: 'indigo', icon: <ArrowUpRight size={13} /> },
  ADMIN_OVERRIDE:      { label: 'Admin Override',      color: 'rose',   icon: <ShieldAlert size={13} /> },
  ADMIN_CONFIG_CHANGE: { label: 'Config Changed',      color: 'amber',  icon: <Settings size={13} /> },
  USER_CREATED:        { label: 'User Created',        color: 'green',  icon: <User size={13} /> },
  USER_DELETED:        { label: 'User Deleted',        color: 'red',    icon: <User size={13} /> },
  USER_PASSWORD_RESET: { label: 'Password Reset',      color: 'amber',  icon: <User size={13} /> },
  LOGIN:               { label: 'Login',               color: 'gray',   icon: <LogIn size={13} /> },
  LOGOUT:              { label: 'Logout',              color: 'gray',   icon: <LogOut size={13} /> },
  SYSTEM:              { label: 'System',              color: 'gray',   icon: <Activity size={13} /> },
};

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-100',dot: 'bg-emerald-500' },
  red:    { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-100',   dot: 'bg-rose-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', dot: 'bg-purple-500' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-100',   dot: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-500' },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-100',   dot: 'bg-rose-500' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  dot: 'bg-amber-500' },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-100',   dot: 'bg-gray-400' },
};

const ROLE_CONFIG = {
  ADMIN:    { bg: 'bg-amber-100',   text: 'text-amber-800'  },
  GUARD:    { bg: 'bg-blue-100',    text: 'text-blue-800'   },
  OCCUPIER: { bg: 'bg-purple-100',  text: 'text-purple-800' },
  SYSTEM:   { bg: 'bg-gray-100',    text: 'text-gray-700'   },
};

function ActionBadge({ action }) {
  const cfg = ACTION_LABELS[action] || { label: action, color: 'gray', icon: <Activity size={12} /> };
  const clr = COLOR_MAP[cfg.color] || COLOR_MAP.gray;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${clr.bg} ${clr.text} ${clr.border}`}>
      {React.cloneElement(cfg.icon, { size: 12 })}
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.SYSTEM;
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight rounded-md ${cfg.bg} ${cfg.text}`}>
      {role}
    </span>
  );
}

function StatCard({ label, value, icon, color, loading }) {
  const clr = COLOR_MAP[color] || COLOR_MAP.gray;
  return (
    <div className={`bg-white rounded-xl border ${clr.border} p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`p-2 rounded-lg ${clr.bg}`}>
        <span className={clr.text}>{React.cloneElement(icon, { size: 18 })}</span>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</div>
        {loading
          ? <div className="h-5 w-12 bg-gray-100 rounded animate-pulse mt-1" />
          : <div className="text-xl font-bold text-gray-900 mt-0.5 tracking-tight">{value ?? '—'}</div>
        }
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AuditLogs = () => {
  const [logs, setLogs]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const autoRefreshRef = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    action: '',
    actorRole: '',
    startDate: '',
    endDate: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const LIMIT = 25;

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await adminService.getAuditLogStats();
      setStats(res.data);
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (currentPage = 1, currentFilters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilters.action     && { action:    currentFilters.action }),
        ...(currentFilters.actorRole  && { actorRole: currentFilters.actorRole }),
        ...(currentFilters.startDate  && { startDate: currentFilters.startDate }),
        ...(currentFilters.endDate    && { endDate:   currentFilters.endDate }),
        ...(currentFilters.search     && { search:    currentFilters.search }),
      };
      const res = await adminService.getAuditLogs(params);
      setLogs(res.logs || []);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
      setPage(currentPage);
    } catch (err) {
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchStats();
    fetchLogs(1, appliedFilters);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchLogs(page, appliedFilters);
      }, 15000);
    } else {
      clearInterval(autoRefreshRef.current);
    }
    return () => clearInterval(autoRefreshRef.current);
  }, [autoRefresh, page, appliedFilters, fetchLogs]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    fetchLogs(1, filters);
    fetchStats();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const empty = { search: '', action: '', actorRole: '', startDate: '', endDate: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    fetchLogs(1, empty);
    fetchStats();
  };

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== '');

  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fmtRelative = (iso) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Trail</h1>
          <p className="text-gray-500 font-medium mt-1 text-xs">
            Immutable system event log — every entry, approval, payment and override captured
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
              autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {autoRefresh ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            Live
          </button>
          <button
            onClick={() => { fetchLogs(page, appliedFilters); fetchStats(); }}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Events"  value={stats?.totalEvents}  icon={<Activity size={20} />}    color="blue"   loading={statsLoading} />
        <StatCard label="Entry / Exit"  value={stats ? `${stats.entryEvents} / ${stats.exitEvents}` : null} icon={<ArrowDownLeft size={20}/>} color="green"  loading={statsLoading} />
        <StatCard label="Approvals"     value={stats?.approvalEvents} icon={<BadgeCheck size={20} />}  color="teal"   loading={statsLoading} />
        <StatCard label="Overrides"     value={stats?.overrideEvents} icon={<ShieldAlert size={20} />} color="rose"   loading={statsLoading} />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search actor, details, entity…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="pl-9 pr-4 py-2 w-full bg-gray-50 rounded-lg text-sm font-medium border border-gray-100 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
          </div>

          {/* Action filter */}
          <select
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          {/* Role filter */}
          <select
            value={filters.actorRole}
            onChange={e => setFilters(f => ({ ...f, actorRole: e.target.value }))}
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="GUARD">Guard</option>
            <option value="OCCUPIER">Occupier</option>
            <option value="SYSTEM">System</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="px-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
            <span className="text-gray-400 text-[10px] font-bold">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="px-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all shadow-sm"
          >
            Apply
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2 py-2 text-gray-500 text-xs font-bold hover:text-rose-600 transition-colors"
              title="Clear filters"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {appliedFilters.action && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                Action: {ACTION_LABELS[appliedFilters.action]?.label || appliedFilters.action}
              </span>
            )}
            {appliedFilters.actorRole && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                Role: {appliedFilters.actorRole}
              </span>
            )}
            {appliedFilters.startDate && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                From: {appliedFilters.startDate}
              </span>
            )}
            {appliedFilters.endDate && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                To: {appliedFilters.endDate}
              </span>
            )}
            {appliedFilters.search && (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                Search: "{appliedFilters.search}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        {/* Table header result count */}
        <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {loading ? 'Loading…' : `${total.toLocaleString()} event${total !== 1 ? 's' : ''}`}
          </span>
          {autoRefresh && (
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed Active
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle size={36} className="text-rose-400" />
                      <p className="text-rose-600 font-bold text-sm">{error}</p>
                      <button onClick={() => fetchLogs(page)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={40} className="text-gray-200" />
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No audit events found</p>
                      {hasActiveFilters && (
                        <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-300 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-gray-800 whitespace-nowrap">{fmt(log.createdAt)}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{fmtRelative(log.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                            {log.userId?.name || 'System'}
                          </div>
                          <RoleBadge role={log.actorRole} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-3 max-w-[260px]">
                      <div className="text-xs text-gray-600 font-medium line-clamp-1">
                        {log.details || <span className="text-gray-300 italic">No details</span>}
                      </div>
                      {log.entity && (
                        <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-tight mt-0.5">
                          {log.entity}
                          {log.entityId && <span className="text-gray-300 font-mono ml-1">#{String(log.entityId).slice(-6)}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-mono text-gray-400">{log.ipAddress || '—'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        className="p-1 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="View details"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1, appliedFilters)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              {/* Page number pills */}
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => fetchLogs(p, appliedFilters)}
                    className={`h-7 w-7 rounded-lg text-[10px] font-bold transition-all ${
                      p === page ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1, appliedFilters)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-400">
            <FileText size={14} className="opacity-50" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">
              System event registers are immutable and archived for compliance.
            </span>
          </div>
        </div>
      </div>

      {/* Detail Drawer / Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <ActionBadge action={selectedLog.action} />
                <h3 className="text-lg font-black text-gray-900 mt-2">Event Detail</h3>
                <p className="text-xs text-gray-400 font-mono">{selectedLog._id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {[
                { label: 'Timestamp',   value: fmt(selectedLog.createdAt) },
                { label: 'Actor',       value: selectedLog.userId?.name || 'System' },
                { label: 'Role',        value: <RoleBadge role={selectedLog.actorRole} /> },
                { label: 'Entity',      value: selectedLog.entity || '—' },
                { label: 'Entity ID',   value: selectedLog.entityId ? <span className="font-mono text-xs">{selectedLog.entityId}</span> : '—' },
                { label: 'IP Address',  value: selectedLog.ipAddress || '—' },
                { label: 'Details',     value: selectedLog.details || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="w-24 text-[10px] font-black uppercase tracking-widest text-gray-400 pt-0.5 flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{value}</span>
                </div>
              ))}
              {selectedLog.metadata && (
                <div className="flex items-start gap-4">
                  <span className="w-24 text-[10px] font-black uppercase tracking-widest text-gray-400 pt-0.5 flex-shrink-0">Metadata</span>
                  <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto flex-1 border border-gray-100 text-gray-600 max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
