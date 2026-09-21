import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Wind, Calendar } from 'lucide-react';
import { HourlyForecastItem, DailyForecastItem, TemperatureUnit } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { formatTemp } from '../utils/weatherCodes';

interface HourlyForecastProps {
  items: HourlyForecastItem[];
  unit: TemperatureUnit;
  days?: DailyForecastItem[];
  selectedDayIndex?: number;
  onSelectDayIndex?: (index: number) => void;
  selectedDay?: DailyForecastItem;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  items,
  unit,
  days,
  selectedDayIndex = 0,
  onSelectDayIndex,
  selectedDay,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll back to the first hour whenever selected day changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedDayIndex]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  const activeDayName = selectedDay?.dayName || (selectedDayIndex === 0 ? 'Today' : `Day ${selectedDayIndex + 1}`);
  const activeFormattedDate = selectedDay?.formattedDate || '';

  return (
    <section id="hourly-forecast-section" className="my-8">
      {/* Header with Title and Day Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Hourly Forecast
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 px-2.5 py-0.5 rounded-full">
              <Calendar className="w-3 h-3 text-sky-500" />
              <span>{activeDayName}</span>
              {activeFormattedDate && <span className="opacity-75">• {activeFormattedDate}</span>}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedDayIndex === 0
              ? 'Next 24 hours timeline prediction'
              : `24-hour prediction breakdown for ${activeDayName}`}
          </p>
        </div>

        {/* Scroll Nav Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Quick Selector Tabs */}
      {days && days.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-0.5 mb-2 scrollbar-thin">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDayIndex?.(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{day.dayName}</span>
                <span
                  className={`text-[11px] ${
                    isSelected ? 'text-sky-100 font-normal' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day.formattedDate}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Horizontal Scroll Cards Area */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scroll-smooth focus:outline-hidden"
        tabIndex={0}
        aria-label="Hourly weather forecast list"
      >
        {items.map((hour, index) => {
          const isCurrentHour = selectedDayIndex === 0 && (hour.formattedTime === 'Now' || index === 0);

          return (
            <div
              key={hour.time}
              className={`shrink-0 w-28 sm:w-32 rounded-xl p-3.5 flex flex-col items-center justify-between border transition-all text-center ${
                isCurrentHour
                  ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Time */}
              <div
                className={`text-xs font-semibold ${
                  isCurrentHour ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {hour.formattedTime}
              </div>

              {/* Weather Icon */}
              <div className="my-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <WeatherIcon code={hour.weatherCode} isDay={hour.isDay} size={28} />
              </div>

              {/* Temperature */}
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formatTemp(hour.temperature, unit)}
              </div>

              {/* Rain Probability */}
              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                <Droplets className="w-3 h-3 shrink-0" />
                <span>{hour.precipitationProbability}%</span>
              </div>

              {/* Wind Speed */}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <Wind className="w-2.5 h-2.5 shrink-0" />
                <span>
                  {unit === 'fahrenheit'
                    ? `${Math.round(hour.windSpeed * 0.621371)} mph`
                    : `${Math.round(hour.windSpeed)} km/h`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
