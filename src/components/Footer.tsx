import React from 'react';
import { ExternalLink, Terminal, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="app-footer"
      className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs py-8 text-slate-500 dark:text-slate-400 text-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-sky-500" />
              Engineering Assignment: Asynchronous JS & RESTful APIs
            </span>
            <p className="text-center md:text-left text-slate-500 dark:text-slate-400">
              Demonstrating ES6+ async/await, fetch API, DOM rendering, and nested JSON extraction with live public REST endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <span>Weather data by Open-Meteo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <span>Geocoding via OSM</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Strict Zero-Mock Policy: 100% Live Open-Meteo REST API Data</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Built with HTML5 • CSS3 • JavaScript (ES6+) • React 19 • Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
