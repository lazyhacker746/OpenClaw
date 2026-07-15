import {
  Home,
  LogOut,
  Moon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Users,
} from 'lucide-react';
import Logo from './Logo';

const getPlanName = (role) => {
  const normalized = String(role || 'user').toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'pro') return 'Pro';
  return 'Free';
};

export default function Navbar({
  isDark,
  toggleTheme,
  activeTab,
  setActiveTab,
  onLogout,
  user,
  profile,
  isGenerating,
}) {
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'User';
  const planName = getPlanName(profile?.role);
  const isAdmin = String(profile?.role || '').toLowerCase() === 'admin';

  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'generator', label: 'Generator', icon: Search },
    { id: 'vault', label: 'Vault', icon: Users },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck, admin: true }] : []),
  ];

  const changeTab = (tab) => {
    if (isGenerating) return;
    setActiveTab(tab);
  };

  return (
    <>
      <nav className="border-b border-slate-200/75 bg-white/72 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#070c16]/78">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => changeTab('dashboard')}
            disabled={isGenerating}
            className="clarion-focus flex min-w-0 items-center gap-3 rounded-xl text-left disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Open Clarion home"
          >
            <Logo className="h-10 w-10 shrink-0 shadow-lg shadow-indigo-600/18" />
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-[-0.03em] text-slate-950 dark:text-white">Clarion</span>
              <span className="hidden truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:block">Lead intelligence workspace</span>
            </span>
          </button>

          <div className="hidden items-center gap-1 rounded-2xl border border-slate-200/85 bg-slate-100/70 p-1.5 shadow-inner shadow-slate-200/30 dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-none lg:flex">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const activeClass = item.admin
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-white/10';
              const inactiveClass = item.admin
                ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10'
                : 'text-slate-600 hover:bg-white/75 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white';

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => changeTab(item.id)}
                  title={isGenerating ? 'Navigation is locked while the active search is running' : item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`clarion-focus inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-extrabold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${active ? activeClass : inactiveClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                  {item.id === 'generator' && isGenerating && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-label="Search running" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 py-1.5 pl-1.5 pr-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-md shadow-indigo-600/18">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="max-w-[120px] truncate text-xs font-extrabold text-slate-900 dark:text-white">{firstName}</p>
                <p className={`mt-0.5 text-[10px] font-black uppercase tracking-[0.15em] ${isAdmin ? 'text-red-600 dark:text-red-300' : 'text-indigo-600 dark:text-indigo-300'}`}>
                  {planName} plan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="clarion-icon-button clarion-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              disabled={isGenerating}
              className="clarion-icon-button clarion-focus hidden h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-400 dark:hover:border-red-400/20 dark:hover:bg-red-400/10 dark:hover:text-red-300 sm:inline-flex"
              aria-label="Sign out"
              title={isGenerating ? 'Wait for the active search to finish before signing out' : 'Sign out'}
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-3 bottom-3 z-[850] rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0c1423]/92 lg:hidden" aria-label="Mobile navigation">
        <div className="flex items-stretch gap-1 overflow-x-auto clarion-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isGenerating}
                onClick={() => changeTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`clarion-focus relative flex min-w-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-extrabold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                  active
                    ? item.admin
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : item.admin
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === 'generator' && isGenerating && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
          <button
            type="button"
            disabled={isGenerating}
            onClick={onLogout}
            className="clarion-focus flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-extrabold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-400 dark:hover:bg-red-400/10 dark:hover:text-red-300 sm:hidden"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Exit
          </button>
        </div>
      </nav>
    </>
  );
}
