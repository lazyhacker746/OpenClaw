import React, { useState, useRef } from 'react';
import { Search, Zap, Loader2, Crosshair, ChevronDown, MapPin, Briefcase, Target, Link } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeadForm({ setLeads, setIsGenerating, isGenerating, user }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [targetLeads, setTargetLeads] = useState(5);
  const [minReviews, setMinReviews] = useState(10);
  const [mode, setMode] = useState('1');
  const [sadapayLink, setSadapayLink] = useState('');
  const [useAi, setUseAi] = useState(true);

  // 👈 NEW: We need to store the polling interval so we can clear it if the user navigates away
  const pollingIntervalRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!city.trim() || !category.trim()) {
      toast.error("Please provide both a City and Business Type.");
      return;
    }

    setIsGenerating(true);
    setLeads([]);

    const loadingToastId = toast.loading(`Deploying agent to ${city}...`);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      // 1. START THE BACKGROUND TASK
      const startResponse = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          category: category.trim(),
          target_leads: Number(targetLeads),
          min_reviews: Number(minReviews),
          mode: mode,
          use_ai: useAi,
          sadapay_link: sadapayLink.trim() || "none",
          user_id: user.id
        })
      });

      const startResult = await startResponse.json();

      if (startResult.status === 'processing' && startResult.task_id) {
        // 2. BEGIN POLLING FOR STATUS
        const taskId = startResult.task_id;

        // Check status every 3 seconds
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/api/status/${taskId}`);
            const statusResult = await statusResponse.json();

            // Update the toast message with live progress from Python!
            if (statusResult.progress) {
                toast.loading(statusResult.progress, { id: loadingToastId });
            }

            if (statusResult.status === 'success') {
              // SCRAPE COMPLETE!
              clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              setLeads(statusResult.data);
              toast.success(`Acquired ${statusResult.data.length} qualified targets!`, { id: loadingToastId });
            }
            else if (statusResult.status === 'error') {
              // SCRAPE FAILED!
              clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              toast.error(statusResult.message?.[0] || "Scraping engine encountered an error.", { id: loadingToastId });
            }
            // If status is 'starting' or 'processing', do nothing and check again in 3 seconds

          } catch (pollError) {
            console.error("Polling Error:", pollError);
            clearInterval(pollingIntervalRef.current);
            setIsGenerating(false);
            toast.error("Lost connection to the scraping engine.", { id: loadingToastId });
          }
        }, 3000); // 3000ms = 3 seconds

      } else {
        // Failed to even start the task (e.g., validation failed)
        setIsGenerating(false);
        toast.error(startResult.message?.[0] || "Failed to start scraping engine.", { id: loadingToastId });
      }

    } catch (error) {
      console.error("Generator Error:", error);
      setIsGenerating(false);
      toast.error("System failed to connect to the backend API.", { id: loadingToastId });
    }
  };

  // 3. CLEANUP ON UNMOUNT (Important React practice to prevent memory leaks)
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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