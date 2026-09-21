import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { WeatherMetricsGrid } from './components/WeatherMetricsGrid';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { WeatherMap } from './components/WeatherMap';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorBanner } from './components/ErrorBanner';
import { Footer } from './components/Footer';
import { SevereWeatherAlertBanner } from './components/SevereWeatherAlertBanner';

import {
  ProcessedWeatherData,
  GeocodingResult,
  TemperatureUnit,
  ThemeMode,
  WeatherAlert,
  ComparisonWeather,
} from './types';

import {
  fetchWeatherData,
  reverseGeocode,
  fetchComparisonWeather,
} from './services/weatherApi';

import { SIMULATED_ALERTS } from './utils/alertDetection';

// Used only while the browser is resolving the device location.
const INITIAL_LOCATION: GeocodingResult = {
  id: 0,
  name: 'Current location',
  latitude: 0,
  longitude: 0,
  country: '',
};

const POPULAR_CITIES: GeocodingResult[] = [
  {
    id: 1277333,
    name: 'Bengaluru',
    latitude: 12.97194,
    longitude: 77.59369,
    country: 'India',
    country_code: 'IN',
    admin1: 'Karnataka',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 2643743,
    name: 'London',
    latitude: 51.50853,
    longitude: -0.12574,
    country: 'United Kingdom',
    country_code: 'GB',
    admin1: 'England',
  },
  {
    id: 5128581,
    name: 'New York',
    latitude: 40.71427,
    longitude: -74.00597,
    country: 'United States',
    country_code: 'US',
    admin1: 'New York',
  },
  {
    id: 1850147,
    name: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.69171,
    country: 'Japan',
    country_code: 'JP',
    admin1: 'Tokyo',
  },
];

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('weather_dashboard_theme');

    if (saved === 'dark' || saved === 'light') {
      return saved;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Temperature unit state
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    const saved = localStorage.getItem('weather_dashboard_unit');

    return saved === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  });

  // Current active location
  const [location, setLocation] = useState<GeocodingResult>(() => {
    return INITIAL_LOCATION;
  });

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<
    GeocodingResult[]
  >(() => {
    try {
      const saved = localStorage.getItem(
        'weather_dashboard_recent'
      );

      return saved ? JSON.parse(saved) : POPULAR_CITIES;
    } catch {
      return POPULAR_CITIES;
    }
  });

  // Core weather state
  const [weatherData, setWeatherData] =
    useState<ProcessedWeatherData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [simulatedAlertKey, setSimulatedAlertKey] =
    useState<string | null>(null);

  const [selectedDayIndex, setSelectedDayIndex] =
    useState<number>(0);

  // Comparison city weather state
  const [comparisonLocation, setComparisonLocation] =
    useState<GeocodingResult | null>(null);

  const [comparisonWeather, setComparisonWeather] =
    useState<ComparisonWeather | null>(null);

  const [isLoadingComparison, setIsLoadingComparison] =
    useState<boolean>(false);

  const [comparisonError, setComparisonError] =
    useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const comparisonAbortRef = useRef<AbortController | null>(null);

  // Derive active alerts
  const activeAlerts: WeatherAlert[] = React.useMemo(() => {
    const liveAlerts = weatherData?.alerts || [];

    if (
      simulatedAlertKey &&
      SIMULATED_ALERTS[simulatedAlertKey]
    ) {
      return [
        SIMULATED_ALERTS[simulatedAlertKey].alert,
        ...liveAlerts,
      ];
    }

    return liveAlerts;
  }, [weatherData?.alerts, simulatedAlertKey]);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('weather_dashboard_theme', theme);
  }, [theme]);

  // Persist unit preference
  const toggleUnit = () => {
    const nextUnit: TemperatureUnit =
      unit === 'celsius' ? 'fahrenheit' : 'celsius';

    setUnit(nextUnit);
    localStorage.setItem('weather_dashboard_unit', nextUnit);
  };

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === 'light' ? 'dark' : 'light'
    );
  };

  // Asynchronous weather data fetcher
  const loadWeather = useCallback(
    async (loc: GeocodingResult) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchWeatherData(
          loc.latitude,
          loc.longitude,
          loc,
          controller.signal
        );

        setWeatherData(data);
        setLocation(loc);
        setSelectedDayIndex(0);

        // Save to localStorage
        localStorage.setItem(
          'weather_dashboard_last_location',
          JSON.stringify(loc)
        );

        // Add to recent searches
        setRecentSearches((prev) => {
          const filtered = prev.filter(
            (p) =>
              !(
                p.name.toLowerCase() ===
                  loc.name.toLowerCase() &&
                p.country === loc.country
              )
          );

          const updated = [loc, ...filtered].slice(0, 8);

          localStorage.setItem(
            'weather_dashboard_recent',
            JSON.stringify(updated)
          );

          return updated;
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(
            err.message ||
              'Failed to fetch weather data. Please try again.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch current weather for secondary comparison city
  const loadComparisonWeather = useCallback(
    async (loc: GeocodingResult | null) => {
      if (comparisonAbortRef.current) {
        comparisonAbortRef.current.abort();
      }

      if (!loc) {
        setComparisonLocation(null);
        setComparisonWeather(null);
        setComparisonError(null);
        setIsLoadingComparison(false);
        return;
      }

      // Do not compare city with itself
      if (
        loc.name.toLowerCase() === location.name.toLowerCase() &&
        (loc.country || '') === (location.country || '')
      ) {
        return;
      }

      const controller = new AbortController();
      comparisonAbortRef.current = controller;

      setComparisonLocation(loc);
      setIsLoadingComparison(true);
      setComparisonError(null);

      try {
        const compData = await fetchComparisonWeather(
          loc,
          controller.signal
        );

        setComparisonWeather(compData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setComparisonError(
            err.message ||
              `Failed to fetch weather for ${loc.name}`
          );
        }
      } finally {
        setIsLoadingComparison(false);
      }
    },
    [location]
  );

  // Swap primary city with comparison city
  const handleSwapCities = useCallback(() => {
    if (!comparisonLocation || !location) return;

    const oldPrimary = location;
    const oldComp = comparisonLocation;

    loadWeather(oldComp);
    loadComparisonWeather(oldPrimary);
  }, [
    location,
    comparisonLocation,
    loadWeather,
    loadComparisonWeather,
  ]);

  // =========================================================
  // INITIAL LOAD: DETECT CURRENT LOCATION FIRST
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const loadInitialLocation = async () => {
      // Check browser geolocation support
      if (!navigator.geolocation) {
        setError('Location access is not supported by this browser. Please search for a city manually.');
        setIsLoading(false);
        return;
      }

      setIsLocating(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return;

          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Reverse geocode current coordinates
            const resolvedLoc = await reverseGeocode(lat, lon);

            if (isMounted) {
              await loadWeather(resolvedLoc);
            }
          } catch (err: any) {
            if (isMounted) {
              setError('Unable to identify your current location. Please search for a city manually.');
              setIsLoading(false);
            }
          } finally {
            if (isMounted) {
              setIsLocating(false);
            }
          }
        },
        async (geoError) => {
          if (!isMounted) return;

          let message =
            'Unable to detect your current location. Please search for a city manually.';

          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              message =
                'Location access was denied. Please allow location access or search for a city manually.';
              break;

            case geoError.POSITION_UNAVAILABLE:
              message =
                'Location information is unavailable. Please search for a city manually.';
              break;

            case geoError.TIMEOUT:
              message =
                'Location request timed out. Please try again or search for a city manually.';
              break;
          }

          setError(message);
          setIsLoading(false);

          if (isMounted) {
            setIsLocating(false);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    };

    loadInitialLocation();

    return () => {
      isMounted = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (comparisonAbortRef.current) {
        comparisonAbortRef.current.abort();
      }
    };
  }, []);

  // Automatic weather refresh interval
  useEffect(() => {
    const intervalMs = 15 * 60 * 1000;

    const intervalId = setInterval(() => {
      if (!isLoading && location) {
        loadWeather(location);
      }

      if (comparisonLocation) {
        loadComparisonWeather(comparisonLocation);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [
    location,
    comparisonLocation,
    isLoading,
    loadWeather,
    loadComparisonWeather,
  ]);

  // Handle City Selection
  const handleSelectCity = (
    selected: GeocodingResult
  ) => {
    setSimulatedAlertKey(null);

    // If selected city is currently the comparison city
    if (
      comparisonLocation &&
      selected.name.toLowerCase() ===
        comparisonLocation.name.toLowerCase() &&
      (selected.country || '') ===
        (comparisonLocation.country || '')
    ) {
      loadComparisonWeather(null);
    }

    loadWeather(selected);
  };

  // Handle Current Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(
        'Geolocation is not supported by your browser.'
      );
      return;
    }

    setSimulatedAlertKey(null);
    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Perform reverse geocode lookup
          const resolvedLoc = await reverseGeocode(lat, lon);

          await loadWeather(resolvedLoc);
        } catch (err: any) {
          setError(
            err.message ||
              'Failed to retrieve weather for current location.'
          );
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              'Location access was denied. Please search for a city manually.'
            );
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError(
              'Location information is unavailable. Please try searching for your city.'
            );
            break;

          case geoError.TIMEOUT:
            setError(
              'The request to get your location timed out. Please try again.'
            );
            break;

          default:
            setError(
              'An unknown error occurred while retrieving your location.'
            );
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('weather_dashboard_recent');
  };

  const handleSelectForecastDay = (index: number) => {
    setSelectedDayIndex(index);

    const hourlySection = document.getElementById(
      'hourly-forecast-section'
    );

    if (hourlySection) {
      hourlySection.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation / Dashboard Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        unit={unit}
        onToggleUnit={toggleUnit}
        onUseMyLocation={handleUseMyLocation}
        onRefresh={() => loadWeather(location)}
        isLoading={isLoading}
        isLocating={isLocating}
        weatherData={weatherData}
        comparisonWeather={comparisonWeather}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* City Search Bar */}
        <SearchBar
          onSelectCity={handleSelectCity}
          isLoading={isLoading}
          recentSearches={recentSearches}
          onClearRecent={handleClearRecent}
          onError={(msg) => setError(msg)}
          onCompareCity={loadComparisonWeather}
          comparisonCityId={comparisonLocation?.id}
        />

        {/* User-Friendly Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => loadWeather(location)}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Weather Dashboard Core Sections */}
        {isLoading && !weatherData ? (
          <LoadingSkeleton />
        ) : weatherData ? (
          <div className="space-y-6">
            {/* Severe Weather Alert Notification Banner */}
            <SevereWeatherAlertBanner
              alerts={activeAlerts}
              simulatedAlertKey={simulatedAlertKey}
              onSelectSimulatedAlert={(key) =>
                setSimulatedAlertKey(key)
              }
            />

            {/* Primary Current Weather Display */}
            <CurrentWeatherCard
              data={weatherData}
              unit={unit}
              recentSearches={recentSearches}
              comparisonWeather={comparisonWeather}
              isLoadingComparison={isLoadingComparison}
              comparisonError={comparisonError}
              onSelectComparisonCity={loadComparisonWeather}
              onSwapCities={handleSwapCities}
              onRetryComparison={() =>
                comparisonLocation &&
                loadComparisonWeather(comparisonLocation)
              }
            />

            {/* Live Atmospheric Conditions Grid */}
            <WeatherMetricsGrid
              data={weatherData}
              unit={unit}
            />

            {/* Integrated Geographical Map View */}
            <WeatherMap
              data={weatherData}
              unit={unit}
              theme={theme}
            />

            {/* 24-Hour Hourly Forecast */}
            <HourlyForecast
              items={
                weatherData.daily[selectedDayIndex]?.hourly ||
                weatherData.hourly
              }
              unit={unit}
              days={weatherData.daily}
              selectedDayIndex={selectedDayIndex}
              onSelectDayIndex={setSelectedDayIndex}
              selectedDay={weatherData.daily[selectedDayIndex]}
            />

            {/* 7-Day Extended Forecast */}
            <DailyForecast
              items={weatherData.daily}
              unit={unit}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={handleSelectForecastDay}
            />
          </div>
        ) : null}
      </main>

      {/* Dashboard Footer */}
      <Footer />
    </div>
  );
}