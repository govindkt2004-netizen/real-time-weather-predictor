import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileCode, Check, ChevronDown, Loader2 } from 'lucide-react';
import { ProcessedWeatherData, TemperatureUnit, ComparisonWeather } from '../types';
import { downloadPdfReport, downloadTextReport } from '../services/reportGenerator';

interface ReportExportMenuProps {
  weatherData: ProcessedWeatherData;
  unit: TemperatureUnit;
  comparisonWeather?: ComparisonWeather | null;
  variant?: 'header' | 'card';
}

export const ReportExportMenu: React.FC<ReportExportMenuProps> = ({
  weatherData,
  unit,
  comparisonWeather,
  variant = 'card',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'txt' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'pdf' | 'txt') => {
    setDownloadingFormat(format);
    try {
      if (format === 'pdf') {
        downloadPdfReport(weatherData, unit, comparisonWeather);
        setSuccessMessage('PDF downloaded');
      } else {
        downloadTextReport(weatherData, unit, comparisonWeather);
        setSuccessMessage('Text report downloaded');
      }
      setTimeout(() => {
        setSuccessMessage(null);
        setIsOpen(false);
      }, 1400);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const isHeader = variant === 'header';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        id={`download-report-btn-${variant}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={
          isHeader
            ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer'
        }
        title="Download weather report for offline viewing"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
        <span>{isHeader ? 'Report' : 'Download Report'}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={`download-report-dropdown-${variant}`}
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 overflow-hidden transition-all"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Offline Weather Report
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Save {weatherData.location.name}&apos;s live snapshot for offline viewing
            </span>
          </div>

          {successMessage ? (
            <div className="py-4 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{successMessage}!</span>
            </div>
          ) : (
            <div className="p-1 space-y-1">
              {/* Option 1: PDF Document */}
              <button
                id="download-pdf-option-btn"
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('pdf')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                  {downloadingFormat === 'pdf' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      PDF Document (.pdf)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      Printable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Full visual summary with atmospheric metrics, comparison delta, & 7-day forecast table.
                  </p>
                </div>
              </button>

              {/* Option 2: Text / ASCII Report */}
              <button
                id="download-txt-option-btn"
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('txt')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                  {downloadingFormat === 'txt' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  ) : (
                    <FileCode className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Plain Text Report (.txt)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                      Lightweight
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    ASCII-formatted text file readable in any text editor, notepad, or terminal without PDF software.
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
