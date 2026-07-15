import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import 'leaflet/dist/leaflet.css';

import AuthScreen from './components/auth/AuthScreen';
import AdminGuard from './components/auth/AdminGuard';
import Dashboard from './components/dashboard/Dashboard';
import Navbar from './components/layout/Navbar';
import Logo from './components/layout/Logo';

const LeadForm = lazy(() => import('./components/generator/LeadForm'));
const ResultsTable = lazy(() => import('./components/generator/ResultsTable'));
const HistoryDashboard = lazy(() => import('./components/vault/HistoryDashboard'));
const SettingsDashboard = lazy(() => import('./components/settings/SettingsDashboard'));
const CommandCenter = lazy(() => import('./components/admin/CommandCenter'));

function ScreenLoader({ label = 'Preparing your workspace' }) {
  return (
    <div className="clarion-surface flex min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] px-6 text-center">
      <div className="clarion-pulse-ring flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
        <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-extrabold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loading only the tools needed for this view.</p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return storedTheme ? storedTheme === 'dark' : prefersDark;
  });
  const [leads, setLeads] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vaultHistory, setVaultHistory] = useState([]);
  const [isVaultLoaded, setIsVaultLoaded] = useState(false);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchVaultHistory = useCallback(
    async (forceRefresh = false) => {
      if (isVaultLoaded && !forceRefresh) return;
      if (!session?.user) return;

      setIsVaultLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/history?user_id=${session.user.id}`);
        const result = await response.json();

        if (result.status === 'success') {
          setVaultHistory(Array.isArray(result.data) ? result.data : []);
          setIsVaultLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsVaultLoading(false);
      }
    },
    [isVaultLoaded, session],
  );

  const fetchUserProfile = useCallback(
    async (forceRefresh = false) => {
      if (userProfile && !forceRefresh) return;
      if (!session?.user) return;

      setIsProfileLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/user/profile?user_id=${session.user.id}`);
        const result = await response.json();

        if (result.status === 'success') {
          setUserProfile(result.data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    },
    [session, userProfile],
  );

  useEffect(() => {
    if (session?.user) {
      fetchVaultHistory();
      fetchUserProfile();
    }
  }, [fetchUserProfile, fetchVaultHistory, session?.user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setVaultHistory([]);
      setIsVaultLoaded(false);
      setUserProfile(null);
      setLeads([]);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toasterOptions = {
    duration: 4200,
    style: {
      background: isDark ? '#111a2b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      border: isDark ? '1px solid rgba(148,163,184,.18)' : '1px solid #e2e8f0',
      borderRadius: '14px',
      boxShadow: isDark ? '0 24px 70px rgba(0,0,0,.35)' : '0 24px 70px rgba(15,23,42,.16)',
      fontSize: '14px',
      fontWeight: 700,
      padding: '12px 14px',
    },
  };

  if (loadingAuth) {
    return (
      <div className="clarion-app-shell flex min-h-dvh items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-14 w-14 shadow-xl shadow-indigo-600/20" />
          <LoaderCircle className="mt-6 h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">Opening Clarion</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Securing your workspace and syncing account data.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-center" toastOptions={toasterOptions} />
        <AuthScreen />
      </>
    );
  }

  return (
    <div className="clarion-app-shell min-h-dvh text-slate-900 dark:text-slate-100">
      <Toaster position="top-center" toastOptions={toasterOptions} />

      <header className="sticky top-0 z-[800]">
        <Navbar
          isDark={isDark}
          toggleTheme={() => setIsDark((current) => !current)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          user={session.user}
          profile={userProfile}
          isGenerating={isGenerating}
        />
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
        <div key={activeTab} className="clarion-enter">
          {activeTab === 'dashboard' && (
            <Dashboard
              user={session.user}
              profile={userProfile}
              history={vaultHistory}
              profileLoading={isProfileLoading}
              vaultLoading={isVaultLoading}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'generator' && (
            <Suspense fallback={<ScreenLoader label="Loading the lead generator" />}>
              <section className="space-y-6" aria-labelledby="generator-title">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Prospecting workspace</p>
                    <h1 id="generator-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Build a qualified lead list</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                      Define a market, deploy the search agent, and move from local discovery to a ready-to-send pitch in one workflow.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300 md:block">
                    Live results are saved to your Vault automatically
                  </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                  <LeadForm
                    setLeads={setLeads}
                    setIsGenerating={setIsGenerating}
                    isGenerating={isGenerating}
                    user={session.user}
                    profile={userProfile}
                    onScrapeComplete={() => {
                      fetchVaultHistory(true);
                      fetchUserProfile(true);
                    }}
                  />
                  <ResultsTable leads={leads} isGenerating={isGenerating} />
                </div>
              </section>
            </Suspense>
          )}

          {activeTab === 'vault' && (
            <Suspense fallback={<ScreenLoader label="Opening your Lead Vault" />}>
              <HistoryDashboard
                user={session.user}
                history={vaultHistory}
                setHistory={setVaultHistory}
                loading={isVaultLoading}
              />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <Suspense fallback={<ScreenLoader label="Loading account settings" />}>
              <SettingsDashboard
                user={session.user}
                profile={userProfile}
                setProfile={setUserProfile}
                loading={isProfileLoading}
              />
            </Suspense>
          )}

          {activeTab === 'admin' && (
            <AdminGuard profile={userProfile} setActiveTab={setActiveTab}>
              <Suspense fallback={<ScreenLoader label="Loading the Admin Command Center" />}>
                <CommandCenter user={session.user} />
              </Suspense>
            </AdminGuard>
          )}
        </div>
      </main>
    </div>
  );
}
