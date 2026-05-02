import React, { useState, useEffect } from 'react';
import { Database, Download, Clock, Loader2, MessageCircle } from 'lucide-react';

export default function HistoryDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from our new API route as soon as this component loads
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
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
  }, []);

  const exportAllCSV = () => {
    if (history.length === 0) return;
    const headers = Object.keys(history[0]).join(',');
    const csvData = history.map(row =>
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');

    const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OpenClaw_Master_Database.csv`;
    a.click();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[600px] transition-colors duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">Master Lead Database</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Records: {history.length}</p>
          </div>
        </div>
        <button onClick={exportAllCSV} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-bold text-purple-700 dark:text-purple-400 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
          <p className="font-bold tracking-widest uppercase">Syncing with Oracle Database...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Database className="w-16 h-16 opacity-20 mb-4" />
          <p className="font-bold tracking-widest uppercase">Database is empty</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 custom-scrollbar max-h-[600px]">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 relative">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-black/80 text-purple-700 dark:text-purple-400/80 font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4">Date Acquired</th>
                <th className="px-5 py-4">Targeting</th>
                <th className="px-5 py-4">Business Name</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
              {history.map((lead, idx) => (
                <tr key={idx} className="bg-white dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center space-x-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{lead.date_scraped.split(' ')[0]}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    {lead.category} <span className="text-gray-400 mx-1">•</span> {lead.city}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">
                    {lead.business_name}
                  </td>
                  <td className="px-5 py-4">
                    <a href={lead.whatsapp_link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm text-xs">
                      <MessageCircle className="w-3 h-3" />
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