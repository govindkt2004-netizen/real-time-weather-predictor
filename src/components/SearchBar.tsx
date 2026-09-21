import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin, History, ArrowLeftRight } from 'lucide-react';
import { GeocodingResult } from '../types';
import { searchCities } from '../services/weatherApi';

interface SearchBarProps {
  onSelectCity: (location: GeocodingResult) => void;
  isLoading: boolean;
  recentSearches: GeocodingResult[];
  onClearRecent: () => void;
  onError: (msg: string) => void;
  onCompareCity?: (location: GeocodingResult) => void;
  comparisonCityId?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  isLoading,
  recentSearches,
  onClearRecent,
  onError,
  onCompareCity,
  comparisonCityId,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const results = await searchCities(trimmed, controller.signal);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      onError('Please enter a city name.');
      return;
    }

    setIsSearchingSuggestions(true);
    try {
      const results = await searchCities(clean);
      if (results.length > 0) {
        handleSelectLocation(results[0]);
      } else {
        onError('City not found. Please try another city.');
      }
    } catch (err: any) {
      onError(err.message || 'City not found. Please try another city.');
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  const handleSelectLocation = (location: GeocodingResult) => {
    setQuery(`${location.name}${location.country ? `, ${location.country}` : ''}`);
    setIsOpen(false);
    setSuggestions([]);
    onSelectCity(location);
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative mb-6" ref={dropdownRef}>
      {/* Search Input Box */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center shadow-sm">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        <input
          id="city-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0 || (query.trim().length === 0 && recentSearches.length > 0)) {
              setIsOpen(true);
            }
          }}
          placeholder="Search city or location (e.g., Bengaluru, London, Tokyo)..."
          className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all text-sm sm:text-base"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Submit Button */}
        <button
          id="city-search-btn"
          type="submit"
          disabled={isLoading || isSearchingSuggestions}
          className="absolute right-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        >
          {isSearchingSuggestions || isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Autocomplete Suggestions / Recent Searches Dropdown */}
      {isOpen && (
        <div
          id="search-suggestions-dropdown"
          className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
        >
          {/* Active Autocomplete Suggestions */}
          {suggestions.length > 0 ? (
            <div>
              <div className="px-3.5 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                Matching Cities ({suggestions.length})
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {suggestions.map((loc) => {
                  const locationParts = [loc.name, loc.admin1, loc.country].filter(Boolean);
                  return (
                    <li key={`${loc.id}-${loc.latitude}-${loc.longitude}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
                          <div>
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {loc.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                              {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : query.trim().length >= 2 && !isSearchingSuggestions ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching cities found for &quot;{query}&quot;. Press Search to try geocoding.
            </div>
          ) : null}

          {/* Recent Searches (shown when input is empty or has recent items) */}
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div>
              <div className="px-3.5 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <History className="w-3 h-3" /> Recent Searches
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearRecent();
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline capitalize font-normal"
                >
                  Clear
                </button>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentSearches.map((loc) => (
                  <li
                    key={`recent-${loc.id}-${loc.latitude}`}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                    >
                      <History className="w-4 h-4 text-slate-400 group-hover:text-sky-500 shrink-0" />
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        {loc.name}
                        {loc.country ? `, ${loc.country}` : ''}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {onCompareCity && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompareCity(loc);
                            setIsOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                            comparisonCityId === loc.id
                              ? 'bg-sky-500 text-white border-sky-500'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600'
                          }`}
                          title={`Compare current city temperature with ${loc.name}`}
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{comparisonCityId === loc.id ? 'Comparing' : 'Compare'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="text-xs text-slate-400 hover:text-sky-500 font-medium cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Access Recent Chips (Visible beneath search) */}
      {recentSearches.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium mr-1 flex items-center gap-1">
            <History className="w-3 h-3" /> Popular/Recent:
          </span>
          {recentSearches.slice(0, 6).map((city) => {
            const isComparing = comparisonCityId === city.id;
            return (
              <div
                key={`chip-group-${city.id}-${city.name}`}
                className="inline-flex items-center rounded-full border border-slate-300/50 dark:border-slate-700/60 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onSelectCity(city)}
                  className="px-2.5 py-1 hover:bg-sky-100 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                  title={`View weather for ${city.name}`}
                >
                  {city.name}
                </button>
                {onCompareCity && (
                  <button
                    type="button"
                    onClick={() => onCompareCity(city)}
                    className={`px-1.5 py-1 border-l border-slate-300/60 dark:border-slate-700/60 hover:bg-sky-200 dark:hover:bg-sky-900/60 transition-colors cursor-pointer ${
                      isComparing ? 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/70' : 'text-slate-400'
                    }`}
                    title={`Compare temperature with ${city.name}`}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
