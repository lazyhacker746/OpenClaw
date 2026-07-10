import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// --- Organized Component Imports ---
import AuthScreen from './components/auth/AuthScreen';
import HistoryDashboard from './components/vault/HistoryDashboard';
import LeadForm from './components/generator/LeadForm';
import ResultsTable from './components/generator/ResultsTable';
import Navbar from './components/layout/Navbar';
import SettingsDashboard from './components/settings/SettingsDashboard';
import AdminGuard from './components/auth/AdminGuard';
import CommandCenter from './components/admin/CommandCenter';

export default function App() {
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('generator');

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Generator specific state
  const [leads, setLeads] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 👈 NEW: Global Vault State (Persists across tab changes)
  const [vaultHistory, setVaultHistory] = useState([]);
  const [isVaultLoaded, setIsVaultLoaded] = useState(false);
  const [isVaultLoading, setIsVaultLoading] = useState(false);

  // 👈 NEW: Global Profile State (Persists across tab changes)
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // --- Theme Initialization ---
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored ? stored === 'dark' : true;
    setIsDark(initialDark ?? prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // --- Authentication Listeners ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👈 NEW: Global Fetch Function for the Vault
  const fetchVaultHistory = useCallback(async (forceRefresh = false) => {
    // If it's already loaded and we aren't forcing a refresh, skip the network request!
    if (isVaultLoaded && !forceRefresh) return;
    if (!session?.user) return;

    setIsVaultLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/history?user_id=${session.user.id}`);
      const result = await response.json();

      if (result.status === 'success') {
        setVaultHistory(result.data);
        setIsVaultLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsVaultLoading(false);
    }
  }, [isVaultLoaded, session?.user]);

  // 👈 NEW: Global Fetch Function for the User Profile
  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    // If it's already loaded and we aren't forcing a refresh, skip the network request!
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
      console.error("Failed to load profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  }, [userProfile, session?.user]);

  // 👈 NEW: Fetch vault data once the user is authenticated
  useEffect(() => {
    if (session?.user) {
      fetchVaultHistory();
      fetchUserProfile();
    }
  }, [session?.user, fetchVaultHistory, fetchUserProfile]);

  // --- Actions ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      // Clean up cache on logout
      setVaultHistory([]);
      setIsVaultLoaded(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // --- UI Renders ---
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center text-purple-500 font-bold tracking-widest uppercase">
        Initializing Command Center...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: isDark ? '#1F2937' : '#FFFFFF',
              color: isDark ? '#fff' : '#111827',
              border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
            },
          }}
        />
        <AuthScreen />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-200 font-sans selection:bg-purple-500/30">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDark ? '#1F2937' : '#FFFFFF',
            color: isDark ? '#fff' : '#111827',
            border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
          },
        }}
      />

      <header className="sticky top-0 z-50">
        <Navbar
          isDark={isDark}
          toggleTheme={toggleTheme}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          user={session?.user}
          profile={userProfile}
          isGenerating={isGenerating}
        />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: GENERATOR */}
        {activeTab === 'generator' && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <LeadForm
                setLeads={setLeads}
                setIsGenerating={setIsGenerating}
                isGenerating={isGenerating}
                user={session.user}
                onScrapeComplete={() => fetchVaultHistory(true)}
              />
            </div>
            <div className="w-full md:w-2/3">
              <ResultsTable
                leads={leads}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        )}

        {/* TAB 2: VAULT */}
        {activeTab === 'vault' && (
          <HistoryDashboard
            user={session.user}
            history={vaultHistory}
            setHistory={setVaultHistory}
            loading={isVaultLoading}
          />
        )}

        {/* TAB 3: SETTINGS (NEW) */}
        {activeTab === 'settings' && (
          <SettingsDashboard
            user={session.user}
            profile={userProfile}          // 👈 Pass the cached data
            setProfile={setUserProfile}    // 👈 Let Settings update the cache on save
            loading={isProfileLoading}     // 👈 Pass the loading state
          />
        )}

        {/* TAB 4: ADMIN COMMAND CENTER (SECURED) */}
        {activeTab === 'admin' && (
          <AdminGuard profile={userProfile} setActiveTab={setActiveTab}>
             <CommandCenter user={session.user} />
          </AdminGuard>
        )}

      </main>
    </div>
  );
}