import { ArrowLeft, LockKeyhole, ShieldAlert } from 'lucide-react';

export default function AdminGuard({ profile, setActiveTab, children }) {
  if (!profile) return null;

  if (String(profile.role || '').toLowerCase() !== 'admin') {
    return (
      <section className="clarion-surface-strong mx-auto flex min-h-[560px] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-red-200 bg-red-50 text-red-600 shadow-lg shadow-red-500/10 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            <LockKeyhole className="h-9 w-9" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-300">Restricted workspace</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">Admin access required</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
          Your current account does not have permission to manage user roles, credit balances, or account records.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
          <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-300" aria-hidden="true" />
          No account data was exposed
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="clarion-button-primary clarion-focus mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return home
        </button>
      </section>
    );
  }

  return <>{children}</>;
}
