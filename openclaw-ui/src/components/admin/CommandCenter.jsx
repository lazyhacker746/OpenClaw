import React, { useState, useEffect } from 'react';
import { ShieldAlert, Edit2, Save, X, Loader2, Database, Zap, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommandCenter({ user }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('user');
  const [editStandard, setEditStandard] = useState(0);
  const [editAi, setEditAi] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        // Passing the admin's user ID so the backend can verify clearance
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

  // 2. Open Modal and populate current data
  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setEditRole(targetUser.role || 'user');
    setEditStandard(targetUser.standard_credits);
    setEditAi(targetUser.ai_credits);
  };

  // 3. Submit changes to the backend
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
        toast.success(`User upgraded to ${editRole.toUpperCase()} successfully.`);
        // Update local state instantly without refetching the whole database
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id
            ? { ...u, role: editRole, standard_credits: editStandard, ai_credits: editAi }
            : u
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-red-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-sm">Accessing Secure Database...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#050505]/90 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.1)] flex-1 flex flex-col min-h-[600px] relative overflow-hidden">

      {/* Background Glow FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

      <div className="flex items-center justify-between mb-8 border-b border-red-500/20 pb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">Command Center</h2>
            <p className="text-xs font-mono text-red-400/70 uppercase tracking-widest mt-1">Level 4 Admin Clearance</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50 text-red-400 font-mono text-xs">
          <Database className="w-4 h-4" />
          <span>{users.length} Records Found</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar flex-1 border border-gray-800 rounded-xl bg-black/50">
        <table className="w-full text-sm text-left text-gray-300 relative">
          <thead className="text-xs uppercase bg-[#0B0F19] text-gray-500 font-bold sticky top-0 z-10 border-b border-gray-800">
            <tr>
              <th className="px-5 py-4 whitespace-nowrap">User Identity</th>
              <th className="px-5 py-4">Clearance Role</th>
              <th className="px-5 py-4">Credits (Std / AI)</th>
              <th className="px-5 py-4 text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-red-900/10 transition-colors group">
                <td className="px-5 py-4 font-mono text-xs">
                  <span className="text-white block mb-1">{u.full_name || 'Unknown User'}</span>
                  <span className="text-gray-500">{u.id.substring(0, 8)}...</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                    ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 
                      u.role === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 
                      'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-gray-400"><CreditCard className="w-3 h-3 text-gray-500"/> {u.standard_credits}</span>
                    <span className="flex items-center gap-1 text-gray-400"><Zap className="w-3 h-3 text-blue-500"/> {u.ai_credits}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => openEditModal(u)}
                    className="inline-flex items-center space-x-1 bg-gray-800 hover:bg-red-900/40 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-500/50 px-3 py-1.5 rounded-md font-bold transition-all text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Modify</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OVERRIDE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0F19] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.15)] w-full max-w-md overflow-hidden flex flex-col relative">

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-purple-600"></div>

            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Override User Data</h3>
                <p className="text-xs font-mono text-gray-500 mt-1">ID: {editingUser.id}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Clearance Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-black border border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-white outline-none cursor-pointer"
                >
                  <option value="user">Standard User (Free)</option>
                  <option value="pro">Pro Tier</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Standard Limits</label>
                  <input
                    type="number" min="0"
                    value={editStandard} onChange={(e) => setEditStandard(e.target.value)}
                    className="w-full bg-black border border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-white font-mono outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">AI Limits</label>
                  <input
                    type="number" min="0"
                    value={editAi} onChange={(e) => setEditAi(e.target.value)}
                    className="w-full bg-black border border-gray-700 focus:border-red-500 rounded-lg py-3 px-4 text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-black/40 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleSaveUpdate}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Execute Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}