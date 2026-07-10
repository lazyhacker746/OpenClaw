import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminGuard({ profile, setActiveTab, children }) {
  // 1. Await profile load to prevent false-positive rejections
  if (!profile) {
    return null;
  }

  // 2. The Strict Role Check
  if (profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-6 bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-widest uppercase">
            Access Denied
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">
            You do not have the required clearance level to view the Admin Command Center. This incident has been logged.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('generator')}
          className="mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Return to Generator</span>
        </button>
      </div>
    );
  }

  // 3. Clearance Granted: Render the enclosed component
  return <>{children}</>;
}