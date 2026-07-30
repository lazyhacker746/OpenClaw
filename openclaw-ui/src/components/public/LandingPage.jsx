import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  Database,
  Globe2,
  MapPin,
  MessageSquareText,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react';

import Logo from '../layout/Logo';

const capabilities = [
  {
    icon: Search,
    title: 'Discover local opportunities',
    description:
      'Search businesses by market, category, review activity, and digital presence.',
  },
  {
    icon: Target,
    title: 'Qualify the right prospects',
    description:
      'Focus your team on businesses with clear website and outreach opportunities.',
  },
  {
    icon: Database,
    title: 'Build a reusable lead Vault',
    description:
      'Keep qualified businesses, contact routes, and generated pitches in one workspace.',
  },
  {
    icon: MessageSquareText,
    title: 'Prepare relevant outreach',
    description:
      'Turn business context into editable, WhatsApp-ready conversations.',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Define your market',
    description:
      'Choose a city, business category, lead target, and qualification criteria.',
  },
  {
    number: '02',
    title: 'Deploy the search agent',
    description:
      'Clarion evaluates local listings, reviews, contact routes, and website signals.',
  },
  {
    number: '03',
    title: 'Review qualified leads',
    description:
      'Approved opportunities are saved automatically to your private Lead Vault.',
  },
  {
    number: '04',
    title: 'Start the conversation',
    description:
      'Edit your pitch and open a ready-to-send WhatsApp conversation.',
  },
];

const freePlanFeatures = [
  '50 standard searches',
  '10 personalized AI pitches',
  'Automatic Lead Vault storage',
  'Credits refreshed every 72 hours',
];

const proPlanFeatures = [
  '500 standard searches',
  '100 personalized AI pitches',
  'Higher prospecting capacity',
  'Built for growing agency workflows',
];

const sampleLeads = [
  {
    name: 'Atlas Fitness Studio',
    market: 'Lahore',
    reviews: '48 reviews',
  },
  {
    name: 'Northside Dental Care',
    market: 'Islamabad',
    reviews: '61 reviews',
  },
  {
    name: 'The Courtyard Kitchen',
    market: 'Karachi',
    reviews: '43 reviews',
  },
];

export default function LandingPage({
  isDark,
  onSignIn,
  onStart,
  toggleTheme,
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50 text-slate-950 dark:bg-[#060914] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-18rem] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-500/15" />
        <div className="absolute right-[-16rem] top-[20rem] h-[36rem] w-[36rem] rounded-full bg-cyan-400/10 blur-[140px] dark:bg-cyan-400/10" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#060914]/90 dark:shadow-black/20">
        <nav
          className="mx-auto flex min-h-16 w-full max-w-[1180px] items-center justify-between gap-2 px-3 sm:min-h-20 sm:gap-6 sm:px-8"
          aria-label="Public navigation"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="clarion-focus flex items-center gap-3 rounded-xl"
            aria-label="Clarion home"
          >
            <Logo className="h-9 w-9 shrink-0 shadow-lg shadow-indigo-600/20 sm:h-11 sm:w-11" />

            <span className="text-left">
              <span className="block text-lg font-black tracking-[-0.04em]">
                Clarion
              </span>
              <span className="hidden text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:block">
                Lead intelligence workspace
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 dark:text-slate-300 md:flex">
            <a
              href="#features"
              className="clarion-focus rounded-lg transition hover:text-indigo-600 dark:hover:text-white"
            >
              Features
            </a>

            <a
              href="#workflow"
              className="clarion-focus rounded-lg transition hover:text-indigo-600 dark:hover:text-white"
            >
              Workflow
            </a>

            <a
              href="#plans"
              className="clarion-focus rounded-lg transition hover:text-indigo-600 dark:hover:text-white"
            >
              Plans
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="clarion-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]"
              aria-label={isDark ? 'Use light appearance' : 'Use dark appearance'}
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onSignIn}
              className="clarion-focus inline-flex min-h-9 items-center rounded-xl px-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.07] sm:min-h-10 sm:px-4 sm:text-sm"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={onStart}
              className="clarion-button-primary clarion-focus inline-flex min-h-9 items-center gap-1 rounded-xl bg-indigo-600 px-2.5 text-xs sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-[1180px] items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:pb-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-300/15 dark:bg-indigo-300/[0.07] dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Built for focused prospecting
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.06em] sm:text-6xl lg:text-[4.5rem]">
              Find businesses worth contacting.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Clarion helps agencies and growth teams move from local market
              discovery to qualified leads and relevant outreach in one
              organized workflow.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onStart}
                className="clarion-button-primary clarion-focus inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-black text-white shadow-xl shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Create your free workspace
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <a
                href="#workflow"
                className="clarion-focus inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.09]"
              >
                See how it works
                <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ['Local', 'Market targeting'],
                ['Qualified', 'Lead intelligence'],
                ['Ready', 'Editable outreach'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]"
                >
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-10 rounded-full bg-indigo-500/20 blur-[100px]" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-3 shadow-[0_36px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/[0.1] dark:bg-[#11152a]/90 dark:shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-extrabold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                  Clarion prospecting workspace
                </div>
              </div>

              <div className="grid gap-3 p-3 md:grid-cols-[0.82fr_1.18fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-[#171a33]">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                    Search brief
                  </p>

                  <h2 className="mt-2 text-lg font-black">
                    Configure your target
                  </h2>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Market
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm font-extrabold">
                        <MapPin
                          className="h-4 w-4 text-indigo-500"
                          aria-hidden="true"
                        />
                        Lahore
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Business type
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm font-extrabold">
                        <Building2
                          className="h-4 w-4 text-indigo-500"
                          aria-hidden="true"
                        />
                        Local services
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-300/15 dark:bg-indigo-300/[0.07]">
                      <div className="flex items-center gap-2">
                        <Check
                          className="h-4 w-4 text-indigo-600 dark:text-indigo-300"
                          aria-hidden="true"
                        />

                        <p className="text-xs font-black text-indigo-700 dark:text-indigo-200">
                          Missing website opportunity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-[#171a33]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-white/[0.08]">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
                        Agent output
                      </p>
                      <h2 className="mt-1 text-base font-black">
                        Qualified leads
                      </h2>
                    </div>

                    <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-[10px] font-black dark:bg-white/[0.07]">
                      3 records
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-white/[0.07]">
                    {sampleLeads.map((lead) => (
                      <div
                        key={lead.name}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {lead.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>{lead.market}</span>
                            <span>{lead.reviews}</span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-300/15 dark:bg-cyan-300/[0.07] dark:text-cyan-200">
                          No website
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="m-3 rounded-xl bg-indigo-600 px-4 py-3 text-center text-xs font-black text-white shadow-lg shadow-indigo-600/20">
                    Save qualified leads to Vault
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-slate-200/70 bg-white/65 py-24 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.025]"
        >
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                One focused workspace
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                From discovery to outreach without scattered tools.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
                Clarion keeps the important prospecting steps connected, so
                every lead has context and a clear next action.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.035]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-300/[0.08] dark:text-indigo-300">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto w-full max-w-[1180px] px-5 py-24 sm:px-8"
        >
          <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                A repeatable process
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Prospect with a clear workflow.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
                Each search follows the same structured path, making it easier
                to repeat, review, and scale your outreach.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800 dark:border-emerald-300/15 dark:bg-emerald-300/[0.07] dark:text-emerald-200">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                Results are saved to your Vault automatically
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {workflow.map((step) => (
                <article
                  key={step.number}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]"
                >
                  <span className="text-xs font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                    STEP {step.number}
                  </span>

                  <h3 className="mt-4 text-xl font-black">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="plans"
          className="border-y border-slate-200/70 bg-white/65 py-24 dark:border-white/[0.07] dark:bg-white/[0.025]"
        >
          <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Start small and scale
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                A plan for every stage of prospecting.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                  FREE PLAN
                </p>

                <h3 className="mt-3 text-3xl font-black">Explore Clarion</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Create an account and validate the workflow with real local
                  business searches.
                </p>

                <div className="mt-7 space-y-3">
                  {freePlanFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm font-bold"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-300/[0.08] dark:text-emerald-300">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onStart}
                  className="clarion-focus mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </article>

              <article className="relative overflow-hidden rounded-[1.75rem] border border-indigo-300/30 bg-[#11162c] p-7 text-white shadow-2xl shadow-indigo-950/20">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/25 blur-[80px]" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-amber-300">
                      PRO CAPACITY
                    </p>

                    <BarChart3
                      className="h-6 w-6 text-amber-300"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-3 text-3xl font-black">
                    Scale your workflow
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Increase your search and outreach capacity as your lead
                    generation operation grows.
                  </p>

                  <div className="mt-7 space-y-3">
                    {proPlanFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 text-sm font-bold"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300/10 text-amber-300">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onStart}
                    className="clarion-focus mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                  >
                    Create your workspace
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 py-24 sm:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl shadow-slate-950/20 sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-[100px]" />

            <div className="relative mx-auto max-w-3xl">
              <Globe2
                className="mx-auto h-8 w-8 text-cyan-300"
                aria-hidden="true"
              />

              <h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Turn local markets into clear opportunities.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Build your first qualified lead list, save it to your Vault,
                and prepare outreach from one focused workspace.
              </p>

              <button
                type="button"
                onClick={onStart}
                className="clarion-focus mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Start prospecting
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/70 bg-white/70 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />

            <div>
              <p className="text-sm font-black">Clarion</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Lead intelligence workspace
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Clarion Labs. Built for clearer
            prospecting.
          </p>
        </div>
      </footer>
    </div>
  );
}
