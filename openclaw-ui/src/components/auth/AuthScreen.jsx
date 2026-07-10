import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Zap, Mail, Lock, Loader2, ShieldCheck, ArrowLeft, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthScreen() {
  // --- Form State ---
  const [isLogin, setIsLogin] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  
  // --- Input State ---
  const [fullName, setFullName] = useState(''); // 👈 New Full Name state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 👈 300 seconds = 5 minutes

  // --- OTP Countdown Timer Logic ---
  useEffect(() => {
    let timer;
    if (showOtp && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer); // Cleanup on unmount
  }, [showOtp, timeLeft]);

  // Format time to MM:SS
  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  // --- 1. Main Auth Handler ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim(); 

    // 🚨 STRICT DOMAIN LOCK: Only allow @gmail.com during Registration
    if (!isLogin && !cleanEmail.toLowerCase().endsWith('@gmail.com')) {
      toast.error("Registration is currently restricted to @gmail.com accounts only.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        // REGISTRATION (Now passing the Full Name to the database)
        const { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password,
          options: {
            data: {
              full_name: fullName // 👈 Supabase automatically saves this in user_metadata
            }
          }
        });
        if (error) throw error;
        
        if (data?.user && !data?.session) {
          toast.success("Verification code sent to your inbox!");
          setShowOtp(true);
          setTimeLeft(300); // Reset timer to 5 minutes
        } else {
          toast.success("Account created successfully!");
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. OTP Verification Handler ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (timeLeft === 0) {
      toast.error("This code has expired. Please register again to get a new code.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'signup'
      });

      if (error) throw error;
      toast.success("Email verified! Access granted.");
    } catch (error) {
      toast.error("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 text-gray-200 w-full">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8">
        
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-600/20 rounded-xl mb-4">
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Clarion</h1>
          <p className="text-sm font-mono text-gray-400 mt-1">Lead Generation Platform</p>
        </div>

        {/* --- CONDITIONALLY RENDER OTP OR AUTH FORM --- */}
        {showOtp ? (
          
          /* OTP VERIFICATION UI */
          <div className="animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Verify Email</h2>
            
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-300 mb-1">Code sent securely to:</p>
              <p className="text-purple-400 font-mono font-bold">{email}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400">8-Digit Code</label>
                  <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-gray-400'}`}>
                    Expires in: {formattedTime}
                  </span>
                </div>
                
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" required maxLength="8" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                    disabled={timeLeft === 0}
                    className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-3 pl-10 pr-4 text-white text-center tracking-[0.5em] font-bold text-xl outline-none transition-colors disabled:opacity-50"
                    placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading || timeLeft === 0 || otp.length < 8} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Registration</span>}
              </button>
            </form>

            <button onClick={() => {setShowOtp(false); setTimeLeft(300);}} className="w-full mt-4 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to Login
            </button>
          </div>

        ) : (

          /* STANDARD LOGIN/REGISTER UI */
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-5">
              
              {/* 👈 NEW FULL NAME FIELD (Only shows during Sign Up) */}
              {!isLogin && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                      placeholder="John Doe" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                    placeholder="you@company.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                    placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isLogin ? 'Sign In' : 'Register Now'}</span>}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline">
                {isLogin ? 'Sign up here' : 'Log in here'}
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
