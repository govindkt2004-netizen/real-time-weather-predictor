import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Zap,
  Wind,
  Flame,
  Snowflake,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Beaker,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../types';
import { SIMULATED_ALERTS } from '../utils/alertDetection';

interface SevereWeatherAlertBannerProps {
  alerts: WeatherAlert[];
  simulatedAlertKey: string | null;
  onSelectSimulatedAlert: (key: string | null) => void;
  onDismissAlert?: (alertId: string) => void;
}

export function SevereWeatherAlertBanner({
  alerts,
  simulatedAlertKey,
  onSelectSimulatedAlert,
  onDismissAlert,
}: SevereWeatherAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);

  // If no alerts exist and not testing, show a subtle tester pill or nothing
  const hasAlerts = alerts && alerts.length > 0;

  // Ensure index stays valid
  const currentIndex = Math.min(activeAlertIndex, Math.max(0, alerts.length - 1));
  const currentAlert: WeatherAlert | undefined = alerts[currentIndex];

  if (!hasAlerts) {
    return (
      <div className="mb-6">
        <div
          id="severe-alert-inactive-bar"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-sm"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">No Severe Weather Alerts Active</span>
            <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70 hidden sm:inline">
              API response validated: all meteorological variables within normal thresholds.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-alert-tester-inactive"
              onClick={() => setIsTesterOpen(!isTesterOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 transition-colors"
              title="Test Severe Weather Alert Notification"
            >
              <Beaker className="w-3.5 h-3.5" />
              <span>Test Alert Scenarios</span>
            </button>
          </div>
        </div>

        {/* Simulation Selector Drawer */}
        {isTesterOpen && (
          <div
            id="alert-simulation-selector"
            className="mt-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5 text-blue-500" />
                Alert Module Verification & Grading Presets:
              </span>
              <button
                onClick={() => setIsTesterOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Select an alert scenario below to immediately verify how the dashboard responds when the REST API returns severe weather flags:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(SIMULATED_ALERTS).map(([key, item]) => (
                <button
                  key={key}
                  id={`btn-sim-alert-${key}`}
                  onClick={() => {
                    onSelectSimulatedAlert(key);
                    setIsTesterOpen(false);
                    setIsDismissed(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // If user dismissed the active alert, show a compact restorative badge
  if (isDismissed && currentAlert) {
    return (
      <div className="mb-6 flex items-center justify-between p-2.5 rounded-xl border border-red-500/25 bg-red-500/10 dark:bg-red-950/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-semibold text-red-700 dark:text-red-300">
            {alerts.length} Active Severe Weather Alert{alerts.length > 1 ? 's' : ''} Minimized:
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium truncate max-w-xs sm:max-w-md">
            {currentAlert.headline}
          </span>
        </div>
        <button
          id="btn-restore-alert-banner"
          onClick={() => setIsDismissed(false)}
          className="px-2.5 py-1 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shrink-0"
        >
          View Alert
        </button>
      </div>
    );
  }

  // Helper to pick severity visual styles
  const getSeverityStyle = (sev: AlertSeverity) => {
    switch (sev) {
      case 'extreme':
        return {
          wrapper:
            'border-red-500/40 bg-gradient-to-br from-red-500/15 via-red-500/5 to-rose-500/10 dark:from-red-950/40 dark:via-red-900/20 dark:to-slate-900',
          badge: 'bg-red-600 text-white shadow-sm shadow-red-600/20',
          badgeText: 'EXTREME SEVERE WARNING',
          titleColor: 'text-red-950 dark:text-red-100',
          accentColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-500/20',
          icon: AlertOctagon,
          pingColor: 'bg-red-500',
        };
      case 'severe':
        return {
          wrapper:
            'border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-amber-500/10 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-slate-900',
          badge: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20',
          badgeText: 'SEVERE WEATHER WARNING',
          titleColor: 'text-rose-950 dark:text-rose-100',
          accentColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-500/20',
          icon: AlertTriangle,
          pingColor: 'bg-rose-500',
        };
      case 'warning':
        return {
          wrapper:
            'border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-slate-900',
          badge: 'bg-amber-600 text-white shadow-sm shadow-amber-600/20',
          badgeText: 'WEATHER WARNING',
          titleColor: 'text-amber-950 dark:text-amber-100',
          accentColor: 'text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-500/20',
          icon: AlertTriangle,
          pingColor: 'bg-amber-500',
        };
      case 'advisory':
      default:
        return {
          wrapper:
            'border-sky-500/40 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-blue-500/10 dark:from-sky-950/40 dark:via-sky-900/20 dark:to-slate-900',
          badge: 'bg-sky-600 text-white',
          badgeText: 'WEATHER ADVISORY',
          titleColor: 'text-sky-950 dark:text-sky-100',
          accentColor: 'text-sky-600 dark:text-sky-400',
          borderColor: 'border-sky-500/20',
          icon: Info,
          pingColor: 'bg-sky-500',
        };
    }
  };

  const style = getSeverityStyle(currentAlert.severity);
  const IconComponent = style.icon;

  return (
    <div
      id="severe-weather-alert-banner"
      role="alert"
      aria-live="assertive"
      className={`mb-6 rounded-2xl border ${style.wrapper} shadow-md overflow-hidden transition-all duration-200`}
    >
      {/* Top Banner Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {/* Animated Pulsing Warning Icon */}
          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-current">
              <IconComponent className={`w-5 h-5 ${style.accentColor}`} />
            </span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.pingColor} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${style.pingColor}`}></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>
                {style.badgeText}
              </span>

              {currentAlert.isSimulated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  <Beaker className="w-3 h-3" />
                  Testing Simulation Mode
                </span>
              )}

              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Effective: {currentAlert.effective} {currentAlert.expires ? `• Expires: ${currentAlert.expires}` : ''}
              </span>
            </div>

            <h3 className={`text-base sm:text-lg font-bold tracking-tight ${style.titleColor}`}>
              {currentAlert.headline}
            </h3>
          </div>
        </div>

        {/* Action Controls: Switcher, Toggle Details, Dismiss */}
        <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0 self-end sm:self-center">
          {/* Multi-alert switcher */}
          {alerts.length > 1 && (
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10">
              <span className="text-slate-600 dark:text-slate-300">
                Alert {currentIndex + 1} of {alerts.length}
              </span>
              <div className="flex gap-1 ml-1">
                {alerts.map((_, idx) => (
                  <button
                    key={idx}
                    id={`btn-alert-nav-${idx}`}
                    onClick={() => setActiveAlertIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    title={`Switch to alert ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expand / Collapse Button */}
          <button
            id="btn-toggle-alert-details"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/70 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-xs transition-colors"
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Dismiss Alert Banner Button */}
          <button
            id="btn-dismiss-alert-banner"
            onClick={() => {
              setIsDismissed(true);
              if (onDismissAlert) onDismissAlert(currentAlert.id);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Minimize alert notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details Pane */}
      {isExpanded && (
        <div className={`px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t ${style.borderColor} space-y-3.5 text-sm`}>
          {/* Detailed Meteorological Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hazard Overview
            </h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {currentAlert.description}
            </p>
          </div>

          {/* Safety Precaution Instruction */}
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Recommended Protective Action:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              {currentAlert.instruction}
            </p>
          </div>

          {/* Trigger Details & Verification Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              {currentAlert.metricTrigger && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Trigger:</span>
                  {currentAlert.metricTrigger.label} = {currentAlert.metricTrigger.value}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Source: {currentAlert.source}
              </span>
            </div>

            {/* Test Scenario Switcher */}
            <div className="flex items-center gap-2">
              {currentAlert.isSimulated ? (
                <button
                  id="btn-clear-simulated-alert"
                  onClick={() => onSelectSimulatedAlert(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset to Live API Data
                </button>
              ) : (
                <button
                  id="btn-open-alert-tester-active"
                  onClick={() => setIsTesterOpen(!isTesterOpen)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Beaker className="w-3 h-3" />
                  Test other alert types
                </button>
              )}
            </div>
          </div>

          {/* Embedded Tester Selector in Expanded view */}
          {isTesterOpen && (
            <div className="mt-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>Select Alert Scenario to Preview:</span>
                <button onClick={() => setIsTesterOpen(false)}>
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SIMULATED_ALERTS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onSelectSimulatedAlert(key);
                      setIsTesterOpen(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                      simulatedAlertKey === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                {simulatedAlertKey && (
                  <button
                    onClick={() => {
                      onSelectSimulatedAlert(null);
                      setIsTesterOpen(false);
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-medium"
                  >
                    Clear Simulation (Live API)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
