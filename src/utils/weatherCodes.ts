/**
 * WMO Weather interpretation codes (WW)
 * Code Table 4677 according to Open-Meteo Documentation
 */

export interface WeatherConditionInfo {
  code: number;
  description: string;
  icon: 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'cloud-fog' | 'cloud-drizzle' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning' | 'snowflake';
  color: string;
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        code,
        description: isDay ? 'Clear Sky' : 'Clear Night',
        icon: isDay ? 'sun' : 'moon',
        color: isDay ? 'text-amber-500' : 'text-indigo-400',
      };
    case 1:
      return {
        code,
        description: isDay ? 'Mainly Clear' : 'Mainly Clear Night',
        icon: isDay ? 'cloud-sun' : 'cloud-moon',
        color: isDay ? 'text-amber-400' : 'text-indigo-300',
      };
    case 2:
      return {
        code,
        description: 'Partly Cloudy',
        icon: isDay ? 'cloud-sun' : 'cloud-moon',
        color: isDay ? 'text-sky-500' : 'text-slate-400',
      };
    case 3:
      return {
        code,
        description: 'Overcast',
        icon: 'cloud',
        color: 'text-slate-500 dark:text-slate-400',
      };
    case 45:
      return {
        code,
        description: 'Foggy',
        icon: 'cloud-fog',
        color: 'text-neutral-500 dark:text-neutral-400',
      };
    case 48:
      return {
        code,
        description: 'Depositing Rime Fog',
        icon: 'cloud-fog',
        color: 'text-neutral-500 dark:text-neutral-400',
      };
    case 51:
      return {
        code,
        description: 'Light Drizzle',
        icon: 'cloud-drizzle',
        color: 'text-cyan-500',
      };
    case 53:
      return {
        code,
        description: 'Moderate Drizzle',
        icon: 'cloud-drizzle',
        color: 'text-cyan-600',
      };
    case 55:
      return {
        code,
        description: 'Dense Drizzle',
        icon: 'cloud-drizzle',
        color: 'text-cyan-700 dark:text-cyan-400',
      };
    case 56:
    case 57:
      return {
        code,
        description: 'Freezing Drizzle',
        icon: 'cloud-snow',
        color: 'text-teal-500',
      };
    case 61:
      return {
        code,
        description: 'Slight Rain',
        icon: 'cloud-rain',
        color: 'text-blue-500',
      };
    case 63:
      return {
        code,
        description: 'Moderate Rain',
        icon: 'cloud-rain',
        color: 'text-blue-600',
      };
    case 65:
      return {
        code,
        description: 'Heavy Rain',
        icon: 'cloud-rain',
        color: 'text-blue-700 dark:text-blue-400',
      };
    case 66:
    case 67:
      return {
        code,
        description: 'Freezing Rain',
        icon: 'cloud-snow',
        color: 'text-cyan-600',
      };
    case 71:
      return {
        code,
        description: 'Slight Snow Fall',
        icon: 'snowflake',
        color: 'text-sky-300',
      };
    case 73:
      return {
        code,
        description: 'Moderate Snow Fall',
        icon: 'snowflake',
        color: 'text-sky-200',
      };
    case 75:
      return {
        code,
        description: 'Heavy Snow Fall',
        icon: 'snowflake',
        color: 'text-slate-100',
      };
    case 77:
      return {
        code,
        description: 'Snow Grains',
        icon: 'snowflake',
        color: 'text-sky-300',
      };
    case 80:
      return {
        code,
        description: 'Slight Rain Showers',
        icon: 'cloud-rain',
        color: 'text-blue-500',
      };
    case 81:
      return {
        code,
        description: 'Moderate Rain Showers',
        icon: 'cloud-rain',
        color: 'text-blue-600',
      };
    case 82:
      return {
        code,
        description: 'Violent Rain Showers',
        icon: 'cloud-rain',
        color: 'text-indigo-600 dark:text-indigo-400',
      };
    case 85:
    case 86:
      return {
        code,
        description: 'Snow Showers',
        icon: 'cloud-snow',
        color: 'text-sky-400',
      };
    case 95:
      return {
        code,
        description: 'Thunderstorm',
        icon: 'cloud-lightning',
        color: 'text-amber-600 dark:text-amber-400',
      };
    case 96:
    case 99:
      return {
        code,
        description: 'Thunderstorm with Hail',
        icon: 'cloud-lightning',
        color: 'text-red-500 dark:text-red-400',
      };
    default:
      return {
        code,
        description: 'Variable Weather',
        icon: isDay ? 'cloud-sun' : 'cloud-moon',
        color: 'text-slate-500',
      };
  }
}

/**
 * Converts wind direction degrees into 16-point cardinal compass string
 */
export function getWindDirectionCardinal(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Converts Celsius to Fahrenheit
 */
export function toFahrenheit(celsius: number): number {
  return Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
}

/**
 * Formats temperature value according to user unit preference
 */
export function formatTemp(celsius: number | undefined, unit: 'celsius' | 'fahrenheit'): string {
  if (celsius === undefined || isNaN(celsius)) return '--';
  const val = unit === 'fahrenheit' ? toFahrenheit(celsius) : Math.round(celsius * 10) / 10;
  return `${Math.round(val)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

/**
 * Categorize UV index severity
 */
export function getUvCategory(uv: number): { label: string; color: string } {
  if (uv < 3) return { label: 'Low', color: 'text-emerald-500' };
  if (uv < 6) return { label: 'Moderate', color: 'text-amber-500' };
  if (uv < 8) return { label: 'High', color: 'text-orange-500' };
  if (uv < 11) return { label: 'Very High', color: 'text-rose-500' };
  return { label: 'Extreme', color: 'text-purple-500' };
}

/**
 * Categorize Humidity comfort level
 */
export function getHumidityComfort(humidity: number): { label: string; color: string } {
  if (humidity < 30) return { label: 'Dry air', color: 'text-amber-500' };
  if (humidity <= 60) return { label: 'Comfortable', color: 'text-emerald-500' };
  if (humidity <= 75) return { label: 'Humid', color: 'text-sky-500' };
  return { label: 'Very humid', color: 'text-indigo-500' };
}

/**
 * Format local ISO timestamp to clean 12-hour AM/PM time representation
 * e.g. '2026-09-20T06:08' -> '6:08 AM', '2026-09-20T18:17' -> '6:17 PM'
 */
export function formatSunTime(isoStr?: string): string {
  if (!isoStr) return '--:--';
  const parts = isoStr.split('T');
  const timePart = parts.length > 1 ? parts[1] : parts[0];
  const [hStr, mStr] = timePart.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timePart;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Calculates total daylight duration between sunrise and sunset
 */
export function calculateDaylightDuration(sunriseIso?: string, sunsetIso?: string): string | null {
  if (!sunriseIso || !sunsetIso) return null;
  const riseTime = sunriseIso.includes('T') ? sunriseIso.split('T')[1] : sunriseIso;
  const setTime = sunsetIso.includes('T') ? sunsetIso.split('T')[1] : sunsetIso;

  const [riseH, riseM] = riseTime.split(':').map(Number);
  const [setH, setM] = setTime.split(':').map(Number);
  if (isNaN(riseH) || isNaN(riseM) || isNaN(setH) || isNaN(setM)) return null;

  let diffMinutes = setH * 60 + setM - (riseH * 60 + riseM);
  if (diffMinutes < 0) diffMinutes += 24 * 60;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes < 10 ? `0${minutes}` : minutes}m`;
}

/**
 * Calculates temperature difference and formatted delta between current and comparison city
 */
export function calculateTempDelta(
  currentC: number,
  comparisonC: number,
  unit: 'celsius' | 'fahrenheit'
): {
  deltaValue: number;
  formattedDelta: string;
  isWarmer: boolean;
  isCooler: boolean;
  isEqual: boolean;
  absDeltaStr: string;
} {
  const currentVal = unit === 'fahrenheit' ? toFahrenheit(currentC) : currentC;
  const compVal = unit === 'fahrenheit' ? toFahrenheit(comparisonC) : comparisonC;
  const rawDiff = currentVal - compVal;
  const roundedDiff = Math.round(rawDiff * 10) / 10;
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  if (Math.abs(roundedDiff) < 0.5) {
    return {
      deltaValue: 0,
      formattedDelta: `0${unitSymbol}`,
      isWarmer: false,
      isCooler: false,
      isEqual: true,
      absDeltaStr: `0${unitSymbol}`,
    };
  }

  const isWarmer = roundedDiff > 0;
  const isCooler = roundedDiff < 0;
  const absDiff = Math.abs(Math.round(roundedDiff));

  return {
    deltaValue: roundedDiff,
    formattedDelta: `${isWarmer ? '+' : '-'}${absDiff}${unitSymbol}`,
    isWarmer,
    isCooler,
    isEqual: false,
    absDeltaStr: `${absDiff}${unitSymbol}`,
  };
}

