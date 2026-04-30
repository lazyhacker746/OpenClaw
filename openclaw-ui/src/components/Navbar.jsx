import React from 'react';
import { Sun, Moon } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="relative z-10 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/40 backdrop-blur-md px-8 py-4 flex justify-between items-center transition-colors duration-300">
      <div className="flex items-center space-x-3">
        <Logo />
        <div>
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 uppercase">
            OpenClaw
          </h1>
          <p className="text-xs text-purple-600 dark:text-purple-400/80 font-mono tracking-widest font-semibold">v2.0 // AUTONOMOUS_AGENT</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
          {isDark ? <Sun className="w-5 h-5 hover:text-yellow-400 transition-colors" /> : <Moon className="w-5 h-5 hover:text-purple-600 transition-colors" />}
        </button>

        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">SYSTEM READY</span>
        </div>
      </div>
    </nav>
  );
}