import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import { X, Crosshair } from 'lucide-react';

// This component handles the click-to-drop-pin logic inside the map
function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapModal({ isOpen, onClose, onConfirm }) {
  // Defaulting the starting map view to Wah, Pakistan
  const [position, setPosition] = useState([33.7715, 72.7511]);
  const [radius, setRadius] = useState(5); // Default 5km

  // Ask browser for live location if user clicks the button
  const handleLiveLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111827]">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Select Search Area</h3>
            <p className="text-xs text-gray-400">Click anywhere on the map to drop a pin.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Map */}
        <div className="h-[400px] w-full relative bg-gray-900 z-0">
          <MapContainer
            center={position}
            zoom={12}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <LocationSelector position={position} setPosition={setPosition} />

            {/* Inner dot (The Pin) */}
            <Circle center={position} radius={50} pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 1 }} />

            {/* The Search Radius Overlay (Radius is in meters, so multiply by 1000) */}
            <Circle
              center={position}
              radius={radius * 1000}
              pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.15, weight: 2 }}
            />
          </MapContainer>

          {/* Floating Live Location Button */}
          <button
            onClick={handleLiveLocation}
            className="absolute bottom-4 right-4 z-[400] bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all font-bold flex items-center gap-2 text-sm border border-gray-200"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Use My Location</span>
          </button>
        </div>

        {/* Controls Footer */}
        <div className="p-5 bg-[#111827] space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase text-gray-400">Search Radius</label>
              <span className="text-sm font-bold text-purple-400">{radius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => onConfirm({ lat: position[0], lng: position[1], radius })}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Confirm Area
          </button>
        </div>
      </div>
    </div>
  );
}