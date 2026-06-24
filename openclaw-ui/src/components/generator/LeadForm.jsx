import React, { useState, useRef } from 'react';
import { Search, Zap, Loader2, Crosshair, ChevronDown, MapPin, Briefcase, Target, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import MapModal from './MapModal'; // 👈 NEW: Importing the Map Modal

export default function LeadForm({ setLeads, setIsGenerating, isGenerating, user }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [targetLeads, setTargetLeads] = useState(5);
  const [minReviews, setMinReviews] = useState(10);
  const [mode, setMode] = useState('1');
  const [sadapayLink, setSadapayLink] = useState('');
  const [useAi, setUseAi] = useState(true);

  // 👈 NEW: State for the Map Modal
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapData, setMapData] = useState(null); // Stores {lat, lng, radius}

  const pollingIntervalRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that EITHER mapData OR city text exists
    if (!mapData && !city.trim()) {
      toast.error("Please provide a City or select an area on the Map.");
      return;
    }

    if (!category.trim()) {
      toast.error("Please provide a Business Type.");
      return;
    }

    setIsGenerating(true);
    setLeads([]);

    // Determine the location string for the toast
    const locationDisplay = mapData ? 'selected map area' : city.trim();
    const loadingToastId = toast.loading(`Deploying agent to ${locationDisplay}...`);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // 👈 NEW: If mapData exists, format it as a special "coords:" string so Python knows it's a map search
    const finalLocationPayload = mapData
      ? `coords:${mapData.lat},${mapData.lng},${mapData.radius}`
      : city.trim();

    try {
      const startResponse = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: finalLocationPayload, // Sends either "Lahore" OR "coords:33.77,72.75,5"
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
        const taskId = startResult.task_id;

        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/api/status/${taskId}`);
            const statusResult = await statusResponse.json();

            if (statusResult.progress) {
                toast.loading(statusResult.progress, { id: loadingToastId });
            }

            if (statusResult.status === 'success') {
              clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              setLeads(statusResult.data);
              toast.success(`Acquired ${statusResult.data.length} qualified targets!`, { id: loadingToastId });
            }
            else if (statusResult.status === 'error') {
              clearInterval(pollingIntervalRef.current);
              setIsGenerating(false);
              toast.error(statusResult.message?.[0] || "Scraping engine encountered an error.", { id: loadingToastId });
            }
          } catch (pollError) {
            console.error("Polling Error:", pollError);
            clearInterval(pollingIntervalRef.current);
            setIsGenerating(false);
            toast.error("Lost connection to the scraping engine.", { id: loadingToastId });
          }
        }, 3000);

      } else {
        setIsGenerating(false);
        toast.error(startResult.message?.[0] || "Failed to start scraping engine.", { id: loadingToastId });
      }

    } catch (error) {
      console.error("Generator Error:", error);
      setIsGenerating(false);
      toast.error("System failed to connect to the backend API.", { id: loadingToastId });
    }
  };

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

        {/* 👈 UPDATED: City or Area input with the Map button attached */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">City or Area</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                required={!mapData}
                type="text"
                value={mapData ? `📍 Custom Map Area (${mapData.radius}km)` : city}
                onChange={(e) => setCity(e.target.value)}
                readOnly={!!mapData}
                placeholder="e.g., Lahore, Johar Town"
                className={`w-full border focus:border-purple-500 dark:focus:border-purple-500 rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-colors ${
                  mapData 
                    ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800' 
                    : 'bg-gray-50 dark:bg-black/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                }`}
              />
              {/* Button to clear map selection and go back to text */}
              {mapData && (
                <button type="button" onClick={() => setMapData(null)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs font-bold transition-colors">
                  CLEAR
                </button>
              )}
            </div>

            {/* The Map Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
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

      {/* 👈 NEW: The Map Modal Component */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={(data) => {
          setMapData(data);
          setIsMapModalOpen(false);
        }}
      />
    </div>
  );
}