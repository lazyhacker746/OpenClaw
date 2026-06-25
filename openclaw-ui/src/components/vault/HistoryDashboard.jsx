import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Download, Clock, Loader2, MessageCircle, Filter, ChevronDown, Trash2, Calendar, Check, X, Sparkles, Save, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

// 🛠️ DEV FIX 1: Premium Custom Checkbox
const CustomCheckbox = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all duration-200 ${
      checked 
        ? 'bg-purple-600 border-purple-600' 
        : 'bg-black/40 border-gray-600 hover:border-purple-500'
    }`}
  >
    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
  </div>
);

// 🛠️ DEV FIX 2: Premium Custom Dropdown (Bypasses OS styling)
const CustomDropdown = ({ value, options, onChange, icon: Icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-lg px-3 py-2 cursor-pointer transition-colors w-full min-w-[140px]"
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
            {value === 'All' ? placeholder : value}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                value === option 
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {option === 'All' ? placeholder : option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HistoryDashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const [selectedLeads, setSelectedLeads] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Insights Modal States
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [editedPitch, setEditedPitch] = useState("");
  const [isSavingPitch, setIsSavingPitch] = useState(false);

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

  useEffect(() => {
    setSelectedLeads([]);
  }, [filterCity, filterCategory, filterDate]);

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

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredHistory.length && filteredHistory.length > 0) {
      setSelectedLeads([]); // Deselect all
    } else {
      setSelectedLeads(filteredHistory.map(lead => lead["WhatsApp Link"])); // Select all
    }
  };

  const handleSelectOne = (whatsappLink) => {
    setSelectedLeads(prev =>
      prev.includes(whatsappLink)
        ? prev.filter(link => link !== whatsappLink)
        : [...prev, whatsappLink]
    );
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
    const isBulk = leadToDelete === null;
    const linksToDelete = isBulk ? selectedLeads : [leadToDelete.link];

    try {
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

  const handleSavePitch = async () => {
    setIsSavingPitch(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE}/api/leads/update-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_link: activeLead["WhatsApp Link"],
          new_pitch: editedPitch
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Instantly update the local state so the user sees the change
        setHistory(prev => prev.map(lead =>
          lead["WhatsApp Link"] === activeLead["WhatsApp Link"]
            ? { ...lead, Pitch: editedPitch }
            : lead
        ));
        toast.success("Pitch updated successfully!");
        setIsInsightsOpen(false);
      } else {
        toast.error("Failed to save pitch.");
      }
    } catch (error) {
      toast.error("Network error while saving.");
    } finally {
      setIsSavingPitch(false);
    }
  };

  const openInsights = (lead) => {
    setActiveLead(lead);
    setEditedPitch(lead.Pitch || "");
    setIsInsightsOpen(true);
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
              {/* 👈 APPLIED DEV FIX 2: Custom Dropdowns */}
              <CustomDropdown
                value={filterCity}
                options={uniqueCities}
                onChange={setFilterCity}
                icon={Filter}
                placeholder="All Cities"
              />
              <CustomDropdown
                value={filterCategory}
                options={uniqueCategories}
                onChange={setFilterCategory}
                icon={Filter}
                placeholder="All Types"
              />

              <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 flex-1 sm:flex-none hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none"
                />
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
              {/* 👈 APPLIED DEV FIX 1: Custom Checkbox */}
              <CustomCheckbox
                checked={selectedLeads.length === filteredHistory.length && filteredHistory.length > 0}
                onChange={handleSelectAll}
              />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Select All</span>
            </div>
            {filteredHistory.map((lead, idx) => (
              <div key={idx} className={`p-4 transition-colors ${selectedLeads.includes(lead["WhatsApp Link"]) ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-black/20'} space-y-3`}>
                <div className="flex gap-3 items-start">
                  <div className="mt-1">
                    <CustomCheckbox
                      checked={selectedLeads.includes(lead["WhatsApp Link"])}
                      onChange={() => handleSelectOne(lead["WhatsApp Link"])}
                    />
                  </div>
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
                      <button onClick={() => triggerSingleDelete(lead["WhatsApp Link"], lead["Business Name"])} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
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
                    <div className="flex justify-center">
                      <CustomCheckbox
                        checked={selectedLeads.length === filteredHistory.length && filteredHistory.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
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
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <CustomCheckbox
                            checked={isSelected}
                            onChange={() => handleSelectOne(lead["WhatsApp Link"])}
                          />
                        </div>
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
                        {/* Action Buttons Container */}
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openInsights(lead)}
                            className="inline-flex items-center space-x-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Insights</span>
                          </button>

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
      {/* INSIGHTS & EDIT MODAL */}
      {isInsightsOpen && activeLead && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-800 flex justify-between items-center bg-[#111827]">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">{activeLead["Business Name"]}</h3>
                <p className="text-sm text-purple-400 font-bold mt-1 tracking-wide">{activeLead.Category || activeLead.category} • {activeLead.City || activeLead.city}</p>
              </div>
              <button onClick={() => setIsInsightsOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

              {/* Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-400">Website Status</h4>
                  </div>
                  <p className="text-sm text-gray-300 font-mono">{activeLead["Website Faults"] || "N/A"}</p>
                </div>

                <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-green-400">AI Strength</h4>
                  </div>
                  <p className="text-sm text-gray-300">{activeLead["AI Strength"] || "N/A"}</p>
                </div>

                <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-yellow-400" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-yellow-400">AI Weakness</h4>
                  </div>
                  <p className="text-sm text-gray-300">{activeLead["AI Weakness"] || "N/A"}</p>
                </div>
              </div>

              {/* Pitch Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Generated Pitch
                  </h4>
                  <span className="text-xs text-gray-500 font-bold">Editable</span>
                </div>
                <textarea
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="w-full h-48 bg-black/50 border border-gray-700 focus:border-purple-500 rounded-xl p-4 text-gray-200 text-sm leading-relaxed outline-none transition-colors custom-scrollbar resize-none"
                  placeholder="The AI pitch will appear here..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 bg-[#111827] border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-3 z-10">
              <button
                onClick={() => setIsInsightsOpen(false)}
                className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePitch}
                disabled={isSavingPitch || editedPitch === activeLead.Pitch}
                className="px-6 py-3 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSavingPitch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
              <a
                href={getWhatsAppActionUrl(activeLead["WhatsApp Link"], editedPitch)}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}