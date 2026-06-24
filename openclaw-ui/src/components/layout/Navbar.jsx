import React, { useEffect, useState } from 'react';
import { Sun, Moon, Search, Users, Menu, X, LogOut } from 'lucide-react';

export default function Navbar({ isDark, toggleTheme, activeTab, setActiveTab, onLogout, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Prioritize the full name, split it to get the first name, fallback to email
  const fullName = user?.user_metadata?.full_name;
  const firstName = fullName ? fullName.split(' ')[0] : null;
  const fallbackEmail = user?.email || 'Signed in';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="relative z-10 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">

        {/* DESKTOP LOGO & GREETING */}
        <div className="flex items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 uppercase mb-1">
              Clarion
            </h1>
            {firstName ? (
              <span className="hidden sm:inline-flex text-xs text-purple-400 font-medium bg-purple-900/30 px-2 py-0.5 rounded items-center gap-1 shadow-sm border border-purple-500/20">
                👋 Welcome back, {firstName}
              </span>
            ) : (
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                {fallbackEmail}
              </p>
            )}
          </div>
        </div>

        {/* DESKTOP TABS & ICONS */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 hover:text-yellow-400" /> : <Moon className="w-5 h-5 hover:text-purple-600" />}
          </button>

          <div className="hidden md:flex items-center space-x-1 bg-white/80 dark:bg-black/40 p-1 rounded-lg border border-gray-300 dark:border-gray-800 shadow-sm">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${
                activeTab === 'generator'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${
                activeTab === 'vault'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lead Vault</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="hidden md:flex items-center space-x-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU MODAL */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[1000] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div className="fixed inset-y-0 left-0 h-screen w-[80vw] max-w-[320px] bg-[#0B0F19] z-[1001] md:hidden shadow-2xl border-r border-white/10 flex flex-col justify-between">
            <div>
              <div className="p-5 flex items-center justify-between border-b border-white/10">
                <div>
                  <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 uppercase block mb-1">
                    Clarion
                  </span>

                  {/* MOBILE LOGO & GREETING */}
                  <div>
                    {firstName ? (
                      <span className="text-xs text-purple-400 font-medium bg-purple-900/30 px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-sm border border-purple-500/20">
                        👋 Welcome, {firstName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{fallbackEmail}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="rounded-2xl bg-[#111827] border border-white/10 shadow-lg p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">
                    Navigation
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleTabChange('generator')}
                      className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeTab === 'generator'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span>Generator</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('vault')}
                      className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                        activeTab === 'vault'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Lead Vault</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="rounded-2xl bg-[#111827] border border-white/10 shadow-lg p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">
                  Account
                </p>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg font-bold text-sm text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}