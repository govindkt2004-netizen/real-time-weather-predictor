import React from 'react';
import {
  Droplets,
  Wind,
  Compass,
  Cloud,
  CloudRain,
  Gauge,
  Sun,
  Eye,
} from 'lucide-react';
import { ProcessedWeatherData, TemperatureUnit } from '../types';
import {
  getWindDirectionCardinal,
  getHumidityComfort,
  getUvCategory,
} from '../utils/weatherCodes';

interface WeatherMetricsGridProps {
  data: ProcessedWeatherData;
  unit: TemperatureUnit;
}

export const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({ data, unit }) => {
  const { current, daily } = data;
  const humidityComfort = getHumidityComfort(current.humidity);
  const cardinalDirection = getWindDirectionCardinal(current.windDirection);
  const todayUv = daily[0]?.uvIndexMax ?? 0;
  const uvCategory = getUvCategory(todayUv);

  // Speed unit: km/h or mph
  const windSpeedDisplay =
    unit === 'fahrenheit'
      ? `${(current.windSpeed * 0.621371).toFixed(1)} mph`
      : `${current.windSpeed.toFixed(1)} km/h`;

  const precipitationDisplay =
    unit === 'fahrenheit'
      ? `${(current.precipitation * 0.0393701).toFixed(2)} in`
      : `${current.precipitation.toFixed(1)} mm`;

  const metrics = [
    {
      id: 'metric-humidity',
      title: 'Relative Humidity',
      value: `${current.humidity}%`,
      subtitle: humidityComfort.label,
      subtitleColor: humidityComfort.color,
      icon: Droplets,
      iconColor: 'text-sky-500',
      progress: current.humidity,
      progressMax: 100,
      description: 'Moisture content of surrounding air',
    },
    {
      id: 'metric-wind',
      title: 'Wind Speed & Direction',
      value: windSpeedDisplay,
      subtitle: `${cardinalDirection} (${current.windDirection}°)`,
      subtitleColor: 'text-slate-700 dark:text-slate-300',
      icon: Wind,
      iconColor: 'text-teal-500',
      compassRotation: current.windDirection,
      description: 'Surface wind velocity at 10m height',
    },
    {
      id: 'metric-precipitation',
      title: 'Precipitation',
      value: precipitationDisplay,
      subtitle: current.precipitation > 0 ? 'Active Precipitation' : 'No Rain Detected',
      subtitleColor: current.precipitation > 0 ? 'text-blue-500' : 'text-slate-400',
      icon: CloudRain,
      iconColor: 'text-blue-500',
      description: 'Liquid equivalent accumulated in past hour',
    },
    {
      id: 'metric-cloud-cover',
      title: 'Cloud Cover',
      value: `${current.cloudCover}%`,
      subtitle:
        current.cloudCover < 20
          ? 'Clear Skies'
          : current.cloudCover < 70
          ? 'Scattered Clouds'
          : 'Overcast Skies',
      subtitleColor: 'text-slate-600 dark:text-slate-400',
      icon: Cloud,
      iconColor: 'text-indigo-400',
      progress: current.cloudCover,
      progressMax: 100,
      description: 'Fraction of sky obscured by clouds',
    },
    {
      id: 'metric-pressure',
      title: 'Atmospheric Pressure',
      value: `${Math.round(current.pressure)} hPa`,
      subtitle:
        current.pressure > 1013
          ? 'High Pressure System'
          : current.pressure < 1000
          ? 'Low Pressure System'
          : 'Standard Barometric',
      subtitleColor: 'text-slate-600 dark:text-slate-400',
      icon: Gauge,
      iconColor: 'text-amber-500',
      description: 'Surface barometric air pressure',
    },
    {
      id: 'metric-uv-index',
      title: 'Peak UV Index',
      value: todayUv.toFixed(1),
      subtitle: `${uvCategory.label} Exposure`,
      subtitleColor: uvCategory.color,
      icon: Sun,
      iconColor: 'text-amber-500',
      progress: Math.min(100, (todayUv / 12) * 100),
      progressMax: 100,
      description: 'Solar ultraviolet radiation intensity',
    },
  ];

  return (
    <section id="weather-metrics-section" className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Current Atmospheric Conditions
        </h3>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          6 Live Sensor Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              id={metric.id}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {metric.title}
                </span>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <Icon className={`w-4 h-4 ${metric.iconColor}`} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {metric.value}
                </span>

                {metric.compassRotation !== undefined && (
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title={`Wind pointing to ${metric.compassRotation}°`}
                  >
                    <Compass
                      className="w-4 h-4 transition-transform"
                      style={{ transform: `rotate(${metric.compassRotation}deg)` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={`font-medium ${metric.subtitleColor}`}>
                  {metric.subtitle}
                </span>
              </div>

              {metric.progress !== undefined && (
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, metric.progress))}%` }}
                  />
                </div>
              )}

              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
