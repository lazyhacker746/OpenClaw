import React from 'react';
import { Sun, Moon, Search, Database } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ isDark, toggleTheme, activeTab, setActiveTab }) {
  return (
    <nav className="relative z-10 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/40 backdrop-blur-md px-4 sm:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300">

      {/* Top Row on Mobile: Logo & Brand */}
      <div className="flex items-center justify-between w-full md:w-auto md:border-r border-gray-300 dark:border-gray-800 md:pr-8">
        <div className="flex items-center space-x-3">
          <Logo />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 uppercase">
              OpenClaw
            </h1>
            <p className="hidden sm:block text-xs text-purple-600 dark:text-purple-400/80 font-mono tracking-widest font-bold">v2.0 // AUTONOMOUS_AGENT</p>
          </div>
        </div>

        {/* Move Theme Toggle next to logo on mobile only */}
        <button onClick={toggleTheme} className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
          {isDark ? <Sun className="w-5 h-5 hover:text-yellow-400" /> : <Moon className="w-5 h-5 hover:text-purple-600" />}
        </button>
      </div>

      {/* Middle Row on Mobile: Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 w-full md:w-auto justify-center">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex-1 md:flex-none flex justify-center items-center space-x-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'generator' ? 'bg-white dark:bg-black text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          <Search className="w-4 h-4" />
          <span>Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 md:flex-none flex justify-center items-center space-x-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white dark:bg-black text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          <Database className="w-4 h-4" />
          <span>Database</span>
        </button>
      </div>

      {/* Bottom Row on Mobile: Status & Desktop Theme Toggle */}
      <div className="hidden md:flex items-center space-x-6">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
          {isDark ? <Sun className="w-5 h-5 hover:text-yellow-400" /> : <Moon className="w-5 h-5 hover:text-purple-600" />}
        </button>
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">SYSTEM READY</span>
        </div>
      </div>

    </nav>
  );
}