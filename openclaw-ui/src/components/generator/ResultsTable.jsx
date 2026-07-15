import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clipboard,
  Download,
  Globe2,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const getWhatsAppActionUrl = (baseLink, pitchText) => {
  if (!baseLink || !baseLink.includes('wa.me')) return '#';
  if (!pitchText || pitchText === 'AI Pitch not saved to cloud yet.' || pitchText === 'No pitch generated.') return baseLink;
  return `${baseLink}?text=${encodeURIComponent(pitchText)}`;
};

const hasPhoneNumber = (lead) => {
  const link = lead?.['WhatsApp Link'];
  return Boolean(link && link !== 'N/A' && link !== 'No phone number' && link.includes('wa.me'));
};

const getOpportunity = (lead) => {
  const faults = lead?.['Website Faults'];
  if (faults && faults !== 'N/A' && faults !== 'No Website Found') {
    return { label: 'Redesign signal', detail: faults, tone: 'warning' };
  }
  return { label: 'No website', detail: 'Digital presence opportunity', tone: 'success' };
};

export default function ResultsTable({ leads, isGenerating }) {
  const handleExportCSV = () => {
    if (!Array.isArray(leads) || leads.length === 0) return;
    const headers = Object.keys(leads[0]);
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csvData = leads.map((row) => headers.map((header) => escapeCell(row[header])).join(',')).join('\n');
    const blob = new Blob([`${headers.map(escapeCell).join(',')}\n${csvData}`], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Clarion_Generator_Export.csv';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const copyPitch = async (lead) => {
    const pitch = lead?.Pitch;
    if (!pitch || pitch === 'No pitch generated.') {
      toast.error('No generated pitch is available for this lead.');
      return;
    }
    try {
      await navigator.clipboard.writeText(pitch);
      toast.success('Pitch copied to clipboard.');
    } catch {
      toast.error('The pitch could not be copied.');
    }
  };

  const leadCount = Array.isArray(leads) ? leads.length : 0;

  return (
    <section className="clarion-surface-strong flex min-h-[690px] min-w-0 flex-col overflow-hidden rounded-[1.75rem]" aria-labelledby="results-heading">
      <header className="flex flex-col gap-4 border-b border-slate-200/80 p-5 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Agent output</p>
            <h2 id="results-heading" className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Qualified leads</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-300">
            {leadCount} {leadCount === 1 ? 'record' : 'records'}
          </span>
          {leadCount > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="clarion-button-secondary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-black text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </header>

      {isGenerating && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="clarion-pulse-ring absolute h-16 w-16 rounded-3xl bg-indigo-500/15" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
          </div>
          <h3 className="mt-6 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Scanning the selected market</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Clarion is evaluating listings, contact routes, review signals, and website opportunities. Progress updates will appear above.</p>
          <div className="mt-7 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {[
              ['1', 'Discover', 'Find matching businesses'],
              ['2', 'Qualify', 'Apply your criteria'],
              ['3', 'Prepare', 'Save leads and pitches'],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left dark:border-white/[0.08] dark:bg-white/[0.03]">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Step {step}</span>
                <p className="mt-1.5 text-sm font-black text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isGenerating && leadCount === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-500">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Your results will appear here</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Complete the search brief, then deploy the agent. Qualified businesses are also stored automatically in your Lead Vault.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"><ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" aria-hidden="true" />Qualified targets</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"><MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />WhatsApp-ready</span>
          </div>
        </div>
      )}

      {!isGenerating && leadCount > 0 && (
        <div className="min-h-0 flex-1">
          <div className="clarion-scrollbar h-full max-h-[720px] overflow-y-auto md:hidden">
            <div className="space-y-3 p-4 sm:p-5">
              {leads.map((lead, index) => {
                const opportunity = getOpportunity(lead);
                const phoneAvailable = hasPhoneNumber(lead);
                return (
                  <article key={`${lead['Business Name']}-${index}`} className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">
                        <Building2 className="h-4.5 w-4.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">{lead['Business Name']}</h3>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {(lead.City || lead.city) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{lead.City || lead.city}</span>}
                          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" aria-hidden="true" />{lead['Review Count']} reviews</span>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 rounded-xl border p-3 ${opportunity.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/15 dark:bg-amber-300/[0.07] dark:text-amber-200' : 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-300/15 dark:bg-teal-300/[0.07] dark:text-teal-200'}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">{opportunity.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5">{opportunity.detail}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => copyPitch(lead)} className="clarion-button-secondary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200">
                        <Clipboard className="h-4 w-4" aria-hidden="true" />Copy pitch
                      </button>
                      {phoneAvailable ? (
                        <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead.Pitch)} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700">
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />Send pitch
                        </a>
                      ) : (
                        <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-500 dark:bg-white/[0.05] dark:text-slate-400"><AlertCircle className="h-4 w-4" aria-hidden="true" />No number</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="clarion-scrollbar hidden h-full max-h-[720px] overflow-auto md:block">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111a2b]/95 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Reviews</th>
                  <th className="px-5 py-4">Opportunity</th>
                  <th className="px-5 py-4 text-right">Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.07]">
                {leads.map((lead, index) => {
                  const opportunity = getOpportunity(lead);
                  const phoneAvailable = hasPhoneNumber(lead);
                  return (
                    <tr key={`${lead['Business Name']}-${index}`} className="bg-white/45 transition hover:bg-indigo-50/55 dark:bg-transparent dark:hover:bg-indigo-400/[0.045]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300"><Building2 className="h-4.5 w-4.5" aria-hidden="true" /></div>
                          <div className="min-w-0">
                            <p className="max-w-[250px] truncate font-black text-slate-950 dark:text-white">{lead['Business Name']}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><Globe2 className="h-3.5 w-3.5" aria-hidden="true" />{lead['Website Link'] && lead['Website Link'] !== 'N/A' ? 'Website detected' : 'No website detected'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700 dark:bg-white/[0.06] dark:text-slate-200"><Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />{lead['Review Count']}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`max-w-[300px] rounded-xl border px-3 py-2 ${opportunity.tone === 'warning' ? 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-300/15 dark:bg-amber-300/[0.06] dark:text-amber-200' : 'border-teal-200 bg-teal-50/70 text-teal-800 dark:border-teal-300/15 dark:bg-teal-300/[0.06] dark:text-teal-200'}`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em]">{opportunity.label}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5">{opportunity.detail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => copyPitch(lead)} className="clarion-icon-button clarion-focus inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200" title="Copy generated pitch"><Clipboard className="h-4 w-4" aria-hidden="true" /></button>
                          {phoneAvailable ? (
                            <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead.Pitch)} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" />Send pitch</a>
                          ) : (
                            <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-500 dark:bg-white/[0.05] dark:text-slate-400"><AlertCircle className="h-4 w-4" aria-hidden="true" />No number</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leadCount > 0 && !isGenerating && (
        <footer className="flex flex-col gap-2 border-t border-slate-200/80 bg-slate-50/60 px-5 py-4 text-xs font-semibold text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden="true" />All displayed leads have been saved to your Vault.</span>
          <span>Review and edit full pitch intelligence from the Vault.</span>
        </footer>
      )}
    </section>
  );
}
