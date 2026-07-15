import { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Crosshair,
  Globe2,
  Link,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MapModal from './MapModal';

const FieldLabel = ({ htmlFor, children, hint }) => (
  <div className="mb-2 flex items-center justify-between gap-3">
    <label htmlFor={htmlFor} className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
      {children}
    </label>
    {hint && <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{hint}</span>}
  </div>
);

export default function LeadForm({ setLeads, setIsGenerating, isGenerating, user, profile, onScrapeComplete }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [targetLeads, setTargetLeads] = useState(5);
  const [minReviews, setMinReviews] = useState(10);
  const [mode, setMode] = useState('1');
  const [sadapayLink, setSadapayLink] = useState('');
  const [useAi, setUseAi] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapData, setMapData] = useState(null);
  const pollingIntervalRef = useRef(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  useEffect(() => {
    if (profile?.default_sadapay && !sadapayLink) {
      setSadapayLink(profile.default_sadapay);
    }
  }, [profile?.default_sadapay, sadapayLink]);

  useEffect(() => {
    const delay = window.setTimeout(async () => {
      if (city.trim().length > 2 && !mapData) {
        setIsSearchingCity(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=5`);
          const data = await response.json();
          setCitySuggestions(Array.isArray(data) ? data : []);
          setShowCitySuggestions(true);
        } catch (error) {
          console.error('Geocoding failed:', error);
        } finally {
          setIsSearchingCity(false);
        }
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 500);

    return () => window.clearTimeout(delay);
  }, [city, mapData]);

  useEffect(() => () => {
    if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
  }, []);

  const handleSelectCity = (cityName) => {
    setCity(cityName.split(',')[0]);
    setShowCitySuggestions(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!mapData && !city.trim()) {
      toast.error('Choose a city or select an area on the map.');
      return;
    }
    if (!category.trim()) {
      toast.error('Enter the type of business you want to target.');
      return;
    }

    setIsGenerating(true);
    setLeads([]);

    const locationDisplay = mapData ? mapData.resolvedCity : city.trim();
    const loadingToastId = toast.loading(`Deploying the search agent to ${locationDisplay}...`);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const finalLocationPayload = mapData
      ? `coords:${mapData.lat},${mapData.lng},${mapData.radius},${mapData.resolvedCity}`
      : city.trim();

    try {
      const startResponse = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: finalLocationPayload,
          category: category.trim(),
          target_leads: Number(targetLeads),
          min_reviews: Number(minReviews),
          mode,
          use_ai: useAi,
          sadapay_link: sadapayLink.trim() || 'none',
          user_id: user.id,
        }),
      });

      const startResult = await startResponse.json();

      if (startResult.status === 'processing' && startResult.task_id) {
        const taskId = startResult.task_id;
        pollingIntervalRef.current = window.setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/api/status/${taskId}`);
            const statusResult = await statusResponse.json();

            if (statusResult.progress) {
              toast.loading(statusResult.progress, { id: loadingToastId });
            }

            if (statusResult.status === 'success') {
              window.clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              setLeads(Array.isArray(statusResult.data) ? statusResult.data : []);
              toast.success(`Acquired ${statusResult.data.length} qualified targets.`, { id: loadingToastId });
              onScrapeComplete?.();
            } else if (statusResult.status === 'error') {
              window.clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              toast.error(statusResult.message?.[0] || 'The search engine encountered an error.', { id: loadingToastId });
            }
          } catch (pollError) {
            console.error('Polling error:', pollError);
            window.clearInterval(pollingIntervalRef.current);
            setIsGenerating(false);
            toast.error('Connection to the search engine was interrupted.', { id: loadingToastId });
          }
        }, 3000);
      } else {
        setIsGenerating(false);
        toast.error(startResult.message?.[0] || 'The search could not be started.', { id: loadingToastId });
      }
    } catch (error) {
      console.error('Generator error:', error);
      setIsGenerating(false);
      toast.error('Clarion could not connect to the backend service.', { id: loadingToastId });
    }
  };

  const standardCredits = Number(profile?.standard_credits ?? 0);
  const aiCredits = Number(profile?.ai_credits ?? 0);

  return (
    <aside className="clarion-surface-strong sticky top-[96px] overflow-visible rounded-[1.75rem] p-5 sm:p-6 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto xl:clarion-scrollbar">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-white/[0.08]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Search brief</p>
          <h2 className="mt-1.5 text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Configure your target</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Build a focused search before deploying the agent.</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
          <Target className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Search credits</p>
          <p className="mt-1 text-lg font-black text-indigo-700 dark:text-indigo-300">{standardCredits.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">AI pitches</p>
          <p className="mt-1 text-lg font-black text-teal-700 dark:text-teal-300">{aiCredits.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-7">
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">1</span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">Market location</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search broadly by city or precisely by map radius.</p>
            </div>
          </div>

          <FieldLabel htmlFor="city">City or area</FieldLabel>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <MapPin className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${mapData ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`} aria-hidden="true" />
              <input
                id="city"
                required={!mapData}
                type="text"
                value={mapData ? `${mapData.resolvedCity} · ${mapData.radius} km radius` : city}
                onChange={(event) => {
                  setCity(event.target.value);
                  if (mapData) setMapData(null);
                }}
                readOnly={Boolean(mapData)}
                placeholder="Lahore, Johar Town"
                className={`clarion-input h-12 pl-11 text-sm font-semibold ${mapData ? 'border-indigo-300 bg-indigo-50/70 pr-16 text-indigo-800 dark:border-indigo-300/25 dark:bg-indigo-400/[0.08] dark:text-indigo-200' : 'pr-11'}`}
                aria-autocomplete="list"
                aria-expanded={showCitySuggestions && citySuggestions.length > 0}
              />
              {!mapData && (
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isSearchingCity ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" /> : <Search className="h-[18px] w-[18px]" aria-hidden="true" />}
                </div>
              )}
              {mapData && (
                <button type="button" onClick={() => setMapData(null)} className="clarion-focus absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-400/10">
                  Clear
                </button>
              )}

              {showCitySuggestions && citySuggestions.length > 0 && !mapData && (
                <ul className="clarion-surface-strong clarion-scrollbar absolute left-0 top-full z-[200] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl p-1.5 shadow-2xl" role="listbox">
                  {citySuggestions.map((item, index) => (
                    <li key={`${item.place_id || index}`} role="option" aria-selected="false">
                      <button
                        type="button"
                        onClick={() => handleSelectCity(item.display_name)}
                        className="clarion-focus flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 dark:text-slate-300 dark:hover:bg-indigo-400/[0.08] dark:hover:text-indigo-200"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                        <span className="line-clamp-2 leading-5">{item.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="clarion-button-secondary clarion-focus inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-black text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200"
            >
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline xl:hidden 2xl:inline">Map</span>
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">2</span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">Qualification criteria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Define what makes a business worth contacting.</p>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="category">Business type</FieldLabel>
            <div className="relative">
              <BriefcaseBusiness className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input id="category" required type="text" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Gyms, dentists, restaurants" className="clarion-input h-12 pl-11 pr-4 text-sm font-semibold" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="target-leads" hint="1–50">Lead target</FieldLabel>
              <input id="target-leads" required type="number" min="1" max="50" value={targetLeads} onChange={(event) => setTargetLeads(event.target.value)} className="clarion-input h-12 px-3.5 text-sm font-bold tabular-nums" />
            </div>
            <div>
              <FieldLabel htmlFor="min-reviews" hint="0+">Min. reviews</FieldLabel>
              <input id="min-reviews" required type="number" min="0" value={minReviews} onChange={(event) => setMinReviews(event.target.value)} className="clarion-input h-12 px-3.5 text-sm font-bold tabular-nums" />
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Opportunity type</legend>
            <div className="grid gap-2">
              {[
                { value: '1', icon: Globe2, title: 'Missing website', description: 'Businesses without a professional website.' },
                { value: '2', icon: Target, title: 'Redesign opportunity', description: 'Businesses with a weak or broken website.' },
              ].map(({ value, icon: Icon, title, description }) => {
                const active = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`clarion-focus flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-200 ${active ? 'border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200 dark:border-indigo-300/25 dark:bg-indigo-400/[0.08] dark:ring-indigo-300/10' : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-white/15 dark:hover:bg-white/[0.045]'}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                      {active && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">3</span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">Outreach setup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Attach your offer and choose whether AI writes the pitch.</p>
            </div>
          </div>

          <FieldLabel htmlFor="payment-link" hint="Optional">Payment link</FieldLabel>
          <div className="relative">
            <Link className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="payment-link" type="url" value={sadapayLink} onChange={(event) => setSadapayLink(event.target.value)} placeholder="https://sadapay.pk/..." className="clarion-input h-12 pl-11 pr-4 text-sm font-semibold" />
          </div>

          <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition duration-200 ${useAi ? 'border-teal-300 bg-teal-50/80 dark:border-teal-300/20 dark:bg-teal-400/[0.075]' : 'border-slate-200 bg-white/50 dark:border-white/[0.08] dark:bg-white/[0.025]'}`}>
            <input type="checkbox" checked={useAi} onChange={(event) => setUseAi(event.target.checked)} className="peer sr-only" />
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${useAi ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-300 dark:bg-teal-300 dark:text-slate-950' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-transparent'}`}>
              {useAi && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
            </span>
            <span>
              <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">Write personalized AI pitches <Zap className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden="true" /></span>
              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Uses one AI credit per generated lead and saves the editable message to your Vault.</span>
            </span>
          </label>
        </section>

        <button
          disabled={isGenerating}
          type="submit"
          className="clarion-button-primary clarion-focus inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-600/22 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isGenerating ? (
            <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Search in progress</>
          ) : (
            <><Crosshair className="h-5 w-5" aria-hidden="true" />Deploy search agent</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          Payment links are included only when you provide one.
        </div>
      </form>

      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={(data) => {
          setMapData(data);
          setIsMapModalOpen(false);
        }}
      />
    </aside>
  );
}
