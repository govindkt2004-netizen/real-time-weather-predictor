/**
 * Asynchronous JavaScript & RESTful API Service
 * 
 * Demonstrates:
 * 1. fetch() API with HTTP response verification (response.ok)
 * 2. async / await syntax for non-blocking asynchronous requests
 * 3. Structured try ... catch ... finally error propagation
 * 4. Deeply nested JSON parsing and extraction
 * 5. AbortController integration to cancel stale or in-flight requests
 */

import {
  GeocodingResponse,
  GeocodingResult,
  OpenMeteoForecastResponse,
  ProcessedWeatherData,
  HourlyForecastItem,
  DailyForecastItem,
  ComparisonWeather,
} from '../types';
import { evaluateSevereWeatherAlerts } from '../utils/alertDetection';
import { formatSunTime, calculateDaylightDuration } from '../utils/weatherCodes';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Searches cities using Open-Meteo Geocoding REST API
 * 
 * @param query - City name string entered by user
 * @param signal - Optional AbortSignal to cancel previous ongoing searches
 * @returns Array of matching geocoded locations
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  // Input validation
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error('Please enter a city name.');
  }

  // Build the RESTful query URL
  const params = new URLSearchParams({
    name: cleanQuery,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const url = `${GEOCODING_BASE_URL}?${params.toString()}`;

  try {
    // Perform asynchronous HTTP GET request using Fetch API
    const response = await fetch(url, { signal });

    // Verify HTTP response status (200-299)
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Service rate limit reached. Please wait a moment.');
      }
      throw new Error(`Geocoding server responded with status: ${response.status}`);
    }

    // Parse the JSON response body
    const data: GeocodingResponse = await response.json();

    // Check if any locations were returned in the results array
    if (!data.results || data.results.length === 0) {
      throw new Error('City not found. Please try another city.');
    }

    return data.results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error; // Let component handle aborted requests quietly
    }
    if (!navigator.onLine) {
      throw new Error('Unable to connect to the weather service. Please check your network connection.');
    }
    // Re-throw with user-friendly message
    throw new Error(error.message || 'Unable to connect to the weather service.');
  }
}

/**
 * Fetches real-time weather and forecast data from Open-Meteo REST API
 * 
 * @param lat - Latitude in decimal degrees
 * @param lon - Longitude in decimal degrees
 * @param locationMeta - Metadata object of the city (name, country, timezone, etc.)
 * @param signal - Optional AbortSignal
 * @returns ProcessedWeatherData ready for presentation
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  locationMeta: GeocodingResult,
  signal?: AbortSignal
): Promise<ProcessedWeatherData> {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid geographical coordinates provided.');
  }

  // Construct query parameters for all required weather variables
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
    timezone: 'auto',
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;

  try {
    // Asynchronous network fetch
    const response = await fetch(url, { signal });

    // Validate HTTP response code
    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error('Weather API service temporarily unavailable. Please try again later.');
      }
      throw new Error(`Weather service returned error code ${response.status}`);
    }

    // Parse nested JSON payload
    const data: OpenMeteoForecastResponse = await response.json();

    // Verify presence of critical nested data objects
    if (!data.current || !data.hourly || !data.daily) {
      throw new Error('Incomplete weather data received from server.');
    }

    // 1. Process Current Weather
    const current = data.current;
    const now = new Date();
    const localTimeFormatted = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const lastUpdatedFormatted = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Extract daily sunrise and sunset arrays from forecast metadata
    const dailySunrise = data.daily.sunrise || [];
    const dailySunset = data.daily.sunset || [];
    const todaySunriseIso = dailySunrise[0];
    const todaySunsetIso = dailySunset[0];

    // 2. Process Hourly Forecast (slice next 24 hours starting from current hour)
    const hourlyTimes = data.hourly.time || [];
    const hourlyTemps = data.hourly.temperature_2m || [];
    const hourlyHumidity = data.hourly.relative_humidity_2m || [];
    const hourlyPrecipProb = data.hourly.precipitation_probability || [];
    const hourlyWeatherCodes = data.hourly.weather_code || [];
    const hourlyWindSpeed = data.hourly.wind_speed_10m || [];
    const hourlyIsDay = data.hourly.is_day || [];

    // Find the closest hour index in data.hourly.time
    const currentIsoHour = current.time.slice(0, 13); // e.g., '2026-09-20T04'
    let startIndex = hourlyTimes.findIndex(t => t.startsWith(currentIsoHour));
    if (startIndex === -1) startIndex = 0;

    const hourly: HourlyForecastItem[] = [];
    const totalHoursToDisplay = Math.min(24, hourlyTimes.length - startIndex);

    for (let i = 0; i < totalHoursToDisplay; i++) {
      const idx = startIndex + i;
      const rawIso = hourlyTimes[idx];
      const hourDate = new Date(rawIso);
      
      // Determine if hour is daytime
      const hourNumber = hourDate.getHours();
      const isDayHour = hourlyIsDay[idx] !== undefined ? Boolean(hourlyIsDay[idx]) : (hourNumber >= 6 && hourNumber < 19);

      hourly.push({
        time: rawIso,
        formattedTime: i === 0 ? 'Now' : hourDate.toLocaleTimeString([], { hour: 'numeric' }),
        temperature: hourlyTemps[idx] ?? 0,
        humidity: hourlyHumidity[idx] ?? 0,
        precipitationProbability: hourlyPrecipProb[idx] ?? 0,
        weatherCode: hourlyWeatherCodes[idx] ?? 0,
        windSpeed: hourlyWindSpeed[idx] ?? 0,
        isDay: isDayHour,
      });
    }

    // 3. Process 7-Day Forecast with parsed solar sunrise/sunset metadata & 24-hour predictions
    const dailyTimes = data.daily.time || [];
    const dailyWeatherCodes = data.daily.weather_code || [];
    const dailyTempMax = data.daily.temperature_2m_max || [];
    const dailyTempMin = data.daily.temperature_2m_min || [];
    const dailyPrecipProb = data.daily.precipitation_probability_max || [];
    const dailyWindMax = data.daily.wind_speed_10m_max || [];
    const dailyUvMax = data.daily.uv_index_max || [];

    const daily: DailyForecastItem[] = [];
    const daysToCount = Math.min(7, dailyTimes.length);

    for (let i = 0; i < daysToCount; i++) {
      const rawDateStr = dailyTimes[i];
      // Parse YYYY-MM-DD safely
      const [year, month, day] = rawDateStr.split('-').map(Number);
      const dayDate = new Date(year, month - 1, day);

      let dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (i === 0) dayName = 'Today';
      else if (i === 1) dayName = 'Tomorrow';

      const sunriseIso = dailySunrise[i];
      const sunsetIso = dailySunset[i];

      // Extract complete 24-hour prediction for this specific day
      const dayHourly: HourlyForecastItem[] = [];
      for (let h = 0; h < hourlyTimes.length; h++) {
        if (hourlyTimes[h].startsWith(rawDateStr)) {
          const rawIso = hourlyTimes[h];
          const hourDate = new Date(rawIso);
          const hourNumber = hourDate.getHours();
          const isDayHour = hourlyIsDay[h] !== undefined
            ? Boolean(hourlyIsDay[h])
            : (hourNumber >= 6 && hourNumber < 19);

          const isCurrentHourNow = (i === 0 && rawIso.startsWith(currentIsoHour));

          dayHourly.push({
            time: rawIso,
            formattedTime: isCurrentHourNow
              ? 'Now'
              : hourDate.toLocaleTimeString([], { hour: 'numeric' }),
            temperature: hourlyTemps[h] ?? 0,
            humidity: hourlyHumidity[h] ?? 0,
            precipitationProbability: hourlyPrecipProb[h] ?? 0,
            weatherCode: hourlyWeatherCodes[h] ?? 0,
            windSpeed: hourlyWindSpeed[h] ?? 0,
            isDay: isDayHour,
          });
        }
      }

      daily.push({
        date: rawDateStr,
        dayName,
        formattedDate: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weatherCode: dailyWeatherCodes[i] ?? 0,
        tempMax: dailyTempMax[i] ?? 0,
        tempMin: dailyTempMin[i] ?? 0,
        precipitationProbability: dailyPrecipProb[i] ?? 0,
        windSpeedMax: dailyWindMax[i] ?? 0,
        uvIndexMax: dailyUvMax[i] ?? 0,
        sunrise: sunriseIso,
        sunset: sunsetIso,
        formattedSunrise: formatSunTime(sunriseIso),
        formattedSunset: formatSunTime(sunsetIso),
        daylightDuration: calculateDaylightDuration(sunriseIso, sunsetIso) ?? undefined,
        hourly: dayHourly,
      });
    }

    // 4. Process and evaluate Severe Weather Alerts from live API response
    const alerts = evaluateSevereWeatherAlerts(data, locationMeta);

    // Ensure elevation is accurately populated from Open-Meteo elevation model
    const resolvedElevation = locationMeta.elevation ?? (data.elevation !== undefined ? Math.round(data.elevation) : undefined);
    const enrichedLocation: GeocodingResult = {
      ...locationMeta,
      elevation: resolvedElevation,
    };

    return {
      location: enrichedLocation,
      current: {
        temperature: current.temperature_2m,
        apparentTemperature: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        windGusts: current.wind_gusts_10m,
        precipitation: current.precipitation,
        cloudCover: current.cloud_cover,
        pressure: current.surface_pressure,
        weatherCode: current.weather_code,
        isDay: Boolean(current.is_day),
        localTime: localTimeFormatted,
        lastUpdated: lastUpdatedFormatted,
        rawTime: current.time,
        sunrise: todaySunriseIso,
        sunset: todaySunsetIso,
        formattedSunrise: formatSunTime(todaySunriseIso),
        formattedSunset: formatSunTime(todaySunsetIso),
        daylightDuration: calculateDaylightDuration(todaySunriseIso, todaySunsetIso) ?? undefined,
      },
      hourly,
      daily,
      alerts,
      rawResponse: data,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (!navigator.onLine) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    throw new Error(error.message || 'Failed to fetch weather data.');
  }
}

/**
 * Reverse geocodes coordinates to find the nearest city and country
 * Uses OpenStreetMap Nominatim with fallback
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns GeocodingResult metadata
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const cityName =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        data.name ||
        'Current Location';
      const country = addr.country || '';
      const countryCode = (addr.country_code || '').toUpperCase();
      const admin1 = addr.state || addr.region || '';

      return {
        id: Math.round(lat * 1000 + lon),
        name: cityName,
        latitude: lat,
        longitude: lon,
        country,
        country_code: countryCode,
        admin1,
      };
    }
  } catch (e) {
    // Non-fatal, fallback to coordinates
  }

  // Graceful fallback
  return {
    id: Math.round(lat * 1000 + lon),
    name: `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    latitude: lat,
    longitude: lon,
    country: '',
  };
}

/**
 * Fetches lightweight current weather data for a secondary comparison city
 * 
 * @param location - GeocodingResult of the city to compare with
 * @param signal - Optional AbortSignal
 * @returns ComparisonWeather with temperature, apparentTemperature, weatherCode, isDay
 */
export async function fetchComparisonWeather(
  location: GeocodingResult,
  signal?: AbortSignal
): Promise<ComparisonWeather> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day',
    timezone: 'auto',
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch weather data for ${location.name} (HTTP ${response.status})`);
  }

  const data = await response.json();
  const current = data.current;

  if (!current || typeof current.temperature_2m !== 'number') {
    throw new Error(`Invalid comparison response structure for ${location.name}`);
  }

  return {
    location,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    weatherCode: current.weather_code,
    isDay: current.is_day,
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}
