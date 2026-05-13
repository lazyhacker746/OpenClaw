import React, { useState } from 'react';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import Logo from './Logo';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // The master password for your team
    if (pin === '7860') {
      onLogin();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0f] px-4 selection:bg-purple-500/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <Logo/>
          <h1 className="mt-4 text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 uppercase">
            OpenClaw
          </h1>
          <p className="text-xs text-purple-600 dark:text-purple-400/80 font-mono tracking-widest font-bold mt-1">RESTRICTED_ACCESS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider text-center">
              Enter Agent Pin
            </label>
            <div className="relative flex items-center justify-center">
              <Lock className="absolute left-4 w-5 h-5 text-gray-400"/>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className={`w-full bg-gray-50 dark:bg-black/50 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-800'} rounded-lg py-3 px-12 text-center text-2xl tracking-[0.5em] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
                placeholder="••••"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center mt-2 animate-pulse">ACCESS DENIED. INVALID PIN.</p>}
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-lg transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-purple-500/30">
            <span>Authenticate</span>
            <ArrowRight className="w-5 h-5 ml-2"/>
          </button>
        </form>
      </div>
    </div>
  );
}