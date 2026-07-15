import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  Database,
  Edit3,
  Loader2,
  Mail,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const roleStyles = {
  admin: 'border-red-200 bg-red-50 text-red-700 dark:border-red-300/15 dark:bg-red-300/[0.07] dark:text-red-300',
  pro: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/15 dark:bg-amber-300/[0.07] dark:text-amber-300',
  user: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
};

function RoleBadge({ role }) {
  const normalized = String(role || 'user').toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${roleStyles[normalized] || roleStyles.user}`}>
      {normalized === 'admin' && <ShieldCheck className="h-3 w-3" aria-hidden="true" />}
      {normalized === 'user' ? 'Free' : normalized}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, description, tone = 'indigo' }) {
  const palette = tone === 'red'
    ? 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300'
    : tone === 'amber'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300'
      : tone === 'teal'
        ? 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300'
        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300';

  return (
    <article className="clarion-surface rounded-[1.4rem] p-4 sm:p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
      <p className="mt-4 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </article>
  );
}

export default function CommandCenter({ user }) {
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
          setUsersData(Array.isArray(result.data) ? result.data : []);
        } else {
          toast.error(result.message || 'User records could not be loaded.');
        }
      } catch {
        toast.error('Clarion could not connect to the Admin API.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [user.id]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return usersData.filter((account) => {
      const matchesSearch = !query || `${account.full_name || ''} ${account.email || ''} ${account.id || ''}`.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || account.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersData, searchQuery, roleFilter]);

  const metrics = useMemo(() => {
    const admins = usersData.filter((account) => account.role === 'admin').length;
    const pros = usersData.filter((account) => account.role === 'pro').length;
    const totalStandard = usersData.reduce((sum, account) => sum + (Number(account.standard_credits) || 0), 0);
    return { total: usersData.length, admins, pros, totalStandard };
  }, [usersData]);

  const openEditModal = (account) => {
    setEditingUser(account);
    setEditRole(account.role || 'user');
    setEditStandard(account.standard_credits ?? 0);
    setEditAi(account.ai_credits ?? 0);
    setShowDeleteConfirm(false);
  };

  const closeModal = () => {
    if (isSaving || isDeleting) return;
    setEditingUser(null);
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
          ai_credits: Number(editAi),
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        setUsersData((current) => current.map((account) => account.id === editingUser.id ? { ...account, role: editRole, standard_credits: Number(editStandard), ai_credits: Number(editAi) } : account));
        toast.success('Account access and credits updated.');
        setEditingUser(null);
      } else {
        toast.error(result.message || 'The account update failed.');
      }
    } catch {
      toast.error('A network error interrupted the account update.');
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
        body: JSON.stringify({ requester_id: user.id, target_user_id: editingUser.id }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        setUsersData((current) => current.filter((account) => account.id !== editingUser.id));
        toast.success('User account permanently deleted.');
        setEditingUser(null);
      } else {
        toast.error(result.message || 'The account could not be deleted.');
      }
    } catch {
      toast.error('A network error interrupted account deletion.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="clarion-surface flex min-h-[560px] flex-col items-center justify-center rounded-[1.75rem] text-center">
        <Loader2 className="h-7 w-7 animate-spin text-red-600 dark:text-red-300" aria-hidden="true" />
        <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">Opening the Command Center</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loading protected account records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Protected administration</div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl">Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Manage user access levels and credit balances without exposing authentication secrets.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-red-700 dark:border-red-300/15 dark:bg-red-300/[0.07] dark:text-red-300"><Database className="h-3.5 w-3.5" aria-hidden="true" />Live profile data</span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin metrics">
        <MetricCard icon={Users} label="Total users" value={metrics.total.toLocaleString()} description="All profile records currently visible to this admin." />
        <MetricCard icon={ShieldCheck} label="Administrators" value={metrics.admins.toLocaleString()} description="Accounts with full Command Center access." tone="red" />
        <MetricCard icon={BarChart3} label="Pro users" value={metrics.pros.toLocaleString()} description="Accounts currently assigned to the Pro tier." tone="amber" />
        <MetricCard icon={CreditCard} label="Search credits" value={metrics.totalStandard.toLocaleString()} description="Combined remaining standard credits across all users." tone="teal" />
      </section>

      <section className="clarion-surface-strong overflow-hidden rounded-[1.75rem]">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"><UserRound className="h-5 w-5" aria-hidden="true" /></div>
            <div><h2 className="text-lg font-black text-slate-950 dark:text-white">User directory</h2><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{filteredUsers.length} matching accounts</p></div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(230px,1fr)_150px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input type="search" placeholder="Search name, email, or user ID" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="clarion-input h-11 pl-11 pr-4 text-sm font-semibold" />
            </div>
            <div className="relative">
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="clarion-input h-11 appearance-none px-3.5 pr-9 text-sm font-bold">
                <option value="all">All roles</option>
                <option value="admin">Admins</option>
                <option value="pro">Pro users</option>
                <option value="user">Free users</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-500"><Users className="h-7 w-7" aria-hidden="true" /></div>
            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">No matching accounts</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Change the search term or role filter.</p>
          </div>
        ) : (
          <>
            <div className="clarion-scrollbar max-h-[720px] space-y-3 overflow-y-auto p-4 md:hidden">
              {filteredUsers.map((account) => (
                <article key={account.id} className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/[0.08] dark:bg-white/[0.025]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">{(account.full_name || account.email || 'U').charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black text-slate-950 dark:text-white">{account.full_name || 'Unnamed user'}</h3><p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{account.email || 'No email synced'}</p><div className="mt-2"><RoleBadge role={account.role} /></div></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Search credits</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{Number(account.standard_credits || 0).toLocaleString()}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">AI credits</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{Number(account.ai_credits || 0).toLocaleString()}</p></div></div>
                  <button type="button" onClick={() => openEditModal(account)} className="clarion-button-secondary clarion-focus mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-red-300 hover:text-red-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-red-300/25 dark:hover:text-red-300"><Edit3 className="h-4 w-4" aria-hidden="true" />Manage account</button>
                </article>
              ))}
            </div>

            <div className="clarion-scrollbar hidden max-h-[720px] overflow-auto md:block">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111a2b]/95 dark:text-slate-400"><tr><th className="px-5 py-4">Identity</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Credits</th><th className="px-5 py-4">User ID</th><th className="px-5 py-4 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.07]">
                  {filteredUsers.map((account) => (
                    <tr key={account.id} className="bg-white/40 transition hover:bg-red-50/50 dark:bg-transparent dark:hover:bg-red-400/[0.035]">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">{(account.full_name || account.email || 'U').charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="max-w-[240px] truncate font-black text-slate-950 dark:text-white">{account.full_name || 'Unnamed user'}</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{account.email || 'No email synced'}</p></div></div></td>
                      <td className="px-5 py-4"><RoleBadge role={account.role} /></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />{Number(account.standard_credits || 0).toLocaleString()}</span><span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" aria-hidden="true" />{Number(account.ai_credits || 0).toLocaleString()}</span></div></td>
                      <td className="px-5 py-4"><code className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">{account.id.substring(0, 12)}…</code></td>
                      <td className="px-5 py-4 text-right"><button type="button" onClick={() => openEditModal(account)} className="clarion-button-secondary clarion-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-red-300 hover:text-red-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-red-300/25 dark:hover:text-red-300"><Edit3 className="h-4 w-4" aria-hidden="true" />Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {editingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" role="presentation" onMouseDown={closeModal}>
          <section className="clarion-surface-strong clarion-enter w-full max-w-lg overflow-hidden rounded-[1.75rem]" role="dialog" aria-modal="true" aria-labelledby="edit-account-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 dark:border-white/[0.08] sm:p-6">
              <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Administrative override</p><h2 id="edit-account-title" className="mt-1.5 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Manage account</h2><p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{editingUser.email}</p></div>
              <button type="button" onClick={closeModal} className="clarion-icon-button clarion-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white" aria-label="Close account editor"><X className="h-5 w-5" aria-hidden="true" /></button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="edit-role" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Account role</label>
                <div className="relative"><select id="edit-role" value={editRole} onChange={(event) => setEditRole(event.target.value)} className="clarion-input h-12 appearance-none px-3.5 pr-10 text-sm font-bold"><option value="user">Free user</option><option value="pro">Pro user</option><option value="admin">Administrator</option></select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="edit-standard" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Search credits</label><input id="edit-standard" type="number" min="0" value={editStandard} onChange={(event) => setEditStandard(event.target.value)} className="clarion-input h-12 px-3.5 text-sm font-bold tabular-nums" /></div>
                <div><label htmlFor="edit-ai" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">AI credits</label><input id="edit-ai" type="number" min="0" value={editAi} onChange={(event) => setEditAi(event.target.value)} className="clarion-input h-12 px-3.5 text-sm font-bold tabular-nums" /></div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs leading-5 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">Changes take effect immediately in the profile table. Authentication credentials are not displayed or modified here.</div>

              {showDeleteConfirm && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-300/15 dark:bg-red-300/[0.06]">
                  <p className="text-sm font-black text-red-800 dark:text-red-200">Delete {editingUser.full_name || editingUser.email} permanently?</p>
                  <p className="mt-1 text-xs leading-5 text-red-700/80 dark:text-red-300/80">This removes the account and cannot be undone.</p>
                  <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="clarion-focus rounded-xl px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-300/10">Keep account</button><button type="button" onClick={handleDeleteUser} disabled={isDeleting} className="clarion-button-danger clarion-focus inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55">{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}Delete account</button></div>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:p-5">
              <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting || editingUser.id === user.id || showDeleteConfirm} className="clarion-icon-button clarion-focus inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35 dark:text-red-300 dark:hover:bg-red-300/10" title={editingUser.id === user.id ? 'You cannot delete your own admin account' : 'Delete account'}><Trash2 className="h-5 w-5" aria-hidden="true" /></button>
              <div className="flex gap-2"><button type="button" onClick={closeModal} disabled={isSaving || isDeleting} className="clarion-button-secondary clarion-focus min-h-11 rounded-xl px-4 text-sm font-black text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]">Cancel</button><button type="button" onClick={handleSaveUpdate} disabled={isSaving || isDeleting} className="clarion-button-primary clarion-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white shadow-lg shadow-red-600/15 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}Save changes</button></div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
