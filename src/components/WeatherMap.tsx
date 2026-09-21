import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Mountain,
  Globe,
  Loader2,
  MousePointerClick,
} from 'lucide-react';
import { ProcessedWeatherData, TemperatureUnit, ThemeMode } from '../types';
import { formatTemp, getWeatherCondition } from '../utils/weatherCodes';

interface WeatherMapProps {
  data: ProcessedWeatherData;
  unit: TemperatureUnit;
  theme?: ThemeMode;
}

const SATELLITE_PROVIDER = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  maxZoom: 18,
};

// Global geographic bounds covering the single world
const WORLD_BOUNDS: L.LatLngBoundsLiteral = [
  [-85.05112878, -180],
  [85.05112878, 180],
];

export const WeatherMap: React.FC<WeatherMapProps> = ({ data, unit }) => {
  const { location, current } = data;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const clickMarkerRef = useRef<L.CircleMarker | null>(null);
  const elevationFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom and dynamic elevation tracking state
  const [currentZoom, setCurrentZoom] = useState<number>(10);
  const [currentElevation, setCurrentElevation] = useState<number | null>(() => location.elevation ?? null);
  const [isLoadingElevation, setIsLoadingElevation] = useState(false);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: location.latitude,
    lng: location.longitude,
  });

  // Format coordinate strings (e.g. 12.9719° N, 77.5937° E)
  const latFormatted = `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude >= 0 ? 'N' : 'S'}`;
  const lonFormatted = `${Math.abs(location.longitude).toFixed(4)}° ${location.longitude >= 0 ? 'E' : 'W'}`;
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const tempString = formatTemp(current.temperature, unit);

  // Sync city elevation when city changes
  useEffect(() => {
    setCurrentElevation(location.elevation ?? null);
    setActiveCoords({ lat: location.latitude, lng: location.longitude });
    if (clickMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(clickMarkerRef.current);
      clickMarkerRef.current = null;
    }
  }, [location.latitude, location.longitude, location.elevation]);

  // Accurate elevation fetcher for any coordinate
  const fetchAccurateElevation = useCallback(async (lat: number, lng: number) => {
    if (elevationFetchTimeoutRef.current) {
      clearTimeout(elevationFetchTimeoutRef.current);
    }

    setIsLoadingElevation(true);
    setActiveCoords({ lat, lng });

    elevationFetchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.elevation && result.elevation.length > 0) {
            setCurrentElevation(Math.round(result.elevation[0]));
          }
        }
      } catch (err) {
        console.error('Failed to fetch accurate elevation:', err);
      } finally {
        setIsLoadingElevation(false);
      }
    }, 280);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized
    if (!mapInstanceRef.current) {
      const bounds = L.latLngBounds(WORLD_BOUNDS);

      const map = L.map(mapContainerRef.current, {
        center: [location.latitude, location.longitude],
        zoom: 10,
        minZoom: 3, // Prevent zooming out into multiple repeating copies of the Earth
        maxZoom: 18,
        maxBounds: bounds, // Restrict panning to single world boundaries
        maxBoundsViscosity: 1.0, // Solid barrier prevents dragging into blank grey space
        zoomControl: false, // We render clean customized controls matching design
        attributionControl: false,
      });

      // Add accurate metric distance scale ruler (updates dynamically when zooming in and making small)
      L.control
        .scale({
          imperial: false,
          metric: true,
          position: 'bottomleft',
        })
        .addTo(map);

      // Add compact attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<a href="https://leafletjs.com" title="Leaflet" target="_blank">Leaflet</a>',
        })
        .addTo(map);

      // Add Satellite Tile Layer with single world no-wrap constraints
      const tileLayer = L.tileLayer(SATELLITE_PROVIDER.url, {
        attribution: SATELLITE_PROVIDER.attribution,
        maxZoom: SATELLITE_PROVIDER.maxZoom,
        noWrap: true, // Only render single world, never duplicate horizontally
        bounds: bounds,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
      setCurrentZoom(map.getZoom());

      // Handle dynamic accurate elevation when zooming or panning
      const handleMapMoveOrZoom = () => {
        setCurrentZoom(map.getZoom());
        const center = map.getCenter();

        // Distance check from primary city pin (~1.5 km threshold)
        const latDelta = Math.abs(center.lat - location.latitude);
        const lngDelta = Math.abs(center.lng - location.longitude);
        const isNearCity = latDelta < 0.015 && lngDelta < 0.015;

        if (isNearCity && location.elevation !== undefined) {
          setCurrentElevation(location.elevation);
          setActiveCoords({ lat: location.latitude, lng: location.longitude });
          setIsLoadingElevation(false);
        } else {
          fetchAccurateElevation(center.lat, center.lng);
        }
      };

      map.on('zoomend', handleMapMoveOrZoom);
      map.on('moveend', handleMapMoveOrZoom);

      // Click to inspect elevation at any exact location on the satellite map
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        
        // Remove previous click marker if any
        if (clickMarkerRef.current) {
          map.removeLayer(clickMarkerRef.current);
        }

        // Add subtle pinpoint marker for clicked coordinate
        const pin = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#34d399',
          fillColor: '#10b981',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);
        clickMarkerRef.current = pin;

        fetchAccurateElevation(lat, lng);
      });

      // Ensure proper sizing after layout render and window container changes
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (elevationFetchTimeoutRef.current) {
          clearTimeout(elevationFetchTimeoutRef.current);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          tileLayerRef.current = null;
          markerRef.current = null;
          clickMarkerRef.current = null;
        }
      };
    }

    return () => {
      if (elevationFetchTimeoutRef.current) {
        clearTimeout(elevationFetchTimeoutRef.current);
      }
    };
  }, [location.latitude, location.longitude, location.elevation, fetchAccurateElevation]);

  // Update map center & custom animated marker when location or weather changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng: L.LatLngExpression = [location.latitude, location.longitude];

    // Smooth pan to location
    map.flyTo(latLng, 10, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // Create custom styled DOM marker
    const customIcon = L.divIcon({
      className: 'custom-weather-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 9999px;
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            border: 1.5px solid #38bdf8;
            white-space: nowrap;
          ">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 9999px; background: #38bdf8;"></span>
            <span>${location.name}</span>
            <span style="color: #38bdf8; font-family: monospace;">${tempString}</span>
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #0f172a;
            margin-top: -1px;
          "></div>
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 9999px;
            background: #38bdf8;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.35);
            margin-top: 1px;
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
      markerRef.current.setIcon(customIcon);
    } else {
      const marker = L.marker(latLng, { icon: customIcon }).addTo(map);
      markerRef.current = marker;
    }

    // Popup content with rich meteorological & geographical details
    const popupContent = `
      <div style="font-family: inherit; font-size: 12px; min-width: 190px; color: #1e293b; line-height: 1.4;">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
          ${location.name}${location.admin1 ? `, ${location.admin1}` : ''}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
          ${location.country || ''} (${latFormatted}, ${lonFormatted})
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #f1f5f9; border-radius: 8px; margin-bottom: 6px;">
          <span style="font-weight: 600; color: #0f172a;">${condition.description}</span>
          <span style="font-weight: 800; font-size: 14px; color: #0284c7;">${tempString}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #475569;">
          <div>Wind: <b>${Math.round(current.windSpeed)} km/h</b></div>
          <div>Humidity: <b>${current.humidity}%</b></div>
          <div>Elevation: <b>${location.elevation !== undefined ? `${location.elevation}m` : 'N/A'}</b></div>
          <div>Timezone: <b>${location.timezone || 'Auto'}</b></div>
        </div>
      </div>
    `;

    if (markerRef.current) {
      markerRef.current.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-weather-popup',
      });
    }
  }, [location.latitude, location.longitude, location.name, location.country, current.temperature, current.windSpeed, current.humidity, unit]);

  // Map Recenter handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([location.latitude, location.longitude], 10, {
      duration: 1,
    });
    setCurrentZoom(10);
    if (clickMarkerRef.current) {
      mapInstanceRef.current.removeLayer(clickMarkerRef.current);
      clickMarkerRef.current = null;
    }
    setCurrentElevation(location.elevation ?? null);
    setActiveCoords({ lat: location.latitude, lng: location.longitude });
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current || currentZoom >= 18) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current || currentZoom <= 3) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      id="weather-map-card"
      className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Geographical Location</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Compass className="w-3 h-3 text-sky-500" />
                {latFormatted}, {lonFormatted}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive high-resolution satellite imagery centered on {location.name}
            </p>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Satellite View Badge */}
          <div
            id="map-view-indicator"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Satellite View</span>
          </div>

          {/* Recenter Button */}
          <button
            id="btn-map-recenter"
            type="button"
            onClick={handleRecenter}
            title="Recenter on City"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-sky-500" />
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-72 sm:h-80 md:h-[340px] bg-slate-100 dark:bg-slate-950">
        <div
          id="weather-map-container"
          ref={mapContainerRef}
          className="w-full h-full z-0"
        />

        {/* Floating Custom Zoom Controls */}
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1 shadow-md rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <button
            id="btn-map-zoom-in"
            type="button"
            onClick={handleZoomIn}
            disabled={currentZoom >= 18}
            className={`p-2 transition-colors ${
              currentZoom >= 18
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
            }`}
            title={currentZoom >= 18 ? 'Maximum zoom reached' : 'Zoom in'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <button
            id="btn-map-zoom-out"
            type="button"
            onClick={handleZoomOut}
            disabled={currentZoom <= 3}
            className={`p-2 transition-colors ${
              currentZoom <= 3
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
            }`}
            title={currentZoom <= 3 ? 'Minimum global zoom reached' : 'Zoom out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Floating City & Coordinates Pill on Mobile */}
        <div className="sm:hidden absolute bottom-3 left-3 z-[400] px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium border border-white/10 shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-sky-400" />
          <span>{location.name}</span>
          <span className="text-slate-400">({latFormatted}, {lonFormatted})</span>
        </div>
      </div>

      {/* Map Bottom Metadata Grid */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Timezone: <strong className="font-semibold text-slate-900 dark:text-slate-100">{location.timezone || 'UTC'}</strong></span>
          </span>

          {/* Dynamic Accurate Elevation Badge */}
          <span
            id="map-live-elevation-indicator"
            className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300"
            title="Real-time elevation from Open-Meteo High-Resolution Digital Elevation Model (Copernicus/SRTM)"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Elevation:{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {currentElevation !== null ? `${currentElevation} m` : 'Calculating...'}
              </strong>{' '}
              above sea level
            </span>
            {isLoadingElevation && <Loader2 className="w-3 h-3 animate-spin text-emerald-500 shrink-0" />}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <MousePointerClick className="w-3 h-3 text-sky-500" />
            Click map to inspect
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>DEM Model:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">Copernicus 90m</span>
        </div>
      </div>
    </div>
  );
};
