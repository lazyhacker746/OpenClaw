import React from 'react';
import { Search, Zap, Loader2, Crosshair, ChevronDown } from 'lucide-react'; // <-- Added ChevronDown

export default function LeadForm({ formData, handleInputChange, handleSubmit, loading }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center space-x-2 mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
        <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white tracking-wide">Search Filters</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="group">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">City or Area</label>
          <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g., Lahore, Johar Town"
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Type of Business</label>
          <input required type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Gyms, Plumbers"
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Stop After (Leads)</label>
            <input required type="number" name="target_leads" value={formData.target_leads} onChange={handleInputChange}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Min Reviews</label>
            <input required type="number" name="min_reviews" value={formData.min_reviews} onChange={handleInputChange}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
          </div>
        </div>

        {/* --- PRO-GRADE DROPDOWN FIX --- */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Targeting Strategy</label>
          <div className="relative">
            <select name="mode" value={formData.mode} onChange={handleInputChange}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none truncate cursor-pointer pr-10">

              {/* Added explicit dark mode styling to the options */}
              <option value="1" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Target: Missing Website</option>
              <option value="2" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Target: Broken/Bad Website</option>
            </select>
            {/* Custom SVG Arrow */}
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        {/* ------------------------------- */}

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">SadaBiz/Payment Link</label>
          <input type="text" name="sadapay_link" value={formData.sadapay_link} onChange={handleInputChange} placeholder="https://sadapay.pk/..."
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-purple-50 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
        </div>

        <div className="flex items-start space-x-3 pt-2 bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg border border-purple-100 dark:border-purple-800/50">
          <div className="relative flex items-center mt-0.5 shrink-0">
            <input type="checkbox" name="use_ai" id="use_ai" checked={formData.use_ai} onChange={handleInputChange}
              className="w-5 h-5 appearance-none border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-black checked:bg-purple-500 checked:border-purple-500 focus:outline-none transition-colors cursor-pointer peer" />
            <Zap className="w-3 h-3 text-white dark:text-black absolute top-1 left-1 pointer-events-none opacity-0 peer-checked:opacity-100" />
          </div>
          <label htmlFor="use_ai" className="text-sm font-bold text-purple-900 dark:text-purple-200 cursor-pointer leading-tight">
            Auto-write custom WhatsApp pitches (AI)
          </label>
        </div>

        <button disabled={loading} type="submit"
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
          {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Searching...</> : <><Crosshair className="mr-2 h-5 w-5" /> Start Finding Leads</>}
        </button>
      </form>
    </div>
  );
}