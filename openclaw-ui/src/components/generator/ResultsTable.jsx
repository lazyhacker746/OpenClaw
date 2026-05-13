import React from 'react';
import { Search, Download, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResultsTable({ leads, isGenerating }) {

  // --- FEATURE 1: AI WhatsApp Link Injector ---
  // Safely takes the AI-generated Roman Urdu pitch and formats it for WhatsApp Web/App
  const getWhatsAppActionUrl = (baseLink, pitchText) => {
    if (!baseLink || !baseLink.includes('wa.me')) return '#';
    if (!pitchText || pitchText === "AI Pitch not saved to cloud yet." || pitchText === "No pitch generated.") {
      return baseLink;
    }
    return `${baseLink}?text=${encodeURIComponent(pitchText)}`;
  };

  // --- FEATURE 2: Native CSV Exporter ---
  // Grabs the current leads in the table and forces a browser download
  const handleExportCSV = () => {
    if (!leads || leads.length === 0) return;
    const headers = Object.keys(leads[0]).join(',');
    const csvData = leads.map(row =>
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clarion_Generator_Export.csv`;
    a.click();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[600px] transition-colors duration-300">

      {/* --- HEADER CONTROLS --- */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">Generated Leads</h2>
        </div>
        {/* Only show export button if we actually have leads */}
        {leads && leads.length > 0 && (
          <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download CSV</span>
          </button>
        )}
      </div>

      {/* --- STATE: LOADING --- */}
      {isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-500 mb-4" />
          <p className="font-bold text-sm tracking-widest uppercase">Autonomous Agent Scanning...</p>
        </div>
      )}

      {/* --- STATE: EMPTY (Awaiting Input) --- */}
      {!isGenerating && (!leads || leads.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <Search className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-bold text-sm tracking-widest uppercase text-center">Fill out the form to deploy agent.</p>
        </div>
      )}

      {/* --- STATE: DATA POPULATED --- */}
      {!isGenerating && leads && leads.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 flex-1 flex flex-col">
          
          {/* FEATURE 3: MOBILE RESPONSIVE CARDS */}
          <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
            {leads.map((lead, idx) => {
              const hasPhone = lead['WhatsApp Link'] && lead['WhatsApp Link'] !== 'N/A' && lead['WhatsApp Link'] !== 'No phone number';
              return (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-black/20 space-y-3">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                    {lead['Business Name']}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                      {lead['Review Count']} Reviews
                    </span>
                    {lead['Website Faults'] !== 'N/A' && lead['Website Faults'] !== 'No Website Found' ? (
                      <span className="text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md font-semibold">{lead['Website Faults']}</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md font-semibold">No Website</span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800/50 mt-2">
                    {hasPhone ? (
                      <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead['Pitch'])} target="_blank" rel="noreferrer"
                        className="w-full flex justify-center items-center space-x-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                        <MessageCircle className="w-5 h-5" />
                        <span>Send Pitch</span>
                      </a>
                    ) : (
                      <div className="w-full flex justify-center items-center space-x-1 bg-gray-200 dark:bg-gray-800 text-gray-500 px-4 py-2 rounded-lg font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span>No Number</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FEATURE 4: DESKTOP DATA TABLE */}
          <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar flex-1">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 relative">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-black/80 text-purple-700 dark:text-purple-400 font-bold sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <tr>
                  <th className="px-5 py-4 whitespace-nowrap">Business Name</th>
                  <th className="px-5 py-4">Total Reviews</th>
                  <th className="px-5 py-4">Website Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {leads.map((lead, idx) => {
                  const hasPhone = lead['WhatsApp Link'] && lead['WhatsApp Link'] !== 'N/A' && lead['WhatsApp Link'] !== 'No phone number';
                  
                  return (
                    <tr key={idx} className="bg-white dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">{lead['Business Name']}</td>
                      <td className="px-5 py-4 font-bold text-purple-600 dark:text-purple-400">{lead['Review Count']}</td>
                      
                      {/* FEATURE 5: DYNAMIC STATUS BADGES */}
                      <td className="px-5 py-4">
                        {lead['Website Faults'] !== 'N/A' && lead['Website Faults'] !== 'No Website Found' ? (
                          <span className="text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 px-2 py-1 rounded-md font-semibold">{lead['Website Faults']}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded-md font-semibold">No Website Found</span>
                        )}
                      </td>
                      
                      {/* ACTION BUTTONS */}
                      <td className="px-5 py-4">
                        {hasPhone ? (
                          <a href={getWhatsAppActionUrl(lead['WhatsApp Link'], lead['Pitch'])} target="_blank" rel="noreferrer"
                            className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm">
                            <MessageCircle className="w-4 h-4" />
                            <span>Send Pitch</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-gray-400 dark:text-gray-500 text-xs font-bold px-3 py-1.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>No Number</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}