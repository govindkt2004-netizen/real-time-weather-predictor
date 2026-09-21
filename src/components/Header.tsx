import React from 'react';
import {
  CloudSun,
  Moon,
  Sun,
  RotateCw,
  MapPin,
} from 'lucide-react';
import { TemperatureUnit, ThemeMode, ProcessedWeatherData, ComparisonWeather } from '../types';
import { ReportExportMenu } from './ReportExportMenu';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  unit: TemperatureUnit;
  onToggleUnit: () => void;
  onUseMyLocation: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isLocating: boolean;
  weatherData?: ProcessedWeatherData | null;
  comparisonWeather?: ComparisonWeather | null;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  unit,
  onToggleUnit,
  onUseMyLocation,
  onRefresh,
  isLoading,
  isLocating,
  weatherData,
  comparisonWeather,
}) => {
  return (
    <header
      id="app-header"
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                WeatherPulse
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Live API
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Open-Meteo REST Weather Dashboard
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Geo Location Button */}
          <button
            id="use-my-location-btn"
            onClick={onUseMyLocation}
            disabled={isLocating || isLoading}
            title="Use current GPS location"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 transition-colors disabled:opacity-50"
          >
            <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLocating ? 'animate-bounce text-sky-500' : ''}`} />
            <span className="hidden md:inline">Use My Location</span>
            <span className="md:hidden">GPS</span>
          </button>

          {/* Refresh Button */}
          <button
            id="manual-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh current weather"
            aria-label="Refresh weather data"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-500' : ''}`} />
          </button>

          {/* Unit Toggle (°C / °F) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              id="unit-celsius-btn"
              onClick={() => unit !== 'celsius' && onToggleUnit()}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                unit === 'celsius'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              °C
            </button>
            <button
              id="unit-fahrenheit-btn"
              onClick={() => unit !== 'fahrenheit' && onToggleUnit()}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                unit === 'fahrenheit'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              °F
            </button>
          </div>

          {/* Download Offline Weather Report Dropdown */}
          {weatherData && (
            <ReportExportMenu
              weatherData={weatherData}
              unit={unit}
              comparisonWeather={comparisonWeather}
              variant="header"
            />
          )}

          {/* Dark/Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
