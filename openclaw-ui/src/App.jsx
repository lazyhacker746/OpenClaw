import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// --- Organized Component Imports ---
import AuthScreen from './components/auth/AuthScreen';
import HistoryDashboard from './components/vault/HistoryDashboard';
import LeadForm from './components/generator/LeadForm';
import ResultsTable from './components/generator/ResultsTable';

export default function App() {
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('generator'); // Navigation state
  
  // Generator specific state (lifted up so Form and Table can share it)
  const [leads, setLeads] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-purple-500 font-bold tracking-widest uppercase">
        Initializing Command Center...
      </div>
    );
  }

  // 2. The Bouncer (Not Logged In)
  if (!session) {
    return (
      <>
        {/* We need the toaster here so login success/fail alerts show up */}
        <Toaster position="top-center" toastOptions={{ style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' } }} />
        <AuthScreen />
      </>
    );
  }

  // 3. The Main Application (Logged In)
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200 font-sans selection:bg-purple-500/30">
      
      {/* Global Notifications Controller */}
      <Toaster position="top-center" toastOptions={{ style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' } }} />

      {/* Global Header / Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase">
              Clarion
            </span>
          </div>

          {/* Navigation & Logout */}
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-1 bg-black/40 p-1 rounded-lg border border-gray-800">
              <button 
                onClick={() => setActiveTab('generator')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Generator
              </button>
              <button 
                onClick={() => setActiveTab('vault')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'vault' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Lead Vault
              </button>
            </nav>

            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </div>
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