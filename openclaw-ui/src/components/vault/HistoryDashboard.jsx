import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FilterX,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

function SelectionBox({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`clarion-focus flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-300 dark:bg-indigo-300 dark:text-slate-950' : 'border-slate-300 bg-white text-transparent hover:border-indigo-400 dark:border-slate-600 dark:bg-white/[0.03]'}`}
    >
      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

const getWhatsAppActionUrl = (baseLink, pitchText) => {
  if (!baseLink || !baseLink.includes('wa.me')) return '#';
  if (!pitchText || pitchText === 'AI Pitch not saved to cloud yet.' || pitchText === 'No pitch generated.') return baseLink;
  return `${baseLink}?text=${encodeURIComponent(pitchText)}`;
};

const hasPhone = (lead) => {
  const link = lead?.['WhatsApp Link'];
  return Boolean(link && link.includes('wa.me'));
};

export default function HistoryDashboard({ user, history, setHistory, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [editedPitch, setEditedPitch] = useState('');
  const [isSavingPitch, setIsSavingPitch] = useState(false);

  const safeHistory = useMemo(() => (Array.isArray(history) ? history : []), [history]);

  useEffect(() => {
    setSelectedLeads([]);
  }, [searchQuery, filterCity, filterCategory, filterDate]);

  const uniqueCities = useMemo(() => ['All', ...new Set(safeHistory.map((item) => item.city || item.City).filter(Boolean))], [safeHistory]);
  const uniqueCategories = useMemo(() => ['All', ...new Set(safeHistory.map((item) => item.category || item.Category).filter(Boolean))], [safeHistory]);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return safeHistory.filter((lead) => {
      const city = lead.city || lead.City || '';
      const category = lead.category || lead.Category || '';
      const businessName = lead['Business Name'] || '';
      const matchesSearch = !query || `${businessName} ${city} ${category}`.toLowerCase().includes(query);
      const cityMatch = filterCity === 'All' || city === filterCity;
      const categoryMatch = filterCategory === 'All' || category === filterCategory;
      const dateMatch = !filterDate || lead.date_scraped === filterDate;
      return matchesSearch && cityMatch && categoryMatch && dateMatch;
    });
  }, [safeHistory, searchQuery, filterCity, filterCategory, filterDate]);

  const allFilteredSelected = filteredHistory.length > 0 && selectedLeads.length === filteredHistory.length;
  const filtersActive = Boolean(searchQuery || filterCity !== 'All' || filterCategory !== 'All' || filterDate);

  const handleSelectAll = () => {
    setSelectedLeads(allFilteredSelected ? [] : filteredHistory.map((lead) => lead['WhatsApp Link']));
  };

  const handleSelectOne = (whatsappLink) => {
    setSelectedLeads((current) => current.includes(whatsappLink) ? current.filter((link) => link !== whatsappLink) : [...current, whatsappLink]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCity('All');
    setFilterCategory('All');
    setFilterDate('');
  };

  const triggerSingleDelete = (whatsappLink, businessName) => {
    setLeadToDelete({ name: businessName, link: whatsappLink });
    setIsDeleteModalOpen(true);
  };

  const triggerBulkDelete = () => {
    setLeadToDelete(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const linksToDelete = leadToDelete ? [leadToDelete.link] : selectedLeads;

    try {
      const response = await fetch(`${API_BASE}/api/leads/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_links: linksToDelete, user_id: user.id }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        setHistory((current) => current.filter((lead) => !linksToDelete.includes(lead['WhatsApp Link'])));
        setSelectedLeads([]);
        toast.success(`${linksToDelete.length} ${linksToDelete.length === 1 ? 'lead' : 'leads'} removed from the Vault.`);
      } else {
        toast.error(result.message || 'The selected leads could not be deleted.');
      }
    } catch {
      toast.error('A network error interrupted the deletion.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  const exportAllCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = Object.keys(filteredHistory[0]);
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = filteredHistory.map((row) => headers.map((header) => escapeCell(row[header])).join(',')).join('\n');
    const blob = new Blob([`${headers.map(escapeCell).join(',')}\n${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Clarion_LeadVault_${filterCity}_${filterCategory}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const openInsights = (lead) => {
    setActiveLead(lead);
    setEditedPitch(lead.Pitch || '');
    setIsInsightsOpen(true);
  };

  const copyPitch = async (lead) => {
    if (!lead?.Pitch) {
      toast.error('No pitch is available for this lead.');
      return;
    }
    try {
      await navigator.clipboard.writeText(lead.Pitch);
      toast.success('Pitch copied to clipboard.');
    } catch {
      toast.error('The pitch could not be copied.');
    }
  };

  const handleSavePitch = async () => {
    setIsSavingPitch(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${API_BASE}/api/leads/update-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_link: activeLead['WhatsApp Link'], new_pitch: editedPitch }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setHistory((current) => current.map((lead) => lead['WhatsApp Link'] === activeLead['WhatsApp Link'] ? { ...lead, Pitch: editedPitch } : lead));
        toast.success('Pitch updated.');
        setIsInsightsOpen(false);
      } else {
        toast.error(result.message || 'The pitch could not be saved.');
      }
    } catch {
      toast.error('A network error prevented the pitch update.');
    } finally {
      setIsSavingPitch(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Saved prospecting data</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl">Lead Vault</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Filter, review, edit, export, and contact every opportunity Clarion has acquired for your account.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"><Users className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />{safeHistory.length} total</span>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"><Search className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden="true" />{filteredHistory.length} visible</span>
          {selectedLeads.length > 0 && <span className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-3 text-xs font-black text-white">{selectedLeads.length} selected</span>}
        </div>
      </header>

      <section className="clarion-surface-strong overflow-hidden rounded-[1.75rem]">
        <div className="border-b border-slate-200/80 p-4 dark:border-white/[0.08] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_170px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search business, city, or category" className="clarion-input h-11 pl-11 pr-4 text-sm font-semibold" />
            </div>

            {[{ value: filterCity, setValue: setFilterCity, options: uniqueCities, label: 'City' }, { value: filterCategory, setValue: setFilterCategory, options: uniqueCategories, label: 'Category' }].map((filter) => (
              <div key={filter.label} className="relative">
                <select value={filter.value} onChange={(event) => filter.setValue(event.target.value)} className="clarion-input h-11 appearance-none px-3.5 pr-9 text-sm font-bold">
                  {filter.options.map((option) => <option key={option} value={option}>{option === 'All' ? `All ${filter.label.toLowerCase()}s` : option}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
            ))}

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className="clarion-input h-11 pl-10 pr-3 text-sm font-bold" aria-label="Filter by acquisition date" />
            </div>

            <div className="flex gap-2">
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="clarion-icon-button clarion-focus inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white" title="Clear all filters"><FilterX className="h-4 w-4" aria-hidden="true" /></button>
              )}
              <button type="button" onClick={exportAllCSV} disabled={filteredHistory.length === 0} className="clarion-button-secondary clarion-focus inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-black text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200 lg:flex-none"><Download className="h-4 w-4" aria-hidden="true" />Export</button>
            </div>
          </div>
        </div>

        {selectedLeads.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-300/15 dark:bg-indigo-400/[0.065] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs font-black text-indigo-800 dark:text-indigo-200">{selectedLeads.length} {selectedLeads.length === 1 ? 'lead is' : 'leads are'} selected.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedLeads([])} className="clarion-focus rounded-lg px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-400/10">Clear selection</button>
              <button type="button" onClick={triggerBulkDelete} className="clarion-button-danger clarion-focus inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-700"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete selected</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">Opening your Vault</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Syncing saved lead intelligence.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-500"><Store className="h-7 w-7" aria-hidden="true" /></div>
            <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">No leads match this view</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Adjust or clear the filters. New search results are saved here automatically.</p>
            {filtersActive && <button type="button" onClick={clearFilters} className="clarion-button-primary clarion-focus mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700"><FilterX className="h-4 w-4" aria-hidden="true" />Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="clarion-scrollbar max-h-[720px] overflow-y-auto md:hidden">
              <div className="flex items-center gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.025]">
                <SelectionBox checked={allFilteredSelected} onChange={handleSelectAll} label="Select all visible leads" />
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Select all visible</span>
              </div>
              <div className="space-y-3 p-4">
                {filteredHistory.map((lead, index) => {
                  const selected = selectedLeads.includes(lead['WhatsApp Link']);
                  const city = lead.City || lead.city || 'Unknown city';
                  const category = lead.Category || lead.category || 'Business';
                  return (
                    <article key={`${lead['WhatsApp Link']}-${index}`} className={`rounded-2xl border p-4 transition ${selected ? 'border-indigo-300 bg-indigo-50/80 dark:border-indigo-300/20 dark:bg-indigo-400/[0.07]' : 'border-slate-200 bg-white/65 dark:border-white/[0.08] dark:bg-white/[0.025]'}`}>
                      <div className="flex items-start gap-3">
                        <SelectionBox checked={selected} onChange={() => handleSelectOne(lead['WhatsApp Link'])} label={`Select ${lead['Business Name']}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">{category}</p>
                          <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white">{lead['Business Name']}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{city}</span><span className="inline-flex items-center gap-1"><Star className="h-3 w-3" aria-hidden="true" />{lead['Review Count'] || 0} reviews</span><span>{lead.date_scraped || 'Recent'}</span></div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                        <button type="button" onClick={() => openInsights(lead)} className="clarion-button-secondary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-indigo-300"><Sparkles className="h-4 w-4" aria-hidden="true" />Insights</button>
                        {hasPhone(lead) ? <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead.Pitch)} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" />Pitch</a> : <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">No phone</span>}
                        <button type="button" onClick={() => triggerSingleDelete(lead['WhatsApp Link'], lead['Business Name'])} className="clarion-icon-button clarion-focus inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-300" aria-label={`Delete ${lead['Business Name']}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="clarion-scrollbar hidden max-h-[720px] overflow-auto md:block">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111a2b]/95 dark:text-slate-400">
                  <tr><th className="w-14 px-5 py-4"><SelectionBox checked={allFilteredSelected} onChange={handleSelectAll} label="Select all visible leads" /></th><th className="px-5 py-4">Business</th><th className="px-5 py-4">Market</th><th className="px-5 py-4">Acquired</th><th className="px-5 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.07]">
                  {filteredHistory.map((lead, index) => {
                    const selected = selectedLeads.includes(lead['WhatsApp Link']);
                    const city = lead.City || lead.city || 'Unknown city';
                    const category = lead.Category || lead.category || 'Business';
                    return (
                      <tr key={`${lead['WhatsApp Link']}-${index}`} className={`transition ${selected ? 'bg-indigo-50/80 dark:bg-indigo-400/[0.065]' : 'bg-white/40 hover:bg-slate-50/80 dark:bg-transparent dark:hover:bg-white/[0.025]'}`}>
                        <td className="px-5 py-4"><SelectionBox checked={selected} onChange={() => handleSelectOne(lead['WhatsApp Link'])} label={`Select ${lead['Business Name']}`} /></td>
                        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300"><Store className="h-4.5 w-4.5" aria-hidden="true" /></div><div className="min-w-0"><p className="max-w-[260px] truncate font-black text-slate-950 dark:text-white">{lead['Business Name']}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{lead['Review Count'] || 0} reviews</p></div></div></td>
                        <td className="px-5 py-4"><p className="text-xs font-black text-indigo-700 dark:text-indigo-300">{category}</p><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{city}</p></td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{lead.date_scraped || 'Recent'}</td>
                        <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => copyPitch(lead)} className="clarion-icon-button clarion-focus inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-indigo-200" title="Copy pitch"><Clipboard className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => openInsights(lead)} className="clarion-button-secondary clarion-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-black text-indigo-700 hover:bg-indigo-100 dark:border-indigo-300/15 dark:bg-indigo-400/[0.07] dark:text-indigo-300 dark:hover:bg-indigo-400/[0.12]"><Sparkles className="h-4 w-4" aria-hidden="true" />Insights</button>{hasPhone(lead) && <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead.Pitch)} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" />Send pitch</a>}<button type="button" onClick={() => triggerSingleDelete(lead['WhatsApp Link'], lead['Business Name'])} className="clarion-icon-button clarion-focus inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-300" title="Delete lead"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" role="presentation" onMouseDown={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <section className="clarion-surface-strong clarion-enter w-full max-w-md rounded-[1.75rem]" role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300"><Trash2 className="h-5 w-5" aria-hidden="true" /></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Permanent action</p>
              <h2 id="delete-title" className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Remove {leadToDelete ? 'this lead' : `${selectedLeads.length} selected leads`}?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{leadToDelete ? <>“{leadToDelete.name}” will be permanently removed from your Vault.</> : 'The selected lead records will be permanently removed from your Vault.'} This cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="clarion-button-secondary clarion-focus rounded-xl px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={isDeleting} className="clarion-button-danger clarion-focus inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55">{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}Delete permanently</button>
            </div>
          </section>
        </div>
      )}

      {isInsightsOpen && activeLead && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-6" role="presentation" onMouseDown={() => !isSavingPitch && setIsInsightsOpen(false)}>
          <section className="clarion-surface-strong clarion-enter flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem]" role="dialog" aria-modal="true" aria-labelledby="insights-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 dark:border-white/[0.08] sm:p-6">
              <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Lead intelligence</p><h2 id="insights-title" className="mt-1.5 truncate text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{activeLead['Business Name']}</h2><p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{activeLead.Category || activeLead.category} · {activeLead.City || activeLead.city}</p></div>
              <button type="button" onClick={() => setIsInsightsOpen(false)} className="clarion-icon-button clarion-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white" aria-label="Close insights"><X className="h-5 w-5" aria-hidden="true" /></button>
            </header>

            <div className="clarion-scrollbar flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[{ icon: ShieldAlert, title: 'Website status', value: activeLead['Website Faults'] || 'N/A', classes: 'border-red-200 bg-red-50/70 text-red-700 dark:border-red-300/15 dark:bg-red-300/[0.06] dark:text-red-300' }, { icon: TrendingUp, title: 'AI strength', value: activeLead['AI Strength'] || 'N/A', classes: 'border-teal-200 bg-teal-50/70 text-teal-700 dark:border-teal-300/15 dark:bg-teal-300/[0.06] dark:text-teal-300' }, { icon: TrendingDown, title: 'AI weakness', value: activeLead['AI Weakness'] || 'N/A', classes: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-300/15 dark:bg-amber-300/[0.06] dark:text-amber-300' }].map(({ icon: Icon, title, value, classes }) => (
                  <article key={title} className={`rounded-2xl border p-4 ${classes}`}><div className="flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden="true" /><h3 className="text-[10px] font-black uppercase tracking-[0.15em]">{title}</h3></div><p className="mt-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">{value}</p></article>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Editable outreach</p><h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Generated pitch</h3></div><span className="text-xs font-bold text-slate-400 dark:text-slate-500">{editedPitch.length} characters</span></div>
                <textarea value={editedPitch} onChange={(event) => setEditedPitch(event.target.value)} className="clarion-input clarion-scrollbar min-h-56 resize-y p-4 text-sm font-medium leading-7" placeholder="The AI-generated pitch will appear here." />
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:flex-row sm:justify-end sm:p-5">
              <button type="button" onClick={() => setIsInsightsOpen(false)} className="clarion-button-secondary clarion-focus min-h-11 rounded-xl px-5 text-sm font-black text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]">Cancel</button>
              <button type="button" onClick={handleSavePitch} disabled={isSavingPitch || editedPitch === activeLead.Pitch} className="clarion-button-primary clarion-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45">{isSavingPitch ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}Save changes</button>
              {hasPhone(activeLead) && <a href={getWhatsAppActionUrl(activeLead['WhatsApp Link'], editedPitch)} target="_blank" rel="noreferrer" className="clarion-button-primary clarion-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" aria-hidden="true" />Send via WhatsApp</a>}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
