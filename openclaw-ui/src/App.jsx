// App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Toaster } from 'react-hot-toast';

// --- Organized Component Imports ---
import AuthScreen from './components/auth/AuthScreen';
import HistoryDashboard from './components/vault/HistoryDashboard';
import LeadForm from './components/generator/LeadForm';
import ResultsTable from './components/generator/ResultsTable';
import Navbar from './components/layout/Navbar';

export default function App() {
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('generator'); // Navigation state

  // Theme state (default to dark look)
  const [isDark, setIsDark] = useState(true);

  // Generator specific state (lifted up so Form and Table can share it)
  const [leads, setLeads] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Theme Initialization ---
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored ? stored === 'dark' : true; // default dark look
    setIsDark(initialDark ?? prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // --- Authentication Listeners ---
  useEffect(() => {
    // 1. Check current session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    // 2. Listen for any login/logout events in the background
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Actions ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- UI Renders ---

  // 1. Loading State (Checking Database)
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center text-purple-500 font-bold tracking-widest uppercase">
        Initializing Command Center...
      </div>
    );
  }

  // 2. The Bouncer (Not Logged In)
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

  // 3. The Main Application (Logged In)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-200 font-sans selection:bg-purple-500/30">
      {/* Global Notifications Controller */}
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

      {/* Global Header / Navbar */}
      <header className="sticky top-0 z-50">
        <Navbar
          isDark={isDark}
          toggleTheme={toggleTheme}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          user={session?.user}
        />
      </header>

      {/* Main Content Router */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generator' ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <LeadForm setLeads={setLeads} setIsGenerating={setIsGenerating} isGenerating={isGenerating} />
            </div>
            <div className="w-full md:w-2/3">
              <ResultsTable leads={leads} isGenerating={isGenerating} />
            </div>
          </div>
        ) : (
          <HistoryDashboard />
        )}
      </main>
    </div>
  );
}