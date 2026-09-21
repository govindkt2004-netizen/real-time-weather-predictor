import React from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Equal,
  X,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { GeocodingResult, ComparisonWeather, TemperatureUnit } from '../types';
import { formatTemp, calculateTempDelta, getWeatherCondition } from '../utils/weatherCodes';
import { WeatherIcon } from './WeatherIcon';

interface TemperatureComparisonProps {
  currentCity: GeocodingResult;
  currentTempC: number;
  unit: TemperatureUnit;
  recentSearches: GeocodingResult[];
  comparisonWeather: ComparisonWeather | null;
  isLoadingComparison: boolean;
  comparisonError: string | null;
  onSelectComparisonCity: (city: GeocodingResult | null) => void;
  onSwapCities?: () => void;
  onRetryComparison?: () => void;
}

export const TemperatureComparison: React.FC<TemperatureComparisonProps> = ({
  currentCity,
  currentTempC,
  unit,
  recentSearches,
  comparisonWeather,
  isLoadingComparison,
  comparisonError,
  onSelectComparisonCity,
  onSwapCities,
  onRetryComparison,
}) => {
  // Exclude current active city from selectable comparison candidates
  const availableCandidates = recentSearches.filter(
    (c) =>
      !(
        c.name.toLowerCase() === currentCity.name.toLowerCase() &&
        (c.country || '') === (currentCity.country || '')
      )
  );

  const delta = comparisonWeather
    ? calculateTempDelta(currentTempC, comparisonWeather.temperature, unit)
    : null;

  const comparisonCondition = comparisonWeather?.weatherCode !== undefined
    ? getWeatherCondition(comparisonWeather.weatherCode, comparisonWeather.isDay !== 0)
    : null;

  return (
    <div
      id="temperature-comparison-container"
      className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80"
    >
      {/* Comparison Active State */}
      {comparisonWeather ? (
        <div
          id="active-comparison-card"
          className="rounded-xl p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/70 shadow-xs transition-all"
        >
          {/* Header Row: Label & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Temperature Comparison
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 ml-2">
                  Live Delta
                </span>
              </div>
            </div>

            {/* Action Buttons: Switch City, Swap, Dismiss */}
            <div className="flex items-center gap-2">
              {/* City Switcher Select */}
              {availableCandidates.length > 1 && (
                <div className="relative">
                  <select
                    id="compare-city-dropdown"
                    aria-label="Switch comparison city"
                    value={comparisonWeather.location.id}
                    onChange={(e) => {
                      const found = availableCandidates.find((c) => c.id === Number(e.target.value));
                      if (found) onSelectComparisonCity(found);
                    }}
                    className="text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-sky-500 focus:outline-hidden cursor-pointer"
                  >
                    {availableCandidates.map((c) => (
                      <option key={`opt-switch-${c.id}`} value={c.id}>
                        vs. {c.name}{c.country ? `, ${c.country}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Swap Button */}
              {onSwapCities && (
                <button
                  id="swap-comparison-city-btn"
                  type="button"
                  onClick={onSwapCities}
                  title={`Make ${comparisonWeather.location.name} primary location`}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Swap</span>
                </button>
              )}

              {/* Clear / Dismiss Button */}
              <button
                id="clear-comparison-btn"
                type="button"
                onClick={() => onSelectComparisonCity(null)}
                title="Dismiss comparison"
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label="Dismiss comparison"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading or Error inside comparison */}
          {isLoadingComparison ? (
            <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              <span>Fetching current weather for {comparisonWeather.location.name}...</span>
            </div>
          ) : comparisonError ? (
            <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-600 dark:text-rose-400">
              <span>{comparisonError}</span>
              {onRetryComparison && (
                <button
                  type="button"
                  onClick={onRetryComparison}
                  className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </div>
          ) : delta ? (
            /* Comparison Metrics Row */
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Primary Current City */}
              <div
                id="comparison-primary-city-box"
                className="flex items-center justify-between md:justify-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Primary City
                  </span>
                  <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {currentCity.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentCity.country || 'Selected location'}
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono shrink-0">
                  {formatTemp(currentTempC, unit)}
                </div>
              </div>

              {/* Central Temperature Delta Badge */}
              <div
                id="comparison-delta-pill"
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  delta.isWarmer
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                    : delta.isCooler
                    ? 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200'
                    : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold font-mono text-xl sm:text-2xl">
                  {delta.isWarmer ? (
                    <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : delta.isCooler ? (
                    <TrendingDown className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  ) : (
                    <Equal className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span id="comparison-delta-value">
                    {delta.formattedDelta}
                  </span>
                </div>

                <div className="text-xs font-semibold mt-1">
                  {delta.isWarmer
                    ? `${currentCity.name} is ${delta.absDeltaStr} warmer`
                    : delta.isCooler
                    ? `${currentCity.name} is ${delta.absDeltaStr} cooler`
                    : 'Identical temperature'}
                </div>
                <span className="text-[10px] opacity-75 mt-0.5">
                  relative to {comparisonWeather.location.name}
                </span>
              </div>

              {/* Secondary Comparison City */}
              <div
                id="comparison-secondary-city-box"
                className="flex items-center justify-between md:justify-end gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="text-right min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Comparison City
                  </span>
                  <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {comparisonWeather.location.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {comparisonWeather.location.country || ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {comparisonWeather.weatherCode !== undefined && (
                    <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <WeatherIcon
                        code={comparisonWeather.weatherCode}
                        isDay={comparisonWeather.isDay !== 0}
                        size={24}
                      />
                    </div>
                  )}
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatTemp(comparisonWeather.temperature, unit)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Inactive State: Quick Select from Recent Searches */
        <div
          id="comparison-selection-bar"
          className="rounded-xl p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Compare Temperature with Recent Cities:
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                View real-time temperature delta against other searched locations
              </p>
            </div>
          </div>

          {/* Quick Select Buttons from Recent Searches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableCandidates.length > 0 ? (
              <>
                {availableCandidates.slice(0, 4).map((city) => (
                  <button
                    key={`btn-compare-chip-${city.id}-${city.name}`}
                    id={`compare-with-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => onSelectComparisonCity(city)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{city.name}</span>
                  </button>
                ))}

                {/* Dropdown if more than 4 candidates */}
                {availableCandidates.length > 4 && (
                  <select
                    id="more-comparison-cities-select"
                    aria-label="Select more comparison cities"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const found = availableCandidates.find((c) => c.id === Number(e.target.value));
                        if (found) onSelectComparisonCity(found);
                      }
                    }}
                    className="text-xs font-medium py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 focus:outline-hidden cursor-pointer"
                  >
                    <option value="" disabled>
                      More cities...
                    </option>
                    {availableCandidates.slice(4).map((c) => (
                      <option key={`opt-more-${c.id}`} value={c.id}>
                        {c.name}{c.country ? `, ${c.country}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Search more cities to compare temperatures side-by-side
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
