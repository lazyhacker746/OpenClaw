import React from 'react';
import { Search, Download, ShieldAlert, MessageCircle } from 'lucide-react';

export default function ResultsTable({ results, loading, error, exportCSV }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[600px] transition-colors duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white tracking-wide">Generated Leads</h2>
        </div>
        {results.length > 0 && (
          <button onClick={exportCSV} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors">
            <Download className="w-4 h-4" />
            <span>Download as CSV</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-500/50 rounded-lg p-4 flex items-start space-x-3 text-red-700 dark:text-red-400 mb-6">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
          <div className="relative mb-6">
            <Search className="w-20 h-20 opacity-20" />
            <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin opacity-40"></div>
          </div>
          <p className="font-bold text-sm tracking-widest uppercase">Fill out the form to start</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-black/60 text-purple-700 dark:text-purple-400/80 font-bold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Business Name</th>
                <th className="px-5 py-4">Total Reviews</th>
                <th className="px-5 py-4">Website Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
              {results.map((lead, idx) => (
                <tr key={idx} className="bg-white dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group">
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">{lead['Business Name']}</td>
                  <td className="px-5 py-4 font-bold text-purple-600 dark:text-purple-400">{lead['Review Count']}</td>
                  <td className="px-5 py-4">
                    {lead['Website Faults'] !== 'N/A' ? (
                      <span className="text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 px-2 py-1 rounded-md font-semibold">{lead['Website Faults']}</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-100 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 px-2 py-1 rounded-md font-semibold">No Website Found</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <a href={lead['WhatsApp Link']} target="_blank" rel="noreferrer" 
                      className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                      <span>Send Pitch</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}