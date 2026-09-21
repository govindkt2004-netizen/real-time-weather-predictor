/**
 * Real-Time Weather Dashboard Types
 * Aligned with Open-Meteo Geocoding & Forecast REST APIs
 */

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

export interface OpenMeteoCurrent {
  time: string;
  interval?: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m?: number;
}

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  surface_pressure?: number[];
  wind_speed_10m: number[];
  wind_gusts_10m?: number[];
  is_day?: number[];
}

export interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  uv_index_max?: number[];
  sunrise?: string[];
  sunset?: string[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
}

export interface HourlyForecastItem {
  time: string;
  formattedTime: string;
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  formattedDate: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise?: string;
  sunset?: string;
  formattedSunrise?: string;
  formattedSunset?: string;
  daylightDuration?: string;
  hourly?: HourlyForecastItem[];
}

export type AlertSeverity = 'advisory' | 'warning' | 'severe' | 'extreme';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  effective: string;
  expires?: string;
  source: string;
  metricTrigger?: {
    label: string;
    value: string;
    threshold: string;
  };
  isSimulated?: boolean;
}

export interface ProcessedWeatherData {
  location: GeocodingResult;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windGusts?: number;
    precipitation: number;
    cloudCover: number;
    pressure: number;
    weatherCode: number;
    isDay: boolean;
    localTime: string;
    lastUpdated: string;
    rawTime: string;
    sunrise?: string;
    sunset?: string;
    formattedSunrise?: string;
    formattedSunset?: string;
    daylightDuration?: string;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
  rawResponse?: OpenMeteoForecastResponse;
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type ThemeMode = 'light' | 'dark';

export interface WeatherConditionDetails {
  description: string;
  iconName: string;
  colorClass: string;
  bgGradient: string;
}

export interface ComparisonWeather {
  location: GeocodingResult;
  temperature: number; // in Celsius
  apparentTemperature?: number;
  weatherCode?: number;
  isDay?: number;
  lastUpdated?: string;
}
