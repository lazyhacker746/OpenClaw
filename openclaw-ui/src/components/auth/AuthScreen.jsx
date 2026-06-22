import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthScreen() {
  // --- Form State ---
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Auth Handler ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Clean the email string to prevent Supabase validation errors from accidental spaces
    const cleanEmail = email.trim();

    try {
      if (isLogin) {
        // Attempt Login via Supabase
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast.success('Welcome back to Clarion!');
      } else {
        // Attempt Registration via Supabase
        // Notice we are extracting 'data' here now to check the session status
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;

        // 🛡️ THE VERIFICATION CHECK
        // If Supabase creates a user but returns no session, it means an email was sent.
        if (data?.user && !data?.session) {
          // Increase duration so they have time to read it
          toast.success("Verification link sent! Please check your email (and spam folder) to activate your account.", { duration: 6000 });
          setIsLogin(true);
          setPassword(''); // Clear password for security
        } else {
          // Fallback just in case you ever turn email confirmation off in Supabase
          toast.success("Account created successfully!");
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 text-gray-200 w-full">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8">
        
        {/* LOGO & HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-600/20 rounded-xl mb-4">
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Clarion</h1>
          <p className="text-sm font-mono text-gray-400 mt-1">Lead Generation Platform</p>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {/* AUTH FORM */}
        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                placeholder="you@company.com" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                placeholder="••••••••" />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isLogin ? 'Sign In' : 'Create Account'}</span>}
          </button>
        </form>

        {/* TOGGLE LOGIN/SIGNUP MODE */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline">
            {isLogin ? 'Sign up here' : 'Log in here'}
          </button>
        </div>
        
      </div>
    </div>
  );
}