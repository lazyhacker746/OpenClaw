import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // 👈 NEW: Portals to break out of the container
import { MapContainer, TileLayer, Circle, useMapEvents, useMap } from 'react-leaflet';
import { X, Crosshair, Search, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// Automatically pans the map when a location is selected
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

// Handles user clicking on the map to set a new pin
function LocationSelector({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapModal({ isOpen, onClose, onConfirm }) {
  const [position, setPosition] = useState([33.7715, 72.7511]);
  const [radius, setRadius] = useState(5);

  // Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. THE DEBOUNCER: Only searches 500ms after the user STOPS typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Geocoding failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // Wait 0.5 seconds

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectLocation = (lat, lon, displayName) => {
    setPosition([parseFloat(lat), parseFloat(lon)]);
    setSearchQuery(displayName.split(',')[0]); // Only show the main city name in the box
    setShowSuggestions(false);
  };

  const handleLiveLocation = () => {
    if ("geolocation" in navigator) {
      const loadingToast = toast.loading("Locating you...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          toast.success("Location found!", { id: loadingToast });
        },
        (err) => {
          toast.error("Location access denied or unavailable.", { id: loadingToast });
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  if (!isOpen) return null;

  // 2. THE PORTAL: Injects this HTML directly into the body tag so it covers the whole screen
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">

      {/* Massive, centered modal window */}
      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-visible flex flex-col h-[85vh] max-h-[800px]">

        {/* Header & Autocomplete Search Bar Area */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#111827] gap-4 relative z-50">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Select Target Area</h3>
            <p className="text-sm text-gray-400 mt-1">Search for a location or click the map to drop a pin.</p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city or area..."
                className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-3 pl-4 pr-10 text-white text-sm outline-none transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full mt-2 bg-[#111827] border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[10000]">
                  {suggestions.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectLocation(item.lat, item.lon, item.display_name)}
                      className="px-4 py-3 hover:bg-purple-600/20 cursor-pointer flex items-start gap-3 border-b border-gray-800 last:border-0 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-300 truncate">{item.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800 shrink-0">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* The Map */}
        <div className="flex-grow w-full relative bg-gray-900 z-0">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <MapController center={position} />
            <LocationSelector setPosition={setPosition} />
            <Circle center={position} radius={50} pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1 }} />
            <Circle center={position} radius={radius * 1000} pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.15, weight: 2 }} />
          </MapContainer>

          {/* 👈 FIXED: Added cursor-pointer and hover background for better UX */}
          <button
            onClick={handleLiveLocation}
            className="absolute bottom-6 right-6 z-[400] bg-white text-gray-900 p-3 sm:px-4 sm:py-3 rounded-full shadow-xl hover:bg-gray-200 transition-all cursor-pointer font-bold flex items-center gap-2 text-sm border-2 border-transparent hover:border-purple-500"
          >
            <Crosshair className="w-5 h-5 text-purple-600" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>
        </div>

        {/* Controls Footer */}
        <div className="p-6 bg-[#111827] flex flex-col sm:flex-row items-center gap-6 z-50">
          <div className="w-full sm:flex-1">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Search Radius</label>
              <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">{radius} km</span>
            </div>
            <input
              type="range" min="1" max="25" value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => onConfirm({ lat: position[0], lng: position[1], radius })}
            className="w-full sm:w-auto px-10 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] whitespace-nowrap text-lg"
          >
            Confirm Area
          </button>
        </div>
      </div>
    </div>,
    document.body // 👈 Attaches the portal directly to the HTML body
  );
}