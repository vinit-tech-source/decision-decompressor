import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon, DownloadIcon, GlobeIcon, LaptopIcon, SmartphoneIcon, FullscreenIcon, MinimizeIcon } from './Icons.tsx';
import type { TimeFormatPreference, DateFormatPreference } from './AmbientClock.tsx';
import { DailySmile } from './DailySmile.tsx';
import type { ViewMode } from './Header.tsx';

export type FocusContext = 'Work' | 'Home' | 'Rest' | 'Study';

export interface AppSettings {
  mode: 'hosted' | 'local';
  hostedModel: string;
  localModel: string;
  ollamaUrl: string;
  focusContext: FocusContext;
  enableQuietLog: boolean;
  enableAmbientClock?: boolean;
  enableDailySmile?: boolean;
  enableNatureView?: boolean;
  clockLocale?: string;
  clockTimeFormat?: TimeFormatPreference;
  clockDateFormat?: DateFormatPreference;
  clockTimeZone?: string;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onNavigate: (route: string) => void;
  isInstallable?: boolean;
  onInstall?: () => void;
  onForgetPreferences?: () => void;
  onOpenWelcome?: () => void;
  viewMode?: ViewMode;
  onSelectViewMode?: (mode: ViewMode) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onNavigate,
  isInstallable,
  onInstall,
  onForgetPreferences,
  onOpenWelcome,
  viewMode = 'auto',
  onSelectViewMode,
  isFullscreen,
  onToggleFullscreen,
}: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);

  useEffect(() => {
    let animTimer: NodeJS.Timeout;
    let unmountTimer: NodeJS.Timeout;

    if (isOpen) {
      setShouldRender(true);
      animTimer = setTimeout(() => setIsAnimatingIn(true), 20);
    } else {
      setIsAnimatingIn(false);
      unmountTimer = setTimeout(() => setShouldRender(false), 300);
    }

    return () => {
      clearTimeout(animTimer);
      clearTimeout(unmountTimer);
    };
  }, [isOpen]);

  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus first interactive element inside drawer
      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end transition-opacity duration-300 ${
        isAnimatingIn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel / Mobile bottom sheet */}
      <div
        ref={drawerRef}
        className={`relative z-10 w-full sm:max-w-md h-[88vh] sm:h-full bg-[var(--bg-page)] rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[var(--card-border)] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl transition-transform duration-300 ease-out ${
          isAnimatingIn
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
      >
        <div className="w-12 h-1 rounded-full bg-[var(--card-border)] mx-auto mb-3 sm:hidden" />
        <div className="space-y-7">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
            <h2 id="settings-heading" className="font-serif-card text-2xl text-[var(--text-ink)] font-normal tracking-tight">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[var(--subtle-ink)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors"
              aria-label="Close settings"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Current Focus Context Mode */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              Current Focus
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Work', 'Home', 'Rest', 'Study'] as FocusContext[]).map((ctx) => {
                const isSelected = settings.focusContext === ctx;
                return (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, focusContext: ctx })}
                    className={`py-2 px-2 text-xs tracking-wide rounded-md border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--card-bg)] text-[var(--text-ink)] font-medium shadow-xs ring-1 ring-[var(--accent-sage)]/20'
                        : 'border-[var(--card-border)] bg-transparent text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
                    }`}
                  >
                    {ctx}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--dim-text)]">
              Focuses the gentle action suggestion to your current setting.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              Execution Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, mode: 'hosted' })}
                className={`py-2 px-3 text-xs tracking-wide rounded-md border transition-all cursor-pointer text-center ${
                  settings.mode === 'hosted'
                    ? 'border-[var(--accent-sage)] bg-[var(--card-bg)] text-[var(--text-ink)] font-medium shadow-xs'
                    : 'border-[var(--card-border)] bg-transparent text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
                }`}
              >
                Hosted
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, mode: 'local' })}
                className={`py-2 px-3 text-xs tracking-wide rounded-md border transition-all cursor-pointer text-center ${
                  settings.mode === 'local'
                    ? 'border-[var(--accent-sage)] bg-[var(--card-bg)] text-[var(--text-ink)] font-medium shadow-xs'
                    : 'border-[var(--card-border)] bg-transparent text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
                }`}
              >
                Local (Ollama)
              </button>
            </div>
          </div>

          {/* Hosted Model Selection */}
          {settings.mode === 'hosted' && (
            <div className="space-y-2">
              <label htmlFor="hosted-model" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
                Gemma Model
              </label>
              <select
                id="hosted-model"
                value={settings.hostedModel}
                onChange={(e) => onUpdateSettings({ ...settings, hostedModel: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                <option value="gemma-4-26b-a4b-it">gemma-4-26b-a4b-it (default)</option>
                <option value="gemma-4-31b-it">gemma-4-31b-it</option>
              </select>
            </div>
          )}

          {/* Local Mode Fields */}
          {settings.mode === 'local' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="ollama-url" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
                  Ollama URL
                </label>
                <input
                  id="ollama-url"
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => onUpdateSettings({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full py-2 px-3 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="local-model" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
                  Ollama Model
                </label>
                <select
                  id="local-model"
                  value={settings.localModel}
                  onChange={(e) => onUpdateSettings({ ...settings, localModel: e.target.value })}
                  className="w-full py-2 px-3 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                >
                  <option value="gemma4:e2b">gemma4:e2b (default)</option>
                  <option value="gemma4:e4b">gemma4:e4b</option>
                </select>
              </div>

              <p className="text-xs text-[var(--dim-text)] leading-relaxed font-normal">
                Some browsers restrict calls to localhost from a hosted page. If that happens, run Still locally.
              </p>
            </div>
          )}

          {/* PWA Install Option */}
          {isInstallable && onInstall && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onInstall}
                className="w-full py-2.5 px-3 rounded-md text-xs font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Install Still on this device</span>
              </button>
            </div>
          )}

          {/* Local Quiet Log Toggle */}
          <div className="pt-3 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="enable-quiet-log"
                  className="block text-xs font-medium text-[var(--text-ink)]"
                >
                  Enable Local Quiet Log
                </label>
                <p className="text-[11px] text-[var(--dim-text)] leading-relaxed">
                  Stores your last 5 actions only in your browser.
                </p>
              </div>
              <button
                id="enable-quiet-log"
                type="button"
                role="switch"
                aria-checked={settings.enableQuietLog}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    enableQuietLog: !settings.enableQuietLog,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  settings.enableQuietLog
                    ? 'bg-[var(--accent-sage)]'
                    : 'bg-[var(--card-border)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    settings.enableQuietLog ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Display & View Layout */}
          <div className="pt-3 border-t border-[var(--card-border)] space-y-2.5">
            <h3 className="text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              Display & View Layout
            </h3>
            <p className="text-[11px] text-[var(--dim-text)] leading-relaxed">
              Switch between the expansive laptop full screen layout and the compact mobile view.
            </p>
            {onSelectViewMode && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectViewMode('laptop')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    viewMode === 'laptop'
                      ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-2xs'
                      : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)]'
                  }`}
                >
                  <LaptopIcon className="w-4 h-4" />
                  <span>Laptop View</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectViewMode('mobile')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    viewMode === 'mobile'
                      ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-2xs'
                      : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)]'
                  }`}
                >
                  <SmartphoneIcon className="w-4 h-4" />
                  <span>Mobile View</span>
                </button>
              </div>
            )}
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="w-full py-2 px-3 rounded-md text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[40px]"
              >
                {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5" /> : <FullscreenIcon className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Exit Full Screen' : 'Enter Laptop Full Screen'}</span>
              </button>
            )}
          </div>

          {/* Calm Presence Toggles */}
          <div className="pt-3 border-t border-[var(--card-border)] space-y-3">
            <h3 className="text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              Calm Presence
            </h3>

            {/* Ambient Reassurance Clock */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label htmlFor="enable-clock" className="block text-xs font-medium text-[var(--text-ink)]">
                  Ambient Reassurance Clock
                </label>
                <p className="text-[11px] text-[var(--dim-text)] leading-relaxed">
                  Quiet time-of-day reflections to soften rush and urgency.
                </p>
              </div>
              <button
                id="enable-clock"
                type="button"
                role="switch"
                aria-checked={!!settings.enableAmbientClock}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    enableAmbientClock: !settings.enableAmbientClock,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  settings.enableAmbientClock ? 'bg-[var(--accent-sage)]' : 'bg-[var(--card-border)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    settings.enableAmbientClock ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Region, Date & Time Format Sub-Panel */}
            {settings.enableAmbientClock && (
              <div className="p-3.5 rounded-md bg-[var(--input-bg)]/40 border border-[var(--card-border)] space-y-3.5 animate-card-enter">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--card-border)]/60">
                  <GlobeIcon className="w-4 h-4 text-[var(--accent-sage)]" />
                  <span className="text-xs font-medium text-[var(--text-ink)] tracking-wide">
                    World Region & Clock Format
                  </span>
                </div>

                {/* Region Preset */}
                <div className="space-y-1.5">
                  <label htmlFor="clock-locale" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-wider">
                    Region & Locale
                  </label>
                  <select
                    id="clock-locale"
                    value={settings.clockLocale || 'auto'}
                    onChange={(e) => onUpdateSettings({ ...settings, clockLocale: e.target.value })}
                    className="w-full py-2 px-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                  >
                    <option value="auto">🌍 Auto (Device Default)</option>
                    <option value="en-US">🇺🇸 United States & Americas (MM/DD/YYYY · 12h)</option>
                    <option value="en-GB">🇬🇧 United Kingdom & Ireland (DD/MM/YYYY · 24h)</option>
                    <option value="de-DE">🇩🇪 Central Europe / Germany (DD.MM.YYYY · 24h)</option>
                    <option value="fr-FR">🇫🇷 Western Europe / France (DD/MM/YYYY · 24h)</option>
                    <option value="es-ES">🇪🇸 Spain & Latin America (DD/MM/YYYY · 24h)</option>
                    <option value="ja-JP">🇯🇵 Japan (YYYY/MM/DD · 24h)</option>
                    <option value="zh-CN">🇨🇳 China (YYYY/MM/DD · 24h)</option>
                    <option value="en-IN">🇮🇳 India & South Asia (DD/MM/YYYY · 12h)</option>
                    <option value="ar-SA">🇸🇦 Middle East / Arabic</option>
                    <option value="en-AU">🇦🇺 Australia & New Zealand (DD/MM/YYYY · 12h)</option>
                    <option value="pt-BR">🇧🇷 Brazil & Portugal (DD/MM/YYYY · 24h)</option>
                  </select>
                </div>

                {/* 12-Hour vs 24-Hour */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-wider">
                    Clock System
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'auto', label: 'Auto' },
                      { value: '12h', label: '12-Hour' },
                      { value: '24h', label: '24-Hour' },
                    ].map((opt) => {
                      const isSelected = (settings.clockTimeFormat || 'auto') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onUpdateSettings({ ...settings, clockTimeFormat: opt.value as TimeFormatPreference })}
                          className={`py-1.5 px-2 text-xs rounded border transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-[var(--accent-sage)] bg-[var(--card-bg)] text-[var(--text-ink)] font-medium shadow-2xs'
                              : 'border-[var(--card-border)] bg-transparent text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Format Style */}
                <div className="space-y-1.5">
                  <label htmlFor="clock-date-format" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-wider">
                    Date Style
                  </label>
                  <select
                    id="clock-date-format"
                    value={settings.clockDateFormat || 'auto'}
                    onChange={(e) => onUpdateSettings({ ...settings, clockDateFormat: e.target.value as DateFormatPreference })}
                    className="w-full py-2 px-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                  >
                    <option value="auto">Default (Localized full date)</option>
                    <option value="long">Long (e.g. Saturday, October 24, 2026)</option>
                    <option value="medium">Medium (e.g. Sat, Oct 24, 2026)</option>
                    <option value="short">Short (e.g. 10/24/2026 or 24/10/2026)</option>
                    <option value="iso">ISO Standard (e.g. 2026-10-24)</option>
                  </select>
                </div>

                {/* Timezone (Optional Override) */}
                <div className="space-y-1.5">
                  <label htmlFor="clock-timezone" className="block text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-wider">
                    Time Zone
                  </label>
                  <select
                    id="clock-timezone"
                    value={settings.clockTimeZone || 'auto'}
                    onChange={(e) => onUpdateSettings({ ...settings, clockTimeZone: e.target.value })}
                    className="w-full py-2 px-2.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                  >
                    <option value="auto">🌐 Device Timezone (Local)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">New York (US Eastern)</option>
                    <option value="America/Chicago">Chicago (US Central)</option>
                    <option value="America/Denver">Denver (US Mountain)</option>
                    <option value="America/Los_Angeles">Los Angeles / San Francisco (US Pacific)</option>
                    <option value="Europe/London">London / Dublin (GMT / BST)</option>
                    <option value="Europe/Berlin">Berlin / Frankfurt (CET / CEST)</option>
                    <option value="Europe/Paris">Paris / Rome (CET / CEST)</option>
                    <option value="Asia/Dubai">Dubai / Gulf (GST)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney / Melbourne (AEST / AEDT)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Interactive 3D Nature View */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label htmlFor="enable-nature" className="block text-xs font-medium text-[var(--text-ink)]">
                  Interactive 3D Nature
                </label>
                <p className="text-[11px] text-[var(--dim-text)] leading-relaxed">
                  A serene, slow-moving 3D forest scene you can explore with your pointer.
                </p>
              </div>
              <button
                id="enable-nature"
                type="button"
                role="switch"
                aria-checked={!!settings.enableNatureView}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    enableNatureView: !settings.enableNatureView,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  settings.enableNatureView ? 'bg-[var(--accent-sage)]' : 'bg-[var(--card-border)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    settings.enableNatureView ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* A little break */}
          <div className="pt-4 border-t border-[var(--card-border)] space-y-2.5">
            <h3 className="text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              A little break
            </h3>
            <DailySmile />
          </div>

          {/* Preferences Reset */}
          {onForgetPreferences && (
            <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-medium text-[var(--text-ink)]">
                  Preferences
                </span>
                <p className="text-[11px] text-[var(--dim-text)] leading-relaxed">
                  Reset onboarding choices and avoid filters.
                </p>
              </div>
              <button
                type="button"
                onClick={onForgetPreferences}
                className="min-h-[44px] px-3.5 py-2 rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] text-xs text-[var(--text-ink)] hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
              >
                Forget my preferences
              </button>
            </div>
          )}

          {/* What Still refuses to do */}
          <div className="pt-4 border-t border-[var(--card-border)] space-y-2.5">
            <h3 className="text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-widest">
              What Still refuses to do
            </h3>
            <ul className="text-xs space-y-1.5 text-[var(--subtle-ink)] pl-1">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Plan.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>List.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Keep what you wrote.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Score.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Notify.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Sync.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-[var(--card-border)] space-y-2">
          {onOpenWelcome && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWelcome();
              }}
              className="w-full py-2.5 px-3 rounded-md text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              What is Still?
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onNavigate('/selftest');
            }}
            className="w-full py-2 px-3 rounded-md text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] bg-transparent border border-transparent hover:border-[var(--card-border)] transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center"
          >
            Run Self Test suite
          </button>
        </div>
      </div>
    </div>
  );
}
