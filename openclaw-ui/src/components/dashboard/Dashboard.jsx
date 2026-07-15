import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  Crown,
  Home,
  Loader2,
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getCreditNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const getResetDate = (lastResetDate) => {
  if (!lastResetDate) return null;

  const resetStartedAt = new Date(lastResetDate);
  if (Number.isNaN(resetStartedAt.getTime())) return null;

  return new Date(resetStartedAt.getTime() + 72 * 60 * 60 * 1000);
};

const formatResetDate = (date) => {
  if (!date) return 'Reset date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatCountdown = (date, now) => {
  if (!date) return 'Waiting for profile data';

  const remaining = date.getTime() - now;
  if (remaining <= 0) return 'Refill ready';

  const totalMinutes = Math.ceil(remaining / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

function CreditGauge({ icon: Icon, label, value, limit, description, accentClass, iconBgClass, barClass }) {
  const safeValue = getCreditNumber(value);
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const percentage = clamp((safeValue / safeLimit) * 100, 0, 100);

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-slate-900/55">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}>
            <Icon className={`h-5 w-5 ${accentClass}`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{label}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{safeValue}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">of {safeLimit}</p>
        </div>
      </div>

      <div className="mt-5">
        <div
          role="progressbar"
          aria-label={`${label}: ${safeValue} of ${safeLimit} remaining`}
          aria-valuemin="0"
          aria-valuemax={safeLimit}
          aria-valuenow={safeValue}
          className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{Math.round(percentage)}% available</span>
          <span>{Math.max(safeLimit - safeValue, 0)} used</span>
        </div>
      </div>
    </article>
  );
}

function RecentLeadCard({ lead }) {
  const businessName = lead?.['Business Name'] || 'Unnamed business';
  const city = lead?.City || 'Unknown location';
  const category = lead?.Category || 'Business';
  const reviewCount = getCreditNumber(lead?.['Review Count']);
  const whatsappLink = lead?.['WhatsApp Link'];
  const hasWhatsApp = typeof whatsappLink === 'string' && whatsappLink.startsWith('http');

  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-lg transition duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-indigo-400/40 sm:flex-row sm:items-center">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
        <Building2 className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{businessName}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {city}
          </span>
          <span>{category}</span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            {reviewCount} reviews
          </span>
        </div>
      </div>

      {hasWhatsApp && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open WhatsApp for ${businessName}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15 dark:focus-visible:ring-offset-slate-950"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Contact
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

export default function Dashboard({
  user,
  profile,
  history,
  profileLoading,
  vaultLoading,
  setActiveTab,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const role = String(profile?.role || 'user').toLowerCase();
  const limits = TIER_LIMITS[role] || TIER_LIMITS.user;
  const isFreeUser = role === 'user' || role === 'free';
  const planName = role === 'admin' ? 'Admin' : role === 'pro' ? 'Pro' : 'Free';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'there';
  const resetDate = useMemo(() => getResetDate(profile?.last_reset_date), [profile?.last_reset_date]);
  const recentLeads = useMemo(() => (Array.isArray(history) ? history.slice(0, 3) : []), [history]);
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL?.trim();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Command overview
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                {planName} plan
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Track your search capacity, monitor your next refill, and jump back into your latest prospecting work.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-slate-950"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Start a search
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 text-sm font-extrabold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300 dark:focus-visible:ring-offset-slate-950"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Open Lead Vault
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.75fr)]">
        <div className="space-y-6">
          <section aria-labelledby="credit-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Usage</p>
                <h2 id="credit-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Credit capacity</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">72-hour cycle</span>
            </div>

            {profileLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <CreditGauge
                  icon={Search}
                  label="Standard Searches"
                  value={profile?.standard_credits}
                  limit={limits.standard}
                  description="Lead unlocks available in your current cycle."
                  accentClass="text-indigo-700 dark:text-indigo-300"
                  iconBgClass="bg-indigo-500/10 dark:bg-indigo-400/10"
                  barClass="bg-indigo-600 dark:bg-indigo-400"
                />
                <CreditGauge
                  icon={Zap}
                  label="AI Pitches"
                  value={profile?.ai_credits}
                  limit={limits.ai}
                  description="Personalized AI pitch generations remaining."
                  accentClass="text-sky-700 dark:text-sky-300"
                  iconBgClass="bg-sky-500/10 dark:bg-sky-400/10"
                  barClass="bg-sky-600 dark:bg-sky-400"
                />
              </div>
            )}
          </section>

          <section aria-labelledby="recent-heading" className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Vault preview</p>
                <h2 id="recent-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Recent activity</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-400/10"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {vaultLoading ? (
              <div className="flex min-h-44 items-center justify-center text-slate-500 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="text-sm font-semibold">Loading recent leads...</span>
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead, index) => (
                  <RecentLeadCard
                    key={`${lead?.['WhatsApp Link'] || lead?.['Business Name'] || 'lead'}-${index}`}
                    lead={lead}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
                <Building2 className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-extrabold text-slate-800 dark:text-slate-200">Your Vault is ready</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">Run your first search and saved leads will appear here automatically.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('generator')}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate leads
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                Auto refill
              </span>
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Next credit reset</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{formatResetDate(resetDate)}</h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-white/[0.07] dark:text-slate-200">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {formatCountdown(resetDate, now)}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Your plan allowance refreshes automatically 72 hours after the last reset.</p>
          </section>

          {isFreeUser && (
            <section className="relative overflow-hidden rounded-3xl border border-amber-300/70 bg-amber-50/85 p-6 shadow-[0_28px_70px_-42px_rgba(146,64,14,0.6)] backdrop-blur-xl dark:border-amber-300/20 dark:bg-amber-400/[0.08]">
              <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                  <Crown className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Scale your outreach</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Upgrade to Pro</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">Unlock 500 standard searches and 100 AI pitches every 72 hours.</p>

                <div className="mt-5 space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                    10× more search capacity
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                    100 AI-personalized pitches
                  </div>
                </div>

                {upgradeUrl ? (
                  <a
                    href={upgradeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                  >
                    Upgrade securely
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Add VITE_UPGRADE_URL in your Vercel environment variables"
                    className="mt-6 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-amber-500/60 px-5 text-sm font-black text-white opacity-80"
                  >
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