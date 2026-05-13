import React, { useState } from 'react';
import { Search, Zap, Loader2, Crosshair, ChevronDown, MapPin, Briefcase, Target, Link } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeadForm({ setLeads, setIsGenerating, isGenerating }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [targetLeads, setTargetLeads] = useState(5);
  const [minReviews, setMinReviews] = useState(10);
  const [mode, setMode] = useState('1'); 
  const [sadapayLink, setSadapayLink] = useState('');
  const [useAi, setUseAi] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!city.trim() || !category.trim()) {
      toast.error("Please provide both a City and Business Type.");
      return;
    }

    setIsGenerating(true);
    setLeads([]); 

    const loadingToast = toast.loading(`Deploying agent to ${city}...`);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          category: category.trim(),
          target_leads: Number(targetLeads),
          min_reviews: Number(minReviews),
          mode: mode,
          use_ai: useAi,
          sadapay_link: sadapayLink.trim() || "none"
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setLeads(result.data);
        toast.success(`Acquired ${result.data.length} qualified targets!`, { id: loadingToast });
      } else {
        toast.error(result.message?.[0] || "No leads found. Try expanding your search.", { id: loadingToast });
      }
    } catch (error) {
      console.error("Generator Error:", error);
      toast.error("System failed to connect to the scraping engine.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center space-x-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">Search Filters</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">City or Area</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Lahore, Johar Town"
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 pl-9 pr-3 text-gray-900 dark:text-white text-sm outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Type of Business</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input required type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Gyms, Plumbers"
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 pl-9 pr-3 text-gray-900 dark:text-white text-sm outline-none transition-colors" />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Stop After</label>
            <input required type="number" min="1" max="50" value={targetLeads} onChange={(e) => setTargetLeads(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm outline-none transition-colors" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Min Reviews</label>
            <input required type="number" min="0" value={minReviews} onChange={(e) => setMinReviews(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Targeting Strategy</label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <select value={mode} onChange={(e) => setMode(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 pl-9 pr-3 text-gray-900 dark:text-white text-sm outline-none appearance-none cursor-pointer">
              <option value="1" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Target: Missing Website</option>
              <option value="2" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Target: Broken/Bad Website</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Payment Link (Optional)</label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input type="text" value={sadapayLink} onChange={(e) => setSadapayLink(e.target.value)} placeholder="https://sadapay.pk/..."
              className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 pl-9 pr-3 text-gray-900 dark:text-white text-sm outline-none transition-colors" />
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50">
          <div className="relative flex items-center mt-0.5 shrink-0">
            <input type="checkbox" id="use_ai" checked={useAi} onChange={(e) => setUseAi(e.target.checked)}
              className="w-5 h-5 appearance-none border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black checked:bg-purple-500 checked:border-purple-500 focus:outline-none transition-colors cursor-pointer peer" />
            <Zap className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none opacity-0 peer-checked:opacity-100" />
          </div>
          <label htmlFor="use_ai" className="text-sm font-bold text-purple-900 dark:text-purple-300 cursor-pointer leading-tight">
            Auto-write custom WhatsApp pitches (AI)
          </label>
        </div>

        <button disabled={isGenerating} type="submit"
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isGenerating ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> <span>Scanning Area...</span></> : <><Crosshair className="mr-2 h-5 w-5" /> <span>Start Finding Leads</span></>}
        </button>
      </form>
    </div>
  );
}