import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  Link as LinkIcon,
  Loader2,
  Mail,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const LIMITS = {
  user: { standard: 50, ai: 10 },
  free: { standard: 50, ai: 10 },
  pro: { standard: 500, ai: 100 },
  admin: { standard: 9999, ai: 9999 },
};

const getResetDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 72 * 60 * 60 * 1000);
};

function CreditCard({ icon: Icon, title, value, limit, tone = 'indigo' }) {
  const safeValue = Math.max(Number(value) || 0, 0);
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const percentage = Math.min((safeValue / safeLimit) * 100, 100);
  const palette = tone === 'teal'
    ? { icon: 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300', bar: 'bg-teal-600 dark:bg-teal-300' }
    : { icon: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300', bar: 'bg-indigo-600 dark:bg-indigo-300' };

  return (
    <article className="clarion-surface rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">{Math.round(percentage)}% left</span>
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">{safeValue.toLocaleString()}</span>
        <span className="pb-1 text-xs font-bold text-slate-500 dark:text-slate-400">of {safeLimit.toLocaleString()}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${percentage}%` }} />
      </div>
    </article>
  );
}

export default function SettingsDashboard({ user, profile, setProfile, loading }) {
  const [sadapayLink, setSadapayLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) setSadapayLink(profile.default_sadapay || '');
  }, [profile]);

  const role = String(profile?.role || 'user').toLowerCase();
  const limits = LIMITS[role] || LIMITS.user;
  const planName = role === 'admin' ? 'Admin' : role === 'pro' ? 'Pro' : 'Free';
  const isFree = role === 'user' || role === 'free';
  const resetDate = useMemo(() => getResetDate(profile?.last_reset_date), [profile?.last_reset_date]);
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL?.trim();
  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Clarion user';

  const formattedReset = resetDate
    ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(resetDate)
    : 'Schedule unavailable';

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/user/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, sadapay_link: sadapayLink.trim() }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Preferences saved.');
        setProfile((current) => ({ ...current, default_sadapay: sadapayLink.trim() }));
      } else {
        toast.error(result.message || 'Preferences could not be saved.');
      }
    } catch {
      toast.error('A network error prevented the settings update.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="clarion-surface flex min-h-[520px] flex-col items-center justify-center rounded-[1.75rem] text-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
        <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">Loading account settings</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Syncing your plan and saved preferences.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Account control</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl">Settings and plan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Review your account status and set the payment link Clarion should include in future AI pitches.</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${role === 'admin' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/15 dark:bg-red-400/[0.08] dark:text-red-300' : role === 'pro' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/15 dark:bg-amber-300/[0.08] dark:text-amber-300' : 'border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300'}`}>
          {role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : role === 'pro' ? <Crown className="h-3.5 w-3.5" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
          {planName} plan
        </span>
      </header>

      <section className="clarion-surface-strong relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white shadow-xl shadow-indigo-600/20">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{fullName}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" aria-hidden="true" />{profile?.email || user?.email}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" aria-hidden="true" />Refills {formattedReset}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-black text-teal-800 dark:border-teal-300/15 dark:bg-teal-300/[0.07] dark:text-teal-200">
            Account active
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <CreditCard icon={Search} title="Standard searches" value={profile?.standard_credits} limit={limits.standard} />
        <CreditCard icon={Zap} title="AI pitches" value={profile?.ai_credits} limit={limits.ai} tone="teal" />
        <article className="clarion-surface rounded-[1.5rem] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Next refill</p>
          <p className="mt-2 text-lg font-black leading-6 text-slate-950 dark:text-white">{formattedReset}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Both credit balances refresh automatically on the same 72-hour cycle.</p>
        </article>
      </div>

      <div className={`grid gap-6 ${isFree ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
        <section className="clarion-surface-strong rounded-[1.75rem] p-5 sm:p-7" aria-labelledby="preferences-heading">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Outreach defaults</p>
              <h2 id="preferences-heading" className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Payment link preference</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">This value pre-fills the generator and can be changed for individual searches.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="mt-7 max-w-2xl">
            <label htmlFor="default-payment-link" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Default payment link</label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="default-payment-link"
                type="url"
                value={sadapayLink}
                onChange={(event) => setSadapayLink(event.target.value)}
                placeholder="https://sadapay.pk/..."
                className="clarion-input h-12 pl-11 pr-4 text-sm font-semibold"
              />
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs leading-5 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
              <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300" aria-hidden="true" />
              Clarion stores this preference in your profile. It is only inserted into outreach when you use AI pitches.
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="clarion-button-primary clarion-focus mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Save preference
            </button>
          </form>
        </section>

        {isFree && (
          <aside className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/70 bg-amber-50/90 p-6 shadow-[0_28px_70px_-48px_rgba(146,64,14,0.7)] backdrop-blur-xl dark:border-amber-300/15 dark:bg-amber-300/[0.07]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20"><Crown className="h-5 w-5" aria-hidden="true" /></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Pro capacity</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Scale your lead workflow</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">Upgrade to 500 searches and 100 AI pitches every 72 hours.</p>
              <div className="mt-5 space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />10× lead generation capacity</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />100 personalized pitches</p>
              </div>
              {upgradeUrl ? (
                <a href={upgradeUrl} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600">
                  View upgrade options <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <button type="button" disabled className="mt-6 min-h-11 w-full cursor-not-allowed rounded-xl bg-amber-500/60 px-5 text-sm font-black text-white opacity-80">Upgrade link not configured</button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
