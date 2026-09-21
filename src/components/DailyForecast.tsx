import React from 'react';
import { Droplets, Wind, ArrowUp, ArrowDown, ChevronRight, Clock } from 'lucide-react';
import { DailyForecastItem, TemperatureUnit } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherCondition, formatTemp } from '../utils/weatherCodes';

interface DailyForecastProps {
  items: DailyForecastItem[];
  unit: TemperatureUnit;
  selectedDayIndex?: number;
  onSelectDay?: (index: number) => void;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  items,
  unit,
  selectedDayIndex = 0,
  onSelectDay,
}) => {
  if (!items || items.length === 0) return null;

  // Calculate overall min and max for rendering temperature range bars
  const globalMin = Math.min(...items.map((i) => i.tempMin));
  const globalMax = Math.max(...items.map((i) => i.tempMax));
  const tempRange = Math.max(1, globalMax - globalMin);

  return (
    <section id="daily-forecast-section" className="my-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            7-Day Extended Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any day to view its detailed 24-hour prediction above
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Click row for 24h timeline</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
        {items.map((day, index) => {
          const isSelected = selectedDayIndex === index;
          const condition = getWeatherCondition(day.weatherCode, true);

          // Calculate percentage offsets for min-max bar
          const leftPercent = ((day.tempMin - globalMin) / tempRange) * 100;
          const barWidthPercent = Math.max(12, ((day.tempMax - day.tempMin) / tempRange) * 100);

          return (
            <div
              key={day.date}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelectDay?.(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDay?.(index);
                }
              }}
              className={`px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isSelected
                  ? 'bg-sky-50/80 dark:bg-sky-950/40 border-l-4 border-l-sky-500 shadow-xs'
                  : 'border-l-4 border-l-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Day & Date & Condition */}
              <div className="flex items-center gap-3 sm:gap-4 sm:w-1/3">
                <div className="w-16 sm:w-20">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`block text-sm font-bold transition-colors ${
                        isSelected
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-400 dark:text-slate-500">
                    {day.formattedDate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-sky-100/70 dark:bg-sky-900/60'
                        : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <WeatherIcon code={day.weatherCode} isDay={true} size={24} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] sm:max-w-none">
                    {condition.description}
                  </span>
                </div>
              </div>

              {/* Rain Probability & Wind */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 sm:w-1/4 justify-start sm:justify-center">
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                  <Droplets className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.precipitationProbability}%</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Wind className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {unit === 'fahrenheit'
                      ? `${Math.round(day.windSpeedMax * 0.621371)} mph`
                      : `${Math.round(day.windSpeedMax)} km/h`}
                  </span>
                </div>

                {/* Selected Status Badge */}
                {isSelected && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                    Viewing 24h
                  </span>
                )}
              </div>

              {/* Temperature Min / Max Bar & Action Indicator */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-5/12">
                <span className="flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 w-12 text-right">
                  <ArrowDown className="w-3 h-3 inline mr-0.5" />
                  {formatTemp(day.tempMin, unit)}
                </span>

                {/* Progress bar visualizer */}
                <div className="hidden sm:block flex-1 max-w-[140px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${barWidthPercent}%`,
                    }}
                  />
                </div>

                <span className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 w-12 text-right">
                  <ArrowUp className="w-3 h-3 inline mr-0.5" />
                  {formatTemp(day.tempMax, unit)}
                </span>

                {/* Chevron icon indicating clickability */}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isSelected
                      ? 'text-sky-500 translate-x-0.5'
                      : 'text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
