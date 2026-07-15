import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  Crown,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

const TIER_LIMITS = {
  user: { standard: 50, ai: 10 },
  free: { standard: 50, ai: 10 },
  pro: { standard: 500, ai: 100 },
  admin: { standard: 9999, ai: 9999 },
};

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const nextReset = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 72 * 60 * 60 * 1000);
};

const formatResetDate = (date) => {
  if (!date) return 'Awaiting account data';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatCountdown = (date, now) => {
  if (!date) return 'Reset schedule unavailable';
  const remaining = date.getTime() - now;
  if (remaining <= 0) return 'Refill ready';
  const minutes = Math.ceil(remaining / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
};

function UsageCard({ icon: Icon, title, value, limit, description, tone = 'indigo' }) {
  const current = numberValue(value);
  const maximum = Math.max(numberValue(limit), 1);
  const percentage = Math.min(Math.round((current / maximum) * 100), 100);
  const used = Math.max(maximum - current, 0);
  const styles = tone === 'teal'
    ? {
        icon: 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300',
        bar: 'bg-teal-600 dark:bg-teal-300',
        number: 'text-teal-700 dark:text-teal-300',
      }
    : {
        icon: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300',
        bar: 'bg-indigo-600 dark:bg-indigo-300',
        number: 'text-indigo-700 dark:text-indigo-300',
      };

  return (
    <article className="clarion-surface rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black tracking-[-0.05em] ${styles.number}`}>{current.toLocaleString()}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">of {maximum.toLocaleString()} left</p>
        </div>
      </div>
      <h3 className="mt-5 text-base font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.08]" role="progressbar" aria-valuemin="0" aria-valuemax={maximum} aria-valuenow={current} aria-label={`${title}: ${current} remaining`}>
        <div className={`h-full rounded-full transition-[width] duration-300 ${styles.bar}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <span>{percentage}% available</span>
        <span>{used.toLocaleString()} used</span>
      </div>
    </article>
  );
}

function RecentLead({ lead }) {
  const businessName = lead?.['Business Name'] || 'Unnamed business';
  const city = lead?.City || lead?.city || 'Location unavailable';
  const category = lead?.Category || lead?.category || 'Business';
  const reviews = numberValue(lead?.['Review Count']);
  const whatsappLink = lead?.['WhatsApp Link'];
  const validWhatsApp = typeof whatsappLink === 'string' && whatsappLink.startsWith('http');

  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/65 p-4 transition duration-200 hover:border-indigo-300 hover:bg-white hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-indigo-300/30 dark:hover:bg-white/[0.055] sm:flex-row sm:items-center">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">
        <Building2 className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">{businessName}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{city}</span>
          <span>{category}</span>
          <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5" aria-hidden="true" />{reviews} reviews</span>
        </div>
      </div>
      {validWhatsApp && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="clarion-button-secondary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300 dark:hover:bg-emerald-400/[0.13]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Contact
        </a>
      )}
    </article>
  );
}

export default function Dashboard({ user, profile, history, profileLoading, vaultLoading, setActiveTab }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const role = String(profile?.role || 'user').toLowerCase();
  const limits = TIER_LIMITS[role] || TIER_LIMITS.user;
  const isFree = role === 'user' || role === 'free';
  const planName = role === 'admin' ? 'Admin' : role === 'pro' ? 'Pro' : 'Free';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'there';
  const resetDate = useMemo(() => nextReset(profile?.last_reset_date), [profile?.last_reset_date]);
  const recentLeads = useMemo(() => (Array.isArray(history) ? history.slice(0, 3) : []), [history]);
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL?.trim();

  return (
    <div className="space-y-6">
      <section className="clarion-surface-strong relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-indigo-500/12 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-[90px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.17em] text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/[0.08] dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Workspace overview
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
                {role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                {planName} plan
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl">Good to see you, {firstName}.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Review your available capacity, keep an eye on the next refill, and continue from the latest opportunities saved to your Vault.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className="clarion-button-primary clarion-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Start a search
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className="clarion-button-secondary clarion-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-5 text-sm font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.09]"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Open Vault
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <section aria-labelledby="usage-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Current cycle</p>
                <h2 id="usage-heading" className="mt-1.5 text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Available capacity</h2>
              </div>
              <span className="hidden text-xs font-bold text-slate-500 dark:text-slate-400 sm:inline">Refills every 72 hours</span>
            </div>
            {profileLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((item) => <div key={item} className="h-56 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white/60 dark:border-white/[0.08] dark:bg-white/[0.035]" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <UsageCard icon={Search} title="Standard searches" value={profile?.standard_credits} limit={limits.standard} description="Lead records you can acquire during this plan cycle." />
                <UsageCard icon={Zap} title="AI pitches" value={profile?.ai_credits} limit={limits.ai} description="Personalized outreach messages available for generation." tone="teal" />
              </div>
            )}
          </section>

          <section className="clarion-surface rounded-[1.75rem] p-5 sm:p-6" aria-labelledby="recent-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Vault preview</p>
                <h2 id="recent-heading" className="mt-1.5 text-2xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Recent activity</h2>
              </div>
              <button type="button" onClick={() => setActiveTab('vault')} className="clarion-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-400/10">
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {vaultLoading ? (
              <div className="mt-5 grid gap-3">
                {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />)}
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="mt-5 space-y-3">{recentLeads.map((lead, index) => <RecentLead key={`${lead?.['WhatsApp Link'] || lead?.['Business Name'] || 'lead'}-${index}`} lead={lead} />)}</div>
            ) : (
              <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 text-center dark:border-white/15 dark:bg-white/[0.025]">
                <Building2 className="h-8 w-8 text-slate-400" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">Your Vault is ready</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">Run a search and your most recent saved opportunities will appear here.</p>
                <button type="button" onClick={() => setActiveTab('generator')} className="clarion-button-primary clarion-focus mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700">
                  <Search className="h-4 w-4" aria-hidden="true" /> Generate leads
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="clarion-surface rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:border-teal-400/15 dark:bg-teal-400/[0.08] dark:text-teal-300">Automatic</span>
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Next credit refill</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{formatResetDate(resetDate)}</h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              <Clock3 className="h-4 w-4" aria-hidden="true" /> {formatCountdown(resetDate, now)}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Your available searches and AI pitches refresh together at the end of the cycle.</p>
          </section>

          {isFree && (
            <section className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/75 bg-amber-50/88 p-6 shadow-[0_28px_70px_-48px_rgba(146,64,14,0.7)] backdrop-blur-xl dark:border-amber-300/15 dark:bg-amber-300/[0.07]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl" />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                  <Crown className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">More room to grow</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Upgrade to Pro</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">Move to 500 standard searches and 100 AI pitches every 72 hours.</p>
                <div className="mt-5 space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />10× standard search capacity</div>
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />100 AI-personalized pitches</div>
                </div>
                {upgradeUrl ? (
                  <a href={upgradeUrl} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600">
                    View upgrade options <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <button type="button" disabled className="mt-6 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-amber-500/60 px-5 text-sm font-black text-white opacity-80" title="Add VITE_UPGRADE_URL in Vercel">
                    Upgrade link not configured
                  </button>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
