import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  LayoutGrid,
  Lock,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ToolsPage({ user, profile, setActiveTab }) {
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'there';
  const standardCredits = Number(profile?.standard_credits ?? 0);
  const aiCredits = Number(profile?.ai_credits ?? 0);

  return (
    <div className="space-y-6">
      <section className="clarion-surface-strong overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/[0.08] dark:text-indigo-300">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Tools
            </span>
            <h1 className="mt-6 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">
              Choose your tool, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Start with the website scraper to find local businesses, inspect their web presence, and save qualified leads to your Vault.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className="clarion-button-primary clarion-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Open scraper
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="sr-only">Available tools</h2>

        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className="clarion-surface-strong clarion-focus group flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:p-7 lg:col-span-2 lg:row-span-2"
        >
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Globe2 className="h-7 w-7" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Available
              </span>
            </div>

            <p className="mt-8 text-xs font-black uppercase text-indigo-600 dark:text-indigo-300">Website scraper</p>
            <h3 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Find, qualify, and save local leads.
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Search by city or map radius, filter by reviews, inspect websites, and generate pitch-ready lead records in one flow.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Map search', MapPinned],
                ['Website signals', ShieldCheck],
                ['AI pitches', Sparkles],
              ].map(([label, Icon]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/65 px-3 py-3 text-xs font-black text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300">
                  <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-indigo-700 dark:text-indigo-300">
            Launch scraper
            <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </button>

        <article className="clarion-surface rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400">Credits</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{standardCredits.toLocaleString()}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">standard searches available for the scraper.</p>
        </article>

        <article className="clarion-surface rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400">AI pitches</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{aiCredits.toLocaleString()}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">personalized messages ready this cycle.</p>
        </article>

        <article className="clarion-surface rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/[0.07] dark:text-slate-300">
            <Database className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400">Vault sync</p>
          <h3 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Auto-save</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">completed scraper runs are stored in your Lead Vault.</p>
        </article>

        <article className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/40 p-5 opacity-80 dark:border-white/15 dark:bg-white/[0.025] sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400">More tools</p>
          <h3 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Coming later</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">the website scraper is the only available tool right now.</p>
        </article>

        <article className="clarion-surface rounded-[1.5rem] p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Run time</p>
              <h3 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Searches run in the background</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">navigation locks while an active scraper job is processing.</p>
            </div>
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-300/[0.1] dark:text-amber-300">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
