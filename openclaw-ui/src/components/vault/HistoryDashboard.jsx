import React, { useState, useEffect, useMemo } from 'react';
import { Users, Download, Clock, Loader2, MessageCircle, Filter, ChevronDown, Trash2, Calendar } from 'lucide-react';

export default function HistoryDashboard({ user }) { // 👈 1. Added user prop
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState(''); // Calendar Date State

  // 1. Fetch leads from the Python API (ISOLATED TO USER)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return; // Safety check
      
      try {
        // 👈 2. Pass user_id to the backend so it ONLY grabs their leads
        const response = await fetch(`/api/history?user_id=${user.id}`);
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
  }, [user]); // 👈 React will re-run this if the user changes

  // 2. DELETE LOGIC: Severs the magic link in Supabase securely
  const handleDelete = async (whatsappLink, businessName) => {
    if (!window.confirm(`Are you sure you want to delete ${businessName} from your vault?`)) {
      return;
    }

    try {
      const response = await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          whatsapp_link: whatsappLink,
          user_id: user.id // 👈 3. Security: Ensures user only deletes THEIR leads
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Instantly remove it from the React UI without refreshing
        setHistory(prev => prev.filter(lead => lead["WhatsApp Link"] !== whatsappLink));
      } else {
        alert("Error deleting lead from the database.");
      }
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  // 3. WHATSAPP URL GENERATOR: Injects the AI pitch into the chat box
  const getWhatsAppActionUrl = (baseLink, pitchText) => {
    if (!baseLink || !baseLink.includes('wa.me')) return '#';
    
    if (!pitchText || pitchText === "AI Pitch not saved to cloud yet." || pitchText === "No pitch generated.") {
      return baseLink;
    }
    return `${baseLink}?text=${encodeURIComponent(pitchText)}`;
  };

  // 4. Filter Logic (Now includes Date filtering!)
  const uniqueCities = useMemo(() => ['All', ...new Set(history.map(item => item.city || item.City))], [history]);
  const uniqueCategories = useMemo(() => ['All', ...new Set(history.map(item => item.category || item.Category))], [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(lead => {
      const leadCity = lead.city || lead.City;
      const leadCategory = lead.category || lead.Category;
      const leadDate = lead.date_scraped;
      
      const cityMatch = filterCity === 'All' || leadCity === filterCity;
      const categoryMatch = filterCategory === 'All' || leadCategory === filterCategory;
      const dateMatch = !filterDate || leadDate === filterDate; 
      
      return cityMatch && categoryMatch && dateMatch;
    });
  }, [history, filterCity, filterCategory, filterDate]);

  // 5. CSV Export
  const exportAllCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = Object.keys(filteredHistory[0]).join(',');
    const csvData = filteredHistory.map(row =>
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');

    const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clarion_LeadVault_${filterCity}_${filterCategory}.csv`;
    a.click();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col min-h-[600px] transition-colors duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">Lead Vault</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Showing {filteredHistory.length} Records</p>
          </div>
        </div>

        {/* PRO-GRADE FILTER DROPDOWNS */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

          {/* City Filter */}
          <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none pr-6 z-10">
              {uniqueCities.map(city => (
                <option key={city} value={city} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  {city === 'All' ? 'All Cities' : city}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none pr-6 z-10">
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  {cat === 'All' ? 'All Types' : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Native Calendar Date Picker */}
          <div className="relative flex items-center space-x-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none w-full cursor-pointer appearance-none"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')} 
                className="text-xs text-red-500 font-bold ml-2 hover:underline shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <button onClick={exportAllCSV} className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors w-full sm:w-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
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
            {filteredHistory.map((lead, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-black/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                      {lead.Category || lead.category} <span className="text-gray-400 mx-1">•</span> {lead.City || lead.city}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{lead["Business Name"]}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800/50">
                   <div className="font-mono text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{lead.date_scraped || "Recent"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDelete(lead["WhatsApp Link"], lead["Business Name"])}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a href={getWhatsAppActionUrl(lead["WhatsApp Link"], lead["Pitch"])} target="_blank" rel="noreferrer"
                        className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs">
                        <MessageCircle className="w-3 h-3" />
                        <span>Send Pitch</span>
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
                  <th className="px-5 py-4">Date Acquired</th>
                  <th className="px-5 py-4">Targeting</th>
                  <th className="px-5 py-4">Business Name</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {filteredHistory.map((lead, idx) => (
                  <tr key={idx} className="bg-white dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center space-x-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{lead.date_scraped || "Recent"}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {lead.Category || lead.category} <span className="text-gray-400 mx-1">•</span> {lead.City || lead.city}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                      {lead["Business Name"]}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <a href={getWhatsAppActionUrl(lead["WhatsApp Link"], lead["Pitch"])} target="_blank" rel="noreferrer"
                          className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs">
                          <MessageCircle className="w-3 h-3" />
                          <span>Send Pitch</span>
                        </a>
                        <button 
                          onClick={() => handleDelete(lead["WhatsApp Link"], lead["Business Name"])}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}