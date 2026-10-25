import React from 'react';
import {
  SettingsIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  SmartphoneIcon,
  FullscreenIcon,
  MinimizeIcon,
} from './Icons.tsx';
import { StillLogo } from './StillLogo.tsx';

export type ViewMode = 'laptop' | 'mobile' | 'auto';

interface HeaderProps {
  mode: 'hosted' | 'local';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onNavigateHome?: () => void;
  viewMode?: ViewMode;
  onSelectViewMode?: (mode: ViewMode) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function Header({
  mode,
  theme,
  onToggleTheme,
  onOpenSettings,
  onNavigateHome,
  viewMode = 'auto',
  onSelectViewMode,
  isFullscreen,
  onToggleFullscreen,
}: HeaderProps) {
  const chipLabel = mode === 'hosted' ? 'Gemma 4 · hosted' : 'Gemma 4 · on your machine';

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-4 sm:py-6 px-1 border-b border-[var(--card-border)] mb-6 sm:mb-8 transition-colors">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded p-1 cursor-pointer transition-opacity duration-200"
        aria-label="Still home"
      >
        <StillLogo size="sm" showText={false} animated={false} />
        <span className="font-serif-card font-medium text-xl tracking-tight text-[var(--text-ink)]">
          Still
        </span>
        <span className="hidden md:inline-block text-xs text-[var(--dim-text)] font-normal border-l border-[var(--card-border)] pl-2.5 ml-0.5">
          One gentle thing
        </span>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Device View Segmented Controls */}
        {onSelectViewMode && (
          <div
            className="flex items-center p-0.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-xs shadow-2xs"
            role="group"
            aria-label="Device view"
          >
            <button
              type="button"
              onClick={() => onSelectViewMode('laptop')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md min-h-[36px] transition-colors cursor-pointer font-medium ${
                viewMode === 'laptop'
                  ? 'bg-[var(--accent-sage)] text-white shadow-2xs'
                  : 'text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
              }`}
              title="Laptop Full Screen View"
              aria-pressed={viewMode === 'laptop'}
            >
              <LaptopIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laptop</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md min-h-[36px] transition-colors cursor-pointer font-medium ${
                viewMode === 'mobile'
                  ? 'bg-[var(--accent-sage)] text-white shadow-2xs'
                  : 'text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
              }`}
              title="Mobile View"
              aria-pressed={viewMode === 'mobile'}
            >
              <SmartphoneIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        )}

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[var(--subtle-ink)] hover:text-[var(--text-ink)] hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors duration-200"
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            title={isFullscreen ? 'Exit full screen (Esc)' : 'Enter laptop full screen'}
          >
            {isFullscreen ? (
              <MinimizeIcon className="w-4 h-4 text-[var(--accent-sage)]" />
            ) : (
              <FullscreenIcon className="w-4 h-4 text-[var(--subtle-ink)]" />
            )}
          </button>
        )}

        <span
          className="hidden lg:inline-flex text-xs px-2.5 py-1 rounded bg-[var(--card-bg)] text-[var(--subtle-ink)] border border-[var(--card-border)] font-normal tracking-wide"
          role="status"
        >
          {chipLabel}
        </span>

        <button
          onClick={onToggleTheme}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[var(--subtle-ink)] hover:text-[var(--text-ink)] hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors duration-200"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <SunIcon className="w-4 h-4 text-[var(--accent-sage)]" />
          ) : (
            <MoonIcon className="w-4 h-4 text-[var(--subtle-ink)]" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[var(--subtle-ink)] hover:text-[var(--text-ink)] hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer transition-colors duration-200"
          aria-label="Open settings drawer"
          title="Open settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
