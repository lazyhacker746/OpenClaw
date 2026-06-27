import React, { useState, useEffect } from 'react';
import { User, CreditCard, Zap, Calendar, Link as LinkIcon, Save, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [sadapayLink, setSadapayLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/user/profile?user_id=${user.id}`);
        const result = await response.json();

        if (result.status === 'success') {
          setProfile(result.data);
          setSadapayLink(result.data.default_sadapay || '');
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/user/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          sadapay_link: sadapayLink
        })
      });
      const result = await response.json();
      if (result.status === 'success') toast.success('Settings saved successfully!');
      else toast.error('Failed to save settings.');
    } catch (error) {
      toast.error('Network error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[500px]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="font-bold tracking-widest uppercase">Loading Profile...</p>
      </div>
    );
  }

  // Format the reset date
  const resetDate = new Date(profile?.last_reset_date);
  resetDate.setDate(resetDate.getDate() + 3); // Add 3 days
  const formattedDate = resetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{user?.user_metadata?.full_name || 'Clarion User'}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
          </div>

          <div className="ml-auto">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm
              ${profile?.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                profile?.role === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
              {profile?.role === 'admin' && <Shield className="w-3 h-3" />}
              {profile?.role || 'User'} Plan
            </span>
          </div>
        </div>
      </div>

      {/* CREDITS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-purple-600 dark:text-purple-400">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-bold tracking-wide uppercase text-sm">Standard Searches</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{profile?.standard_credits}</div>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold tracking-wide uppercase text-sm">AI Pitches</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{profile?.ai_credits}</div>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-green-600 dark:text-green-400">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold tracking-wide uppercase text-sm">Next Refill</h3>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formattedDate}</div>
        </div>
      </div>

      {/* PREFERENCES FORM */}
      <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" /> Default Preferences
        </h3>
        <form onSubmit={handleSaveSettings} className="max-w-xl space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Default Payment Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={sadapayLink}
                onChange={(e) => setSadapayLink(e.target.value)}
                placeholder="https://sadapay.pk/..."
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-3 pl-10 pr-3 text-gray-900 dark:text-white text-sm outline-none transition-colors"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">This link will automatically be applied to all your AI pitches.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>Save Preferences</span>
          </button>
        </form>
      </div>

    </div>
  );
}