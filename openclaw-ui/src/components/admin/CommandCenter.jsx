import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Edit2, Save, X, Loader2, Database, Zap, CreditCard, Search, Filter, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommandCenter({ user }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('user');
  const [editStandard, setEditStandard] = useState(0);
  const [editAi, setEditAi] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/admin/users?requester_id=${user.id}`);
        const result = await response.json();

        if (result.status === 'success') {
          setUsers(result.data);
        } else {
          toast.error(result.message || "Failed to load users.");
        }
      } catch (error) {
        toast.error("Network error connecting to Admin API.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [user.id]);

  // Derived state for filtering
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        u.id.includes(searchQuery);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setEditRole(targetUser.role || 'user');
    setEditStandard(targetUser.standard_credits);
    setEditAi(targetUser.ai_credits);
    setShowDeleteConfirm(false);
  };

  const handleSaveUpdate = async () => {
    setIsSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: user.id,
          target_user_id: editingUser.id,
          new_role: editRole,
          standard_credits: Number(editStandard),
          ai_credits: Number(editAi)
        })
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success(`User updated successfully.`);
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id ? { ...u, role: editRole, standard_credits: editStandard, ai_credits: editAi } : u
        ));
        setEditingUser(null);
      } else {
        toast.error(result.message || "Update failed.");
      }
    } catch (error) {
      toast.error("Network error while updating user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {

    setIsDeleting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: user.id, target_user_id: editingUser.id })
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success("User permanently deleted.");
        setUsers(prev => prev.filter(u => u.id !== editingUser.id));
        setEditingUser(null);
      } else {
        toast.error(result.message || "Deletion failed.");
      }
    } catch (error) {
      toast.error("Network error while deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-red-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-sm">Accessing Secure Database...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-[#050505]/90 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(220,38,38,0.1)] flex-1 flex flex-col min-h-[600px] relative overflow-hidden transition-colors duration-300">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 border-b border-red-500/20 pb-6 relative z-10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest uppercase dark:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">Command Center</h2>
            <p className="text-xs font-mono text-red-600 dark:text-red-400/70 uppercase tracking-widest mt-1">Level 4 Admin Clearance</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search email, name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:border-red-500 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 focus:border-red-500 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="pro">Pro Users</option>
              <option value="user">Free Users</option>
            </select>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-mono text-xs">
            <Database className="w-4 h-4" />
            <span>{filteredUsers.length} Found</span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar flex-1 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-black/50">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 relative">
          <thead className="text-xs uppercase bg-gray-100 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-500 font-bold sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md">
            <tr>
              <th className="px-5 py-4 whitespace-nowrap">User Identity</th>
              <th className="px-5 py-4">Clearance Role</th>
              <th className="px-5 py-4">Credits (Std / AI)</th>
              <th className="px-5 py-4 text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                  <td className="px-5 py-4 font-mono text-xs">
                    <span className="text-gray-900 dark:text-white block font-bold mb-1 font-sans">{u.full_name || 'Unknown User'}</span>
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1"><Mail className="w-3 h-3"/> {u.email || 'No email synced'}</span>
                    <span className="text-gray-400 dark:text-gray-600 text-[10px]">{u.id.substring(0, 12)}...</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                      ${u.role === 'admin' ? 'bg-red-100 text-red-600 border-red-300 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/30 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 
                        u.role === 'pro' ? 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30' : 
                        'bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30'}`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-bold"><CreditCard className="w-3 h-3 text-gray-500"/> {u.standard_credits}</span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-bold"><Zap className="w-3 h-3 text-purple-500 dark:text-blue-500"/> {u.ai_credits}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex items-center space-x-1 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-gray-700 hover:border-red-500/50 px-3 py-1.5 rounded-md font-bold transition-all text-xs shadow-sm"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modify</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* OVERRIDE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-red-500/30 rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden flex flex-col relative">

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-purple-600"></div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-transparent">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Override User Data</h3>
                <p className="text-xs font-mono text-gray-500 mt-1">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">Clearance Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="user">Standard User (Free)</option>
                  <option value="pro">Pro Tier</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">Standard Limits</label>
                  <input
                    type="number" min="0"
                    value={editStandard} onChange={(e) => setEditStandard(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">AI Limits</label>
                  <input
                    type="number" min="0"
                    value={editAi} onChange={(e) => setEditAi(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-gray-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center gap-3 min-h-[80px]">
              {showDeleteConfirm ? (
                <div className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-lg animate-in fade-in zoom-in duration-200">
                  <span className="text-sm font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Confirm Deletion?
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-bold transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleDeleteUser} disabled={isDeleting} className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>Yes, Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting || editingUser.id === user.id}
                    className="p-2.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    title="Ban / Delete User"
                  >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>

                  <div className="flex gap-3">
                    <button onClick={() => { setEditingUser(null); setShowDeleteConfirm(false); }} className="px-5 py-2.5 rounded-lg font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUpdate}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 text-sm shadow-md dark:shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Execute Override</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}