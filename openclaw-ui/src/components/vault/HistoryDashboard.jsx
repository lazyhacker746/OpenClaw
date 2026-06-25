import React, { useState, useEffect, useMemo } from 'react';
import { Users, Download, Clock, Loader2, MessageCircle, Filter, ChevronDown, Trash2, Calendar, CheckSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryDashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // Bulk Delete States
  const [selectedLeads, setSelectedLeads] = useState([]); // Array of WhatsApp Links

  // Custom Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null); // { name, link } for single delete
  const [isDeleting, setIsDeleting] = useState(false); // To show spinner on the delete button

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/history?user_id=${user.id}`);
        const result = await response.json();
        if (result.status === 'success') {
          setHistory(result.data);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // If filters change, clear the selection to prevent accidental hidden deletions (QA Check!)
  useEffect(() => {
    setSelectedLeads([]);
  }, [filterCity, filterCategory, filterDate]);

  // Filtering Logic
  const uniqueCities = useMemo(() => ['All', ...new Set(history.map(item => item.city || item.City))], [history]);
  const uniqueCategories = useMemo(() => ['All', ...new Set(history.map(item => item.category || item.Category))], [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(lead => {
      const cityMatch = filterCity === 'All' || (lead.city || lead.City) === filterCity;
      const categoryMatch = filterCategory === 'All' || (lead.category || lead.Category) === filterCategory;
      const dateMatch = !filterDate || lead.date_scraped === filterDate;
      return cityMatch && categoryMatch && dateMatch;
    });
  }, [history, filterCity, filterCategory, filterDate]);

  // Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredHistory.map(lead => lead["WhatsApp Link"]));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectOne = (whatsappLink) => {
    setSelectedLeads(prev =>
      prev.includes(whatsappLink)
        ? prev.filter(link => link !== whatsappLink)
        : [...prev, whatsappLink]
    );
  };

  // --- DELETE LOGIC ---
  const triggerSingleDelete = (whatsappLink, businessName) => {
    setLeadToDelete({ name: businessName, link: whatsappLink });
    setIsDeleteModalOpen(true);
  };

  const triggerBulkDelete = () => {
    setLeadToDelete(null); // Null means it's a bulk operation
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Determine if we are deleting one or many
    const isBulk = leadToDelete === null;
    const linksToDelete = isBulk ? selectedLeads : [leadToDelete.link];

    try {
      // We will create this new bulk route in the backend next!
      const response = await fetch(`${API_BASE}/api/leads/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_links: linksToDelete,
          user_id: user.id
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setHistory(prev => prev.filter(lead => !linksToDelete.includes(lead["WhatsApp Link"])));
        setSelectedLeads([]);
        toast.success(`Successfully deleted ${linksToDelete.length} lead(s).`);
      } else {
        toast.error("Failed to delete leads.");
      }
    } catch (error) {
      toast.error("Network error while deleting.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  const getWhatsAppActionUrl = (baseLink, pitchText) => {
    if (!baseLink || !baseLink.includes('wa.me')) return '#';
    if (!pitchText || pitchText === "AI Pitch not saved to cloud yet." || pitchText === "No pitch generated.") return baseLink;
    return `${baseLink}?text=${encodeURIComponent(pitchText)}`;
  };

  const exportAllCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = Object.keys(filteredHistory[0]).join(',');
    const csvData = filteredHistory.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clarion_LeadVault_${filterCity}_${filterCategory}.csv`;
    a.click();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col min-h-[600px] transition-colors duration-300 relative">

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">Lead Vault</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Showing {filteredHistory.length} Records</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Action Button: Replaces Export when leads are selected */}
          {selectedLeads.length > 0 ? (
            <button
              onClick={triggerBulkDelete}
              className="flex items-center justify-center space-x-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-800 px-4 py-2 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 transition-colors w-full sm:w-auto mr-auto lg:mr-0 animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedLeads.length})</span>
            </button>
          ) : (
            <>
              {/* Standard Filters (Hide on mobile when selecting to save space, visible otherwise) */}
              <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none pr-6 z-10">
                  {uniqueCities.map(city => <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>)}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none pr-6 z-10">
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Types' : cat}</option>)}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none" />
                {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-bold ml-2 hover:underline shrink-0">Clear</button>}
              </div>
              <button onClick={exportAllCSV} className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors w-full sm:w-auto">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CONTENT SECTION */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
          <p className="font-bold tracking-widest uppercase">Decrypting Vault...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Users className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-bold tracking-widest uppercase text-center">No leads match these filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          {/* MOBILE VIEW */}
          <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div className="p-3 bg-gray-100 dark:bg-black/80 flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                checked={selectedLeads.length === filteredHistory.length && filteredHistory.length > 0}
                onChange={handleSelectAll}
              />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Select All</span>
            </div>
            {filteredHistory.map((lead, idx) => (
              <div key={idx} className={`p-4 transition-colors ${selectedLeads.includes(lead["WhatsApp Link"]) ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-black/20'} space-y-3`}>
                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                    checked={selectedLeads.includes(lead["WhatsApp Link"])}
                    onChange={() => handleSelectOne(lead["WhatsApp Link"])}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                      {lead.Category || lead.category} <span className="text-gray-400 mx-1">•</span> {lead.City || lead.city}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{lead["Business Name"]}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 pl-7 border-t border-gray-100 dark:border-gray-800/50">
                   <div className="font-mono text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{lead.date_scraped || "Recent"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => triggerSingleDelete(lead["WhatsApp Link"], lead["Business Name"])}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a href={getWhatsAppActionUrl(lead["WhatsApp Link"], lead["Pitch"])} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs">
                        <MessageCircle className="w-3 h-3" />
                        <span>Pitch</span>
                      </a>
                    </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 relative">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-black/80 text-purple-700 dark:text-purple-400/80 font-bold sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                      checked={selectedLeads.length === filteredHistory.length && filteredHistory.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-4">Date Acquired</th>
                  <th className="px-5 py-4">Targeting</th>
                  <th className="px-5 py-4">Business Name</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {filteredHistory.map((lead, idx) => {
                  const isSelected = selectedLeads.includes(lead["WhatsApp Link"]);
                  return (
                    <tr key={idx} className={`transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-gray-900/40'}`}>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(lead["WhatsApp Link"])}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5"><Clock className="w-3 h-3" /><span>{lead.date_scraped || "Recent"}</span></div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {lead.Category || lead.category} <span className="text-gray-400 mx-1">•</span> {lead.City || lead.city}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                        {lead["Business Name"]}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <a href={getWhatsAppActionUrl(lead["WhatsApp Link"], lead["Pitch"])} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs">
                            <MessageCircle className="w-3 h-3" />
                            <span>Send Pitch</span>
                          </a>
                          <button onClick={() => triggerSingleDelete(lead["WhatsApp Link"], lead["Business Name"])} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete Lead">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CUSTOM DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4 border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
              {leadToDelete ? (
                <p className="text-gray-400 text-sm">
                  Are you sure you want to permanently remove <span className="font-bold text-gray-200">"{leadToDelete.name}"</span> from your vault? This cannot be undone.
                </p>
              ) : (
                <p className="text-gray-400 text-sm">
                  Are you sure you want to permanently remove <span className="font-bold text-red-400">{selectedLeads.length} selected leads</span> from your vault? This cannot be undone.
                </p>
              )}
            </div>
            <div className="p-4 bg-black/50 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}