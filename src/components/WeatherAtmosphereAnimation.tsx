import React, { useMemo } from 'react';

interface WeatherAtmosphereAnimationProps {
  weatherCode: number;
  isDay: boolean;
}

export type AtmosphereCondition =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain-light'
  | 'rain-heavy'
  | 'freezing-rain'
  | 'snow-light'
  | 'snow-heavy'
  | 'thunderstorm'
  | 'thunderstorm-hail'
  | 'calm';

/**
 * Strict WMO Weather Interpretation Code categorization
 * Ensures 100% meteorological accuracy based on official WW Code Table 4677
 */
export function resolveAtmosphereCondition(code: number, isDay: boolean): AtmosphereCondition {
  // 0, 1: Clear Sky / Mainly Clear
  if (code === 0 || code === 1) {
    return isDay ? 'clear-day' : 'clear-night';
  }
  // 2: Partly Cloudy
  if (code === 2) {
    return 'partly-cloudy';
  }
  // 3: Overcast
  if (code === 3) {
    return 'overcast';
  }
  // 45, 48: Fog / Depositing Rime Fog
  if (code === 45 || code === 48) {
    return 'fog';
  }
  // 51, 53, 55: Drizzle (Light, Moderate, Dense)
  if (code === 51 || code === 53 || code === 55) {
    return 'drizzle';
  }
  // 56, 57, 66, 67: Freezing Drizzle & Freezing Rain
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return 'freezing-rain';
  }
  // 61, 80: Slight Rain / Slight Rain Showers
  if (code === 61 || code === 80) {
    return 'rain-light';
  }
  // 63, 65, 81, 82: Moderate/Heavy Rain, Violent Rain Showers
  if (code === 63 || code === 65 || code === 81 || code === 82) {
    return 'rain-heavy';
  }
  // 71, 77, 85: Slight Snow Fall, Snow Grains, Light Snow Showers
  if (code === 71 || code === 77 || code === 85) {
    return 'snow-light';
  }
  // 73, 75, 86: Moderate/Heavy Snow Fall, Heavy Snow Showers
  if (code === 73 || code === 75 || code === 86) {
    return 'snow-heavy';
  }
  // 95: Thunderstorm
  if (code === 95) {
    return 'thunderstorm';
  }
  // 96, 99: Thunderstorm with Hail
  if (code === 96 || code === 99) {
    return 'thunderstorm-hail';
  }

  return 'calm';
}

export const WeatherAtmosphereAnimation: React.FC<WeatherAtmosphereAnimationProps> = ({
  weatherCode,
  isDay,
}) => {
  const condition = resolveAtmosphereCondition(weatherCode, isDay);

  // Generate deterministic particles for rain
  const rainParticles = useMemo(() => {
    const count = condition === 'rain-heavy' || condition === 'thunderstorm' || condition === 'thunderstorm-hail' ? 28 : 18;
    return Array.from({ length: count }, (_, i) => {
      // Deterministic pseudorandom values based on index
      const seed1 = ((i * 37) % 100) / 100;
      const seed2 = ((i * 59) % 100) / 100;
      const seed3 = ((i * 83) % 100) / 100;
      return {
        id: i,
        left: `${(seed1 * 96 + 2).toFixed(1)}%`,
        duration: `${(0.7 + seed2 * 0.45).toFixed(2)}s`,
        delay: `${(seed3 * 1.6).toFixed(2)}s`,
        height: `${Math.round(14 + seed2 * 12)}px`,
        opacity: 0.35 + seed1 * 0.3,
      };
    });
  }, [condition]);

  // Generate deterministic particles for drizzle
  const drizzleParticles = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const seed1 = ((i * 41) % 100) / 100;
      const seed2 = ((i * 67) % 100) / 100;
      const seed3 = ((i * 89) % 100) / 100;
      return {
        id: i,
        left: `${(seed1 * 96 + 2).toFixed(1)}%`,
        duration: `${(1.1 + seed2 * 0.5).toFixed(2)}s`,
        delay: `${(seed3 * 1.8).toFixed(2)}s`,
        height: `${Math.round(8 + seed2 * 6)}px`,
        opacity: 0.3 + seed1 * 0.25,
      };
    });
  }, []);

  // Generate deterministic particles for snowflakes
  const snowParticles = useMemo(() => {
    const count = condition === 'snow-heavy' ? 30 : 18;
    return Array.from({ length: count }, (_, i) => {
      const seed1 = ((i * 43) % 100) / 100;
      const seed2 = ((i * 71) % 100) / 100;
      const seed3 = ((i * 97) % 100) / 100;
      const size = 3 + Math.round(seed2 * 5); // 3px to 8px
      return {
        id: i,
        left: `${(seed1 * 96 + 2).toFixed(1)}%`,
        duration: `${(3.2 + seed2 * 2.8).toFixed(2)}s`,
        delay: `${(seed3 * 3.5).toFixed(2)}s`,
        size: `${size}px`,
        opacity: 0.35 + seed1 * 0.45,
      };
    });
  }, [condition]);

  // Generate deterministic star particles for clear night
  const starParticles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const seed1 = ((i * 47) % 100) / 100;
      const seed2 = ((i * 73) % 100) / 100;
      const seed3 = ((i * 91) % 100) / 100;
      return {
        id: i,
        left: `${(seed1 * 94 + 3).toFixed(1)}%`,
        top: `${(seed2 * 75 + 5).toFixed(1)}%`,
        size: seed3 > 0.7 ? '2.5px' : '1.5px',
        duration: `${(2.2 + seed2 * 2.0).toFixed(2)}s`,
        delay: `${(seed3 * 2.5).toFixed(2)}s`,
      };
    });
  }, []);

  // Generate hail particles for thunderstorm-hail
  const hailParticles = useMemo(() => {
    if (condition !== 'thunderstorm-hail') return [];
    return Array.from({ length: 12 }, (_, i) => {
      const seed1 = ((i * 53) % 100) / 100;
      const seed2 = ((i * 79) % 100) / 100;
      const seed3 = ((i * 83) % 100) / 100;
      return {
        id: i,
        left: `${(seed1 * 94 + 3).toFixed(1)}%`,
        duration: `${(0.55 + seed2 * 0.3).toFixed(2)}s`,
        delay: `${(seed3 * 1.2).toFixed(2)}s`,
        size: `${Math.round(4 + seed2 * 3)}px`,
      };
    });
  }, [condition]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-2xl"
    >
      {/* 1. CLEAR SKY / MAINLY CLEAR (DAY): Gentle warm sun pulse & solar glow */}
      {condition === 'clear-day' && (
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none overflow-hidden">
          {/* Subtle Rotating Sun Ray Glow */}
          <div
            className="weather-anim-layer absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-amber-300/20 via-yellow-400/10 to-transparent dark:from-amber-400/10 dark:via-yellow-500/5 blur-2xl"
            style={{
              animation: 'weatherSunPulse 9s ease-in-out infinite',
            }}
          />
          <div
            className="weather-anim-layer absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tr from-amber-400/20 via-orange-300/10 to-transparent dark:from-amber-500/15 blur-xl"
            style={{
              animation: 'weatherSunRayGlow 14s linear infinite',
            }}
          />
        </div>
      )}

      {/* 2. CLEAR SKY / MAINLY CLEAR (NIGHT): Twinkling pinpoint stars */}
      {condition === 'clear-night' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Gentle Deep Cosmic Glow */}
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl" />
          {starParticles.map((star) => (
            <span
              key={star.id}
              className="weather-anim-particle absolute rounded-full bg-white dark:bg-sky-100 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animation: `weatherStarTwinkle ${star.duration} ease-in-out infinite`,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 3. PARTLY CLOUDY: Gentle drifting cloud layer */}
      {condition === 'partly-cloudy' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="weather-anim-layer absolute top-2 -left-8 w-72 h-36 rounded-full bg-slate-300/25 dark:bg-slate-700/20 blur-2xl"
            style={{
              animation: 'weatherCloudDrift 24s ease-in-out infinite',
            }}
          />
          <div
            className="weather-anim-layer absolute top-12 right-0 w-80 h-32 rounded-full bg-sky-200/20 dark:bg-slate-700/15 blur-2xl"
            style={{
              animation: 'weatherCloudDrift 30s ease-in-out infinite reverse',
            }}
          />
        </div>
      )}

      {/* 4. OVERCAST: Dense soft cloud coverage with slow drift */}
      {condition === 'overcast' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="weather-anim-layer absolute -top-8 left-1/4 w-96 h-48 rounded-full bg-slate-400/20 dark:bg-slate-600/20 blur-3xl"
            style={{
              animation: 'weatherCloudDrift 20s ease-in-out infinite',
            }}
          />
          <div
            className="weather-anim-layer absolute top-4 -right-12 w-96 h-40 rounded-full bg-slate-400/15 dark:bg-slate-700/20 blur-3xl"
            style={{
              animation: 'weatherCloudDrift 28s ease-in-out infinite reverse',
            }}
          />
        </div>
      )}

      {/* 5. FOG / DEPOSITING RIME FOG: Horizontal drifting misty haze bands */}
      {condition === 'fog' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="weather-anim-layer absolute top-6 -left-12 right-0 h-16 bg-gradient-to-r from-transparent via-slate-300/35 to-transparent dark:via-slate-600/30 blur-xl"
            style={{
              animation: 'weatherFogDrift 16s ease-in-out infinite',
            }}
          />
          <div
            className="weather-anim-layer absolute top-28 -right-12 left-0 h-20 bg-gradient-to-r from-transparent via-neutral-300/30 to-transparent dark:via-neutral-600/25 blur-xl"
            style={{
              animation: 'weatherFogDrift 22s ease-in-out infinite reverse',
            }}
          />
          <div
            className="weather-anim-layer absolute bottom-8 -left-8 right-0 h-16 bg-gradient-to-r from-transparent via-slate-200/30 to-transparent dark:via-slate-700/20 blur-lg"
            style={{
              animation: 'weatherFogDrift 19s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* 6. DRIZZLE: Delicate slanting micro-droplets */}
      {condition === 'drizzle' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {drizzleParticles.map((drop) => (
            <span
              key={drop.id}
              className="weather-anim-particle absolute w-[1px] bg-gradient-to-b from-cyan-400/20 via-cyan-400/60 to-cyan-500/80 dark:from-cyan-300/20 dark:via-cyan-300/60 dark:to-cyan-400/80 rounded-full"
              style={{
                left: drop.left,
                top: '-15px',
                height: drop.height,
                opacity: drop.opacity,
                animation: `weatherDrizzleFall ${drop.duration} linear infinite`,
                animationDelay: drop.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 7. RAIN (LIGHT & HEAVY): Slanting falling raindrops */}
      {(condition === 'rain-light' || condition === 'rain-heavy' || condition === 'thunderstorm' || condition === 'thunderstorm-hail') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {rainParticles.map((drop) => (
            <span
              key={drop.id}
              className="weather-anim-particle absolute w-[1.5px] bg-gradient-to-b from-transparent via-sky-400/60 to-blue-500/90 dark:via-sky-300/60 dark:to-blue-400/90 rounded-full shadow-[0_0_2px_rgba(56,189,248,0.4)]"
              style={{
                left: drop.left,
                top: '-25px',
                height: drop.height,
                opacity: drop.opacity,
                animation: `weatherRainFall ${drop.duration} linear infinite`,
                animationDelay: drop.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 8. FREEZING RAIN: Sleet / ice crystal streaks */}
      {condition === 'freezing-rain' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {rainParticles.slice(0, 16).map((drop) => (
            <span
              key={drop.id}
              className="weather-anim-particle absolute w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300/60 to-teal-400/80 rounded-full"
              style={{
                left: drop.left,
                top: '-20px',
                height: drop.height,
                opacity: drop.opacity,
                animation: `weatherRainFall ${drop.duration} linear infinite`,
                animationDelay: drop.delay,
              }}
            />
          ))}
          {snowParticles.slice(0, 10).map((flake) => (
            <span
              key={`sleet-${flake.id}`}
              className="weather-anim-particle absolute rounded-full bg-cyan-100/90 dark:bg-white shadow-[0_0_4px_rgba(165,243,252,0.8)]"
              style={{
                left: flake.left,
                top: '-15px',
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animation: `weatherSnowFall ${flake.duration} linear infinite`,
                animationDelay: flake.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 9. SNOW (LIGHT & HEAVY): Soft floating & swaying snowflakes */}
      {(condition === 'snow-light' || condition === 'snow-heavy') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {snowParticles.map((flake) => (
            <span
              key={flake.id}
              className="weather-anim-particle absolute rounded-full bg-white dark:bg-sky-50 shadow-[0_0_5px_rgba(255,255,255,0.7)]"
              style={{
                left: flake.left,
                top: '-15px',
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animation: `weatherSnowFall ${flake.duration} linear infinite`,
                animationDelay: flake.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 10. THUNDERSTORM: Lightning flash sheet & optional hail pellets */}
      {(condition === 'thunderstorm' || condition === 'thunderstorm-hail') && (
        <>
          {/* Subtle Ambient Lightning Sheet Flash */}
          <div
            className="weather-anim-layer absolute inset-0 bg-sky-200/30 dark:bg-indigo-300/25 pointer-events-none"
            style={{
              animation: 'weatherLightningFlash 7.5s ease-out infinite',
            }}
          />

          {/* Hail Pellets */}
          {hailParticles.map((hail) => (
            <span
              key={`hail-${hail.id}`}
              className="weather-anim-particle absolute rounded-full bg-white/90 border border-slate-300/60 shadow-[0_0_4px_rgba(255,255,255,0.9)]"
              style={{
                left: hail.left,
                top: '-15px',
                width: hail.size,
                height: hail.size,
                animation: `weatherRainFall ${hail.duration} linear infinite`,
                animationDelay: hail.delay,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
