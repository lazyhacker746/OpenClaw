import React, { useEffect, useState } from 'react';
import {
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fullName = profile?.full_name || user?.user_metadata?.full_name;
  const firstName = fullName?.trim().split(/\s+/)[0] || null;
  const fallbackEmail = user?.email || 'Signed in';

  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'generator', label: 'Generator', icon: Search },
    { id: 'vault', label: 'Lead Vault', icon: Users },
    { id: 'settings', label: 'Settings', icon: User },
    ...(profile?.role === 'admin'
      ? [{ id: 'admin', label: 'Command Center', icon: ShieldAlert, admin: true }]
      : []),
  ];

  const handleTabChange = (tab) => {
    if (isGenerating) return;
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const getDesktopTabClass = (item) => {
    const isActive = activeTab === item.id;

    if (item.admin) {
      return isActive
        ? 'bg-red-600 text-white shadow-sm'
        : 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300';
    }

    return isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white';
  };

  const getMobileTabClass = (item) => {
    const isActive = activeTab === item.id;

    if (item.admin) {
      return isActive
        ? 'bg-red-600 text-white shadow-sm'
        : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10';
    }

    return isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]';
  };

  return (
    <nav className="relative z-10 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B0F19]/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            disabled={isGenerating}
            className="block rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
            aria-label="Go to Clarion home dashboard"
          >
            <span className="block bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-xl font-black uppercase tracking-[0.18em] text-transparent sm:text-2xl">
              Clarion
            </span>
          </button>
          <p className="mt-0.5 hidden max-w-[220px] truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
            {firstName ? `Welcome back, ${firstName}` : fallbackEmail}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-black/20 lg:flex">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isGenerating}
                  title={isGenerating ? 'Please wait for the active search to finish' : undefined}
                  onClick={() => handleTabChange(item.id)}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950 xl:px-4 xl:text-sm ${getDesktopTabClass(item)}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onLogout}
            className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-slate-500 transition duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 dark:focus-visible:ring-offset-slate-950 lg:inline-flex"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline">Disconnect</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white dark:focus-visible:ring-offset-slate-950 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1000] cursor-default bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />

          <aside className="fixed inset-y-0 left-0 z-[1001] flex h-dvh w-[84vw] max-w-[340px] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B0F19] lg:hidden">
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-white/10">
              <div className="min-w-0">
                <span className="block bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-xl font-black uppercase tracking-[0.18em] text-transparent">
                  Clarion
                </span>
                <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {firstName ? `Welcome back, ${firstName}` : fallbackEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="px-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Navigation
              </p>
              <div className="mt-3 space-y-1.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${getMobileTabClass(item)}`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-white/10">
              <button
                type="button"
                disabled={isGenerating}
                onClick={onLogout}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-extrabold text-slate-600 transition duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
                Disconnect
              </button>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}