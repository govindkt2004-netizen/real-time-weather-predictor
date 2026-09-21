import React from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sunrise,
  Sunset,
  SunMedium,
  ArrowLeftRight,
} from 'lucide-react';
import {
  ProcessedWeatherData,
  TemperatureUnit,
  GeocodingResult,
  ComparisonWeather,
} from '../types';
import { WeatherIcon } from './WeatherIcon';
import { TemperatureComparison } from './TemperatureComparison';
import { ReportExportMenu } from './ReportExportMenu';
import { WeatherAtmosphereAnimation } from './WeatherAtmosphereAnimation';
import { getWeatherCondition, formatTemp, calculateTempDelta } from '../utils/weatherCodes';

interface CurrentWeatherCardProps {
  data: ProcessedWeatherData;
  unit: TemperatureUnit;
  recentSearches?: GeocodingResult[];
  comparisonWeather?: ComparisonWeather | null;
  isLoadingComparison?: boolean;
  comparisonError?: string | null;
  onSelectComparisonCity?: (city: GeocodingResult | null) => void;
  onSwapCities?: () => void;
  onRetryComparison?: () => void;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  data,
  unit,
  recentSearches = [],
  comparisonWeather = null,
  isLoadingComparison = false,
  comparisonError = null,
  onSelectComparisonCity,
  onSwapCities,
  onRetryComparison,
}) => {
  const { location, current, daily } = data;
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const todayForecast = daily[0];

  // Resolve sunrise and sunset parsed from daily forecast metadata
  const sunriseDisplay = current.formattedSunrise || todayForecast?.formattedSunrise || '--:--';
  const sunsetDisplay = current.formattedSunset || todayForecast?.formattedSunset || '--:--';
  const daylightDisplay = current.daylightDuration || todayForecast?.daylightDuration;

  // Calculate live delta if comparison city is available
  const tempDelta = comparisonWeather
    ? calculateTempDelta(current.temperature, comparisonWeather.temperature, unit)
    : null;

  const fullLocationName = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(', ');

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      id="current-weather-card"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-all"
    >
      {/* Subtle CSS Weather Condition Atmosphere Particles (Snow, Rain, Drizzle, Sun shimmer, Fog) */}
      <WeatherAtmosphereAnimation
        weatherCode={current.weatherCode}
        isDay={current.isDay}
      />

      {/* Background Weather Accent Glow */}
      <div
        className={`absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-3xl opacity-10 dark:opacity-20 pointer-events-none ${
          current.isDay ? 'bg-sky-400' : 'bg-indigo-500'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left: Location & Time Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs tracking-wide uppercase">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{location.country ? location.country : 'Live Location'}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E
              </span>
            </div>

            {/* Offline Report Download Menu */}
            <div className="block">
              <ReportExportMenu
                weatherData={data}
                unit={unit}
                comparisonWeather={comparisonWeather}
                variant="card"
              />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {location.name}
            {location.country && location.country !== location.name && (
              <span className="text-lg sm:text-xl font-normal text-slate-500 dark:text-slate-400 ml-2">
                {location.country}
              </span>
            )}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDateFormatted}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Local Time: <span className="font-medium text-slate-800 dark:text-slate-200">{current.localTime}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Temperature & Weather Condition */}
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Weather Icon with animated visual bounce */}
          <div className="flex flex-col items-center">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 shadow-inner">
              <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={56} className="sm:w-16 sm:h-16" />
            </div>
            <span className="mt-2 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 text-center">
              {condition.description}
            </span>
          </div>

          {/* Temperature & Feels Like */}
          <div className="text-right">
            <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatTemp(current.temperature, unit)}
            </div>

            <div className="mt-1 space-y-1">
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Feels like{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatTemp(current.apparentTemperature, unit)}
                </span>
              </div>

              {todayForecast && (
                <div className="flex items-center justify-end gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center text-rose-500">
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                    {formatTemp(todayForecast.tempMax, unit)}
                  </span>
                  <span className="flex items-center text-sky-500">
                    <ArrowDown className="w-3 h-3 mr-0.5" />
                    {formatTemp(todayForecast.tempMin, unit)}
                  </span>
                </div>
              )}

              {/* Temperature Delta Badge on Main Card */}
              {comparisonWeather && !isLoadingComparison && tempDelta && (
                <div className="flex justify-end mt-1.5">
                  <span
                    id="main-card-temp-delta-badge"
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono transition-all ${
                      tempDelta.isWarmer
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : tempDelta.isCooler
                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                    title={`Temperature difference between ${location.name} and ${comparisonWeather.location.name}`}
                  >
                    <ArrowLeftRight className="w-3 h-3 shrink-0" />
                    <span>{tempDelta.formattedDelta} vs {comparisonWeather.location.name}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Temperature Comparison Section */}
      {onSelectComparisonCity && (
        <TemperatureComparison
          currentCity={location}
          currentTempC={current.temperature}
          unit={unit}
          recentSearches={recentSearches}
          comparisonWeather={comparisonWeather}
          isLoadingComparison={isLoadingComparison}
          comparisonError={comparisonError}
          onSelectComparisonCity={onSelectComparisonCity}
          onSwapCities={onSwapCities}
          onRetryComparison={onRetryComparison}
        />
      )}

      {/* Local Solar Schedule: Sunrise & Sunset times parsed from daily forecast metadata */}
      <div
        id="current-weather-solar-strip"
        className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {/* Sunrise */}
        <div
          id="current-sunrise-pill"
          className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-400/80">
                Sunrise
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                {sunriseDisplay}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/70">
            Dawn
          </span>
        </div>

        {/* Sunset */}
        <div
          id="current-sunset-pill"
          className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-800/80 dark:text-indigo-400/80">
                Sunset
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                {sunsetDisplay}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-indigo-700/70 dark:text-indigo-400/70">
            Dusk
          </span>
        </div>

        {/* Daylight Duration & Solar Position */}
        <div
          id="current-daylight-pill"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daylight Length
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                {daylightDisplay || '12h 00m'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            {current.isDay ? 'Daytime' : 'Nighttime'}
          </span>
        </div>
      </div>

      {/* Footer bar with Last updated & Data freshness */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate max-w-md">
          Region: <span className="font-medium text-slate-700 dark:text-slate-300">{fullLocationName}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Last updated: {current.lastUpdated}
        </span>
      </div>
    </div>
  );
};
