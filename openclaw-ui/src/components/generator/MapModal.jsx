import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, useMap } from 'react-leaflet';
import { X, Crosshair, Search, Loader2 } from 'lucide-react';

// Automatically pans the map when the position state changes via search
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
  const [position, setPosition] = useState([33.7715, 72.7511]); // Default: Wah
  const [radius, setRadius] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleLiveLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  // Uses OpenStreetMap's free Nominatim API to find the typed location
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Increased width to max-w-5xl for a less cramped view */}
      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]">

        {/* Header & Search Bar Area */}
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#111827] gap-4">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Select Target Area</h3>
            <p className="text-xs text-gray-400">Search for a location or click the map.</p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to city..."
                className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg py-2 pl-3 pr-10 text-white text-sm outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Map (Now flex-grow to fill the height) */}
        <div className="flex-grow w-full relative bg-gray-900 z-0">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <MapController center={position} />
            <LocationSelector setPosition={setPosition} />

            <Circle center={position} radius={50} pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1 }} />
            <Circle center={position} radius={radius * 1000} pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.15, weight: 2 }} />
          </MapContainer>

          <button
            onClick={handleLiveLocation}
            className="absolute bottom-4 right-4 z-[400] bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all font-bold flex items-center gap-2 text-sm border border-gray-200"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>
        </div>

        {/* Controls Footer */}
        <div className="p-5 bg-[#111827] flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:flex-1">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase text-gray-400">Search Radius</label>
              <span className="text-sm font-bold text-purple-400">{radius} km</span>
            </div>
            <input
              type="range" min="1" max="25" value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => onConfirm({ lat: position[0], lng: position[1], radius })}
            className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            Confirm Area
          </button>
        </div>
      </div>
    </div>
  );
}