import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Shield, 
  User, 
  Key, 
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Phone
} from 'lucide-react';
import adminService from '../../services/adminService';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'OCCUPIER',
    password: ''
  });
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const roleFilter = activeTab === 'all' ? '' : activeTab.toUpperCase().slice(0, -1);
      const data = await adminService.getUsers({ 
        role: roleFilter,
        search: search 
      });
      setUsers(data.users || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchUsers();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(id);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt('Enter new password:');
    if (newPassword) {
      try {
        await adminService.resetPassword(id, newPassword);
        alert('Password reset successfully');
      } catch (err) {
        alert('Failed to reset password');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await adminService.createUser(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', role: 'OCCUPIER', password: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Access Control</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Manage system users, permissions and roles
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all uppercase text-[10px] tracking-wider active:scale-95"
        >
          <UserPlus size={14} />
          Provision New User
        </button>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['guards', 'occupiers', 'admins', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search users..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-1 focus:ring-gray-900 rounded-lg w-64 text-xs font-medium transition-all"
            />
          </div>
          <button 
            onClick={fetchUsers}
            className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-lg border border-gray-100 transition-all hover:bg-white"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/20 border-b border-gray-50">
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">User Node</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Identity</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Access Level</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lifecycle</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-8 py-5"><div className="h-4 bg-gray-50 rounded w-full"></div></td>
                  ))}
                </tr>
              ))
            ) : (!Array.isArray(users) || users.length === 0) ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold italic uppercase tracking-widest">
                  No users found
                </td>
              </tr>
            ) : (
              (Array.isArray(users) ? users : []).map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm tracking-tight">{user.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 uppercase truncate max-w-[150px]">
                          <Mail size={10} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-700 text-[10px] flex items-center gap-1 uppercase">
                      <Phone size={10} className="text-gray-400" />
                      {user.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'ADMIN' && <Key size={12} className="text-amber-600" />}
                      {user.role === 'GUARD' && <Shield size={12} className="text-emerald-600" />}
                      {user.role === 'OCCUPIER' && <User size={12} className="text-indigo-600" />}
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${
                        user.role === 'ADMIN' ? 'text-amber-600' : 
                        user.role === 'GUARD' ? 'text-emerald-600' : 'text-indigo-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500">
                          Active
                        </span>
                      </div>
                      <div className="text-[8px] text-gray-400 font-semibold uppercase">Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleResetPassword(user._id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 bg-gray-50 hover:bg-amber-50 rounded-lg transition-all border border-transparent"
                      >
                        <Key size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg transition-all border border-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>

      {/* Provision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gray-900 px-6 py-4 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                <UserPlus className="text-amber-500" size={18} />
                Provision System Node
              </h2>
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Initialize new user credentials and role</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 ml-1">Full Identity Name</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-1 focus:ring-gray-900 rounded-lg text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 ml-1">Email Protocol</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="user@gate.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-1 focus:ring-gray-900 rounded-lg text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 ml-1">Contact Registry</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-1 focus:ring-gray-900 rounded-lg text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 ml-1">Security PIN</label>
                  <div className="relative group">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={16} />
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 ring-1 ring-gray-100 focus:ring-1 focus:ring-gray-900 rounded-lg text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 ml-1">Access Permissions</label>
                <div className="grid grid-cols-3 gap-3">
                  {['GUARD', 'OCCUPIER', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({...formData, role: r})}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border-2 transition-all ${
                        formData.role === r 
                          ? 'border-gray-900 bg-gray-900 text-white shadow-sm' 
                          : 'border-gray-50 text-gray-400 hover:border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Abort Protocol
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg shadow-sm transition-all uppercase text-[10px] tracking-wider flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={14} className="text-amber-500" />
                      Finalize Provisioning
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
