import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Circle, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function LocationSelector({ setPosition }) {
  useMapEvents({
    click(event) {
      setPosition([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export default function MapModal({ isOpen, onClose, onConfirm }) {
  const [position, setPosition] = useState([33.7715, 72.7511]);
  const [radius, setRadius] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const delay = window.setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await response.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Geocoding failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => window.clearTimeout(delay);
  }, [searchQuery]);

  const selectLocation = (lat, lon, displayName) => {
    setPosition([Number.parseFloat(lat), Number.parseFloat(lon)]);
    setSearchQuery(displayName.split(',')[0]);
    setShowSuggestions(false);
  };

  const useLiveLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    const loadingToast = toast.loading('Locating your device...');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition([result.coords.latitude, result.coords.longitude]);
        toast.success('Location found.', { id: loadingToast });
      },
      () => toast.error('Location access was denied or unavailable.', { id: loadingToast }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const confirmArea = async () => {
    setIsResolving(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`);
      const data = await response.json();
      const address = data.address || {};
      const resolvedCity = address.city || address.town || address.village || address.county || 'Custom map area';
      onConfirm({ lat: position[0], lng: position[1], radius, resolvedCity });
    } catch {
      onConfirm({ lat: position[0], lng: position[1], radius, resolvedCity: 'Custom map area' });
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="clarion-surface-strong clarion-enter flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="relative z-[600] flex flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Precision targeting</p>
              <h2 id="map-modal-title" className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">Choose a search area</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Search, click the map, or use your current location.</p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-[340px] sm:flex-none">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search city or neighborhood"
                className="clarion-input h-11 pl-11 pr-10 text-sm font-semibold"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-autocomplete="list"
              />
              {isSearching && <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" />}

              {showSuggestions && suggestions.length > 0 && (
                <ul className="clarion-surface-strong clarion-scrollbar absolute left-0 top-full z-[800] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl p-1.5 shadow-2xl" role="listbox">
                  {suggestions.map((item, index) => (
                    <li key={item.place_id || index} role="option" aria-selected="false">
                      <button type="button" onClick={() => selectLocation(item.lat, item.lon, item.display_name)} className="clarion-focus flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 dark:text-slate-300 dark:hover:bg-indigo-400/[0.08] dark:hover:text-indigo-200">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                        <span className="line-clamp-2 leading-5">{item.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="button" onClick={onClose} className="clarion-icon-button clarion-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white" aria-label="Close map">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-slate-200 dark:bg-slate-900">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
            <MapController center={position} />
            <LocationSelector setPosition={setPosition} />
            <Circle center={position} radius={65} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.95, weight: 2 }} />
            <Circle center={position} radius={radius * 1000} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.12, weight: 2 }} />
          </MapContainer>

          <div className="pointer-events-none absolute left-4 top-4 z-[450] rounded-2xl border border-white/70 bg-white/90 px-3.5 py-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1423]/90 sm:left-6 sm:top-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Selected center</p>
            <p className="mt-1 text-xs font-black tabular-nums text-slate-900 dark:text-white">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
          </div>

          <button
            type="button"
            onClick={useLiveLocation}
            className="clarion-button-secondary clarion-focus absolute bottom-4 right-4 z-[450] inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/95 px-4 text-xs font-black text-slate-800 shadow-xl backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-[#0c1423]/92 dark:text-white dark:hover:bg-[#15213a] sm:bottom-6 sm:right-6"
          >
            <LocateFixed className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            Use my location
          </button>
        </div>

        <footer className="flex flex-col gap-5 border-t border-slate-200/80 p-5 dark:border-white/[0.08] sm:flex-row sm:items-end sm:p-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Search radius</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Clarion will qualify businesses inside this circle.</p>
              </div>
              <span className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-black tabular-nums text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">{radius} km</span>
            </div>
            <input type="range" min="1" max="25" value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="clarion-range w-full appearance-none" aria-label="Search radius in kilometers" />
            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500"><span>1 km</span><span>25 km</span></div>
          </div>

          <button
            type="button"
            onClick={confirmArea}
            disabled={isResolving}
            className="clarion-button-primary clarion-focus inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          >
            {isResolving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crosshair className="h-5 w-5" aria-hidden="true" />}
            Confirm this area
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
