import {
  OpenMeteoForecastResponse,
  GeocodingResult,
  WeatherAlert,
  AlertSeverity,
} from '../types';

/**
 * Priority ranking for weather alert severity levels
 */
const SEVERITY_RANK: Record<AlertSeverity, number> = {
  extreme: 4,
  severe: 3,
  warning: 2,
  advisory: 1,
};

/**
 * Inspects the Open-Meteo REST API response object for severe weather flags,
 * meteorological hazard thresholds, and upcoming dangerous weather phenomena.
 * 
 * @param data - Full raw Open-Meteo forecast API response
 * @param location - Geocoding metadata for contextual reporting
 * @returns Array of active WeatherAlert items sorted by severity
 */
export function evaluateSevereWeatherAlerts(
  data: OpenMeteoForecastResponse,
  location: GeocodingResult
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const current = data.current;
  if (!current) return alerts;

  const nowIso = current.time || new Date().toISOString();
  const effectiveTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cityName = location.name || 'Current Area';

  // 1. Check for explicit API alert flags (if provided by extended proxy or custom API wrapper)
  const rawAny = data as any;
  if (Array.isArray(rawAny.alerts) && rawAny.alerts.length > 0) {
    for (const rawAlert of rawAny.alerts) {
      alerts.push({
        id: rawAlert.id || `api-alert-${Math.random().toString(36).substring(2, 8)}`,
        severity: (rawAlert.severity || 'warning').toLowerCase() as AlertSeverity,
        event: rawAlert.event || 'Severe Weather Notification',
        headline: rawAlert.headline || rawAlert.event || 'Weather Warning Issued',
        description: rawAlert.description || 'Severe meteorological conditions detected in active observation.',
        instruction: rawAlert.instruction || 'Follow local authority directives and take necessary precautions.',
        effective: rawAlert.effective || effectiveTime,
        expires: rawAlert.expires,
        source: rawAlert.sender_name || 'Meteorological Alert Feed',
      });
    }
  }

  // 2. Weather Code (WMO Standard) Severe Hazard Analysis
  const code = current.weather_code;

  if (code === 96 || code === 99) {
    alerts.push({
      id: `wmo-hail-thunderstorm-${code}`,
      severity: 'extreme',
      event: 'Severe Thunderstorm & Damaging Hail Warning',
      headline: `Destructive Thunderstorm with Hail in ${cityName}`,
      description:
        'Live meteorological observation reports violent convective thunderstorm activity with significant hail risk and intense electrical discharges.',
      instruction:
        'Seek substantial shelter immediately. Stay indoors, away from windows, and disconnect sensitive electronics. Avoid driving during hail bursts.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 96/99 Observation Flag)',
      metricTrigger: {
        label: 'WMO Severe Code',
        value: `${code} (Severe Thunderstorm + Hail)`,
        threshold: '96 / 99 Convective Threshold',
      },
    });
  } else if (code === 95) {
    alerts.push({
      id: 'wmo-thunderstorm-95',
      severity: 'severe',
      event: 'Severe Thunderstorm Warning',
      headline: `Active Thunderstorm System over ${cityName}`,
      description:
        'Convective storm cells detected with frequent cloud-to-ground lightning and torrential localized downpours.',
      instruction:
        'Move indoors immediately. Avoid open fields, elevated terrain, and tall isolated trees. Suspend outdoor water activities.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 95 Observation Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Thunderstorm Active)`,
        threshold: '95 Thunderstorm Threshold',
      },
    });
  } else if (code === 82) {
    alerts.push({
      id: 'wmo-violent-rain-82',
      severity: 'warning',
      event: 'Violent Rain Showers & Flash Flood Watch',
      headline: `Torrential Rain Showers in ${cityName}`,
      description:
        'Violent convective rain showers detected. High precipitation rates can produce rapid localized water ponding and sudden loss of road traction.',
      instruction:
        'Exercise high caution on roads. Never attempt to drive across flooded road dips or underpasses.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 82 Observation Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Violent Rain Shower)`,
        threshold: '82 High-Rate Convective Precipitation',
      },
    });
  } else if (code === 65) {
    alerts.push({
      id: 'wmo-heavy-rain-65',
      severity: 'warning',
      event: 'Heavy Continuous Rain Advisory',
      headline: `Sustained Heavy Rainfall across ${cityName}`,
      description:
        'Continuous heavy rainfall observed. Prolonged precipitation may saturate soil and overwhelm urban storm drainage.',
      instruction:
        'Allow extra commuting time. Drive with headlights on and maintain safe following distances.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 65 Observation Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Heavy Continuous Rain)`,
        threshold: '65 Heavy Precipitation Flag',
      },
    });
  } else if (code === 75 || code === 86) {
    alerts.push({
      id: `wmo-blizzard-${code}`,
      severity: 'severe',
      event: 'Heavy Snowfall & Blizzard Warning',
      headline: `Heavy Snow & Blowing Snow Warning for ${cityName}`,
      description:
        'Intense snowfall rates and drifting snow are causing severe visibility reduction and icy road accumulation.',
      instruction:
        'Avoid non-essential road travel. If travel is unavoidable, ensure emergency vehicle supplies (blankets, flashlight, charger) are onboard.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 75/86 Observation Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Heavy Snowfall)`,
        threshold: '75 / 86 Winter Storm Threshold',
      },
    });
  } else if (code === 56 || code === 57 || code === 66 || code === 67) {
    alerts.push({
      id: `wmo-freezing-rain-${code}`,
      severity: 'severe',
      event: 'Ice Storm & Freezing Rain Warning',
      headline: `Freezing Rain & Glaze Ice Hazard in ${cityName}`,
      description:
        'Precipitation is freezing upon contact with cold surface infrastructure, creating hazardous black ice coats on roads, sidewalks, and utility lines.',
      instruction:
        'Road conditions are treacherous. Postpone highway transit and watch for falling iced tree branches.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 56-67 Freezing Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Freezing Precipitation)`,
        threshold: '56-67 Freezing Rain Threshold',
      },
    });
  } else if (code === 48) {
    alerts.push({
      id: 'wmo-rime-fog-48',
      severity: 'advisory',
      event: 'Dense Freezing Fog Advisory',
      headline: `Dense Fog & Reduced Visibility in ${cityName}`,
      description:
        'Depositing rime fog is reducing horizontal visibility to near zero with potential slick patches on elevated bridges.',
      instruction:
        'Slow down significantly, utilize low-beam fog lights, and avoid sudden braking maneuvers.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (WMO 48 Observation Flag)',
      metricTrigger: {
        label: 'WMO Weather Code',
        value: `${code} (Dense Depositing Fog)`,
        threshold: '48 Visibility Threshold',
      },
    });
  }

  // 3. Wind Hazards (Gale & Storm Winds)
  const windSpeed = current.wind_speed_10m ?? 0;
  const windGusts = current.wind_gusts_10m ?? windSpeed;

  if (windSpeed >= 65 || windGusts >= 75) {
    alerts.push({
      id: 'high-wind-storm-warning',
      severity: 'extreme',
      event: 'Storm Force / High Wind Warning',
      headline: `Damaging Winds Active in ${cityName} (Gusts up to ${Math.round(windGusts)} km/h)`,
      description:
        'Dangerous high-velocity wind gusts capable of downing power lines, breaking tree branches, and damaging lightweight outdoor structures.',
      instruction:
        'Secure or store all loose outdoor furniture and trash receptacles. High-profile vehicles should stay off exposed bridges.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Anemometer Wind Threshold)',
      metricTrigger: {
        label: 'Sustained / Gust Wind',
        value: `${windSpeed.toFixed(1)} km/h (Gusts: ${windGusts.toFixed(1)} km/h)`,
        threshold: '>= 65 km/h sustained or >= 75 km/h gusts',
      },
    });
  } else if (windSpeed >= 45 || windGusts >= 55) {
    alerts.push({
      id: 'gale-wind-advisory',
      severity: 'warning',
      event: 'Gale Wind Advisory',
      headline: `Strong Gusty Winds in ${cityName} (${Math.round(windSpeed)} km/h)`,
      description:
        'Elevated wind speeds may cause challenging driving conditions for high-sided vehicles and displace unsecured light objects.',
      instruction:
        'Fasten light outdoor items and exercise caution when driving in open areas or across elevated viaducts.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Anemometer Wind Threshold)',
      metricTrigger: {
        label: 'Wind Speed',
        value: `${windSpeed.toFixed(1)} km/h (Gusts: ${windGusts.toFixed(1)} km/h)`,
        threshold: '>= 45 km/h sustained or >= 55 km/h gusts',
      },
    });
  }

  // 4. Extreme Temperature Hazards
  const temp = current.temperature_2m;
  const apparentTemp = current.apparent_temperature;

  if (apparentTemp >= 40 || temp >= 38) {
    alerts.push({
      id: 'excessive-heat-warning',
      severity: 'extreme',
      event: 'Excessive Heat Warning',
      headline: `Dangerous Extreme Heat Index in ${cityName} (${Math.round(apparentTemp)}°C)`,
      description:
        'Critically high temperatures and humidity produce a dangerous heat index. High risk of heat exhaustion, dehydration, and life-threatening heat stroke.',
      instruction:
        'Stay inside air-conditioned rooms during peak sunlight. Drink copious water and check frequently on elderly neighbors and pets. Never leave anyone in parked vehicles.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Biometeorological Heat Index)',
      metricTrigger: {
        label: 'Heat Index (Apparent)',
        value: `${apparentTemp.toFixed(1)}°C (Air: ${temp.toFixed(1)}°C)`,
        threshold: '>= 40°C Heat Index Threshold',
      },
    });
  } else if (apparentTemp >= 36 || temp >= 35) {
    alerts.push({
      id: 'heat-advisory',
      severity: 'advisory',
      event: 'Heat Advisory',
      headline: `Elevated Heat & Humidity in ${cityName} (${Math.round(apparentTemp)}°C)`,
      description:
        'Warm temperatures combined with relative humidity may lead to heat stress during extended outdoor physical labor.',
      instruction:
        'Reschedule strenuous outdoor workouts to early morning or evening hours. Stay hydrated and take shade breaks.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Apparent Temperature Metric)',
      metricTrigger: {
        label: 'Apparent Temperature',
        value: `${apparentTemp.toFixed(1)}°C`,
        threshold: '>= 36°C Apparent Temp Threshold',
      },
    });
  } else if (apparentTemp <= -20 || temp <= -15) {
    alerts.push({
      id: 'extreme-cold-warning',
      severity: 'severe',
      event: 'Extreme Cold & Wind Chill Warning',
      headline: `Dangerous Sub-Zero Wind Chill in ${cityName} (${Math.round(apparentTemp)}°C)`,
      description:
        'Critically low temperatures and wind chill can cause frostbite on exposed skin in less than 20 minutes and lead to hypothermia.',
      instruction:
        'Wear multiple insulated thermal layers, cover face and hands, and limit outdoor exposure time. Ensure home heating pipes are insulated.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Wind Chill / Thermal Index)',
      metricTrigger: {
        label: 'Wind Chill / Apparent Temp',
        value: `${apparentTemp.toFixed(1)}°C (Air: ${temp.toFixed(1)}°C)`,
        threshold: '<= -20°C Wind Chill Threshold',
      },
    });
  } else if (apparentTemp <= -10 || temp <= -8) {
    alerts.push({
      id: 'cold-weather-advisory',
      severity: 'advisory',
      event: 'Cold Weather Advisory',
      headline: `Freezing Wind Chill Conditions in ${cityName} (${Math.round(apparentTemp)}°C)`,
      description:
        'Prolonged exposure to freezing temperatures may cause numbness and hypothermia.',
      instruction:
        'Dress warmly in hat and gloves, and bring domestic pets indoors.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Sub-Freezing Detection)',
      metricTrigger: {
        label: 'Apparent Temperature',
        value: `${apparentTemp.toFixed(1)}°C`,
        threshold: '<= -10°C Freezing Threshold',
      },
    });
  }

  // 5. Heavy Rain Rate / Flooding Risk
  const precip = current.precipitation ?? 0;
  if (precip >= 8 && !alerts.some((a) => a.id.startsWith('wmo-violent-rain'))) {
    alerts.push({
      id: 'torrential-rain-alert',
      severity: 'warning',
      event: 'Flash Flood & Heavy Rainfall Risk',
      headline: `High Precipitation Rate Detected (${precip.toFixed(1)} mm/h)`,
      description:
        'Rainfall intensity is exceptionally high. Low-lying depressions and street gutters are at imminent risk of water logging.',
      instruction:
        'Avoid driving through standing water. Stay tuned to local traffic advisories.',
      effective: effectiveTime,
      source: 'Open-Meteo REST API (Pluviometer Rate)',
      metricTrigger: {
        label: 'Current Precipitation',
        value: `${precip.toFixed(1)} mm/h`,
        threshold: '>= 8.0 mm/h Rain Rate',
      },
    });
  }

  // 6. Impending Severe Weather Watch (Scan next 12 hours from hourly forecast)
  if (data.hourly && Array.isArray(data.hourly.weather_code)) {
    const hourlyCodes = data.hourly.weather_code;
    const hourlyTimes = data.hourly.time || [];
    const scanLimit = Math.min(12, hourlyCodes.length);

    // Look for upcoming thunderstorm if none currently active
    if (!alerts.some((a) => a.event.includes('Thunderstorm'))) {
      const stormIdx = hourlyCodes.slice(0, scanLimit).findIndex((c) => c === 95 || c === 96 || c === 99);
      if (stormIdx !== -1) {
        const stormTimeStr = hourlyTimes[stormIdx]
          ? new Date(hourlyTimes[stormIdx]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : 'upcoming hours';
        alerts.push({
          id: 'impending-thunderstorm-watch',
          severity: 'warning',
          event: 'Impending Severe Thunderstorm Watch',
          headline: `Thunderstorm Forecasted for ${stormTimeStr}`,
          description: `Numerical atmospheric forecast predicts convective storm development in ${cityName} around ${stormTimeStr}. Heavy rain and lightning possible.`,
          instruction: 'Monitor atmospheric trends and plan outdoor activities accordingly.',
          effective: effectiveTime,
          source: 'Open-Meteo Forecast Model (Next 12h Hourly Projection)',
          metricTrigger: {
            label: 'Forecast Hourly WMO',
            value: `Code ${hourlyCodes[stormIdx]} at ${stormTimeStr}`,
            threshold: 'Convective storm forecasted within 12 hours',
          },
        });
      }
    }

    // Look for upcoming heavy snow if none currently active
    if (!alerts.some((a) => a.event.includes('Snow'))) {
      const snowIdx = hourlyCodes.slice(0, scanLimit).findIndex((c) => c === 75 || c === 86);
      if (snowIdx !== -1) {
        const snowTimeStr = hourlyTimes[snowIdx]
          ? new Date(hourlyTimes[snowIdx]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : 'upcoming hours';
        alerts.push({
          id: 'impending-winter-storm-watch',
          severity: 'warning',
          event: 'Winter Storm Watch (Next 12 Hours)',
          headline: `Heavy Snowfall Expected near ${snowTimeStr}`,
          description: `Forecast projection indicates heavy snow beginning around ${snowTimeStr}. Accumulation and reduced visibility likely.`,
          instruction: 'Prepare snow removal equipment and winter emergency gear in advance.',
          effective: effectiveTime,
          source: 'Open-Meteo Forecast Model (Next 12h Hourly Projection)',
          metricTrigger: {
            label: 'Forecast Hourly WMO',
            value: `Code ${hourlyCodes[snowIdx]} at ${snowTimeStr}`,
            threshold: 'Heavy snow forecasted within 12 hours',
          },
        });
      }
    }
  }

  // Sort alerts by severity (highest priority first)
  return alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

/**
 * Pre-defined simulation alerts for student assignment testing, grading,
 * and demonstration without requiring a real-world natural catastrophe.
 */
export const SIMULATED_ALERTS: Record<string, { label: string; alert: WeatherAlert }> = {
  thunderstorm: {
    label: '⚡ Severe Thunderstorm & Hail Warning',
    alert: {
      id: 'sim-thunderstorm-hail',
      severity: 'extreme',
      event: 'Severe Thunderstorm & Damaging Hail Warning',
      headline: 'Severe Thunderstorm with Hail & Damaging Winds Active',
      description:
        'Live radar flags indicate violent convective thunderstorm cells producing frequent lightning discharges, damaging 2cm+ hail, and localized downpours exceeding 30 mm/h.',
      instruction:
        'Take shelter immediately in an interior room on the lowest floor of a sturdy building. Stay clear of windows and avoid open bodies of water.',
      effective: 'Active Now',
      expires: 'In 2 hours',
      source: 'Simulation Mode (Test & Grading Verification)',
      metricTrigger: {
        label: 'Simulated API Flag',
        value: 'WMO 99 (Thunderstorm with Heavy Hail) + Wind Gusts 85 km/h',
        threshold: 'Severe Meteorological Anomaly Threshold',
      },
      isSimulated: true,
    },
  },
  high_wind: {
    label: '💨 Gale & High Wind Warning',
    alert: {
      id: 'sim-high-wind',
      severity: 'severe',
      event: 'Storm Force / High Wind Warning',
      headline: 'Dangerous High Wind Gusts Reaching 78 km/h',
      description:
        'Pressure gradient analysis detects sustained winds of 58 km/h with gusts topping 78 km/h. High potential for tree limb damage and power line disruptions.',
      instruction:
        'Anchor all loose patio furniture. High-profile vehicles should exercise extreme vigilance or avoid exposed bridges.',
      effective: 'Active Now',
      expires: 'In 4 hours',
      source: 'Simulation Mode (Test & Grading Verification)',
      metricTrigger: {
        label: 'Simulated API Flag',
        value: 'Wind Speed 58 km/h, Gusts 78 km/h',
        threshold: '>= 65 km/h Wind Warning Threshold',
      },
      isSimulated: true,
    },
  },
  extreme_heat: {
    label: '🔥 Excessive Heat Warning',
    alert: {
      id: 'sim-extreme-heat',
      severity: 'extreme',
      event: 'Excessive Heat Warning',
      headline: 'Dangerous Heat Index Exceeding 42°C',
      description:
        'Ambient air temperatures combined with high relative humidity have pushed the heat index to dangerous levels. Rapid onset of heat exhaustion is likely with outdoor exposure.',
      instruction:
        'Remain in cool, air-conditioned spaces. Drink fluids regularly, refrain from strenuous outdoor exercise, and never leave children or pets in parked vehicles.',
      effective: 'Active Now',
      expires: 'Until 8:00 PM',
      source: 'Simulation Mode (Test & Grading Verification)',
      metricTrigger: {
        label: 'Simulated API Flag',
        value: 'Temperature 39.5°C, Apparent Heat Index 43.1°C',
        threshold: '>= 40°C Heat Warning Threshold',
      },
      isSimulated: true,
    },
  },
  blizzard: {
    label: '❄️ Blizzard & Heavy Snow Warning',
    alert: {
      id: 'sim-blizzard',
      severity: 'severe',
      event: 'Heavy Snow & Blizzard Warning',
      headline: 'Zero-Visibility Blizzard Conditions & Ice Glaze',
      description:
        'Heavy snowfall rates combined with winds gusting to 55 km/h are creating severe whiteout conditions and rapid icy road accumulation.',
      instruction:
        'Road travel is strongly discouraged. Keep warm clothing, emergency rations, and a phone charger readily accessible.',
      effective: 'Active Now',
      expires: 'In 6 hours',
      source: 'Simulation Mode (Test & Grading Verification)',
      metricTrigger: {
        label: 'Simulated API Flag',
        value: 'WMO 75 (Heavy Snow) + Temperature -8°C',
        threshold: 'Winter Storm Warning Threshold',
      },
      isSimulated: true,
    },
  },
};
