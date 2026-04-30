import React from 'react';
import { Terminal, Zap, Loader2, Crosshair } from 'lucide-react';

export default function LeadForm({ formData, handleInputChange, handleSubmit, loading }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center space-x-2 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white tracking-wide">Command Parameters</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="group">
          <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Target City</label>
          <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g., Lahore" 
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300" />
        </div>

        <div className="group">
          <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Business Category</label>
          <input required type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Gyms" 
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Max Leads</label>
            <input required type="number" name="target_leads" value={formData.target_leads} onChange={handleInputChange} 
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Min Reviews</label>
            <input required type="number" name="min_reviews" value={formData.min_reviews} onChange={handleInputChange} 
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Extraction Vector</label>
          <select name="mode" value={formData.mode} onChange={handleInputChange} 
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
            <option value="1">Vector Alpha: Target No Website</option>
            <option value="2">Vector Beta: Target Poor SEO/Faults</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Payment Gateway Link</label>
          <input type="text" name="sadapay_link" value={formData.sadapay_link} onChange={handleInputChange} placeholder="https://sadapay.pk/..." 
            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-purple-50 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all" />
        </div>

        <div className="flex items-center space-x-3 pt-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="relative flex items-center">
            <input type="checkbox" name="use_ai" id="use_ai" checked={formData.use_ai} onChange={handleInputChange} 
              className="w-5 h-5 appearance-none border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-black checked:bg-purple-500 checked:border-purple-500 focus:outline-none transition-colors cursor-pointer peer" />
            <Zap className="w-3 h-3 text-white dark:text-black absolute top-1 left-1 pointer-events-none opacity-0 peer-checked:opacity-100" />
          </div>
          <label htmlFor="use_ai" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer font-semibold">Engage AI Pitch Synthesis</label>
        </div>

        <button disabled={loading} type="submit" 
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-lg transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> EXECUTING PROTOCOL...</> : <><Crosshair className="mr-2 h-5 w-5" /> INITIATE EXTRACTION</>}
        </button>
      </form>
    </div>
  );
}