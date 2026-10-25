import React, { useState, useEffect } from 'react';
import { Header, ViewMode } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { SettingsDrawer, AppSettings } from './components/SettingsDrawer.tsx';
import { InputState } from './components/InputState.tsx';
import { CardState } from './components/CardState.tsx';
import { ClosedState } from './components/ClosedState.tsx';
import { CareCard } from './components/CareCard.tsx';
import { RestCard } from './components/RestCard.tsx';
import { QuietIntro } from './components/QuietIntro.tsx';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { SelfTestPage } from './pages/SelfTestPage.tsx';
import { LabPage } from './pages/LabPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';
import { QuietLogPage } from './pages/QuietLogPage.tsx';
import { AmbientClock } from './components/AmbientClock.tsx';
import { DailySmile } from './components/DailySmile.tsx';
import { Card, validate } from './shared/validator.ts';
import { pickFallback, pickMicro } from './shared/fallback.ts';
import { needsCare } from './shared/safety.ts';
import { isSmaller } from './shared/helpers.ts';
import { executeLocalOllama } from './services/localOllama.ts';
import { usePWAInstall } from './hooks/usePWAInstall.ts';
import { addQuietLogEntry } from './services/quietLog.ts';
import type { UserPreferences, UserProfile, EnergyLevel } from './shared/preferences.ts';
import { validateAvoidPreferences } from './shared/preferences.ts';
import { DebugPanel, DebugInfo } from './components/DebugPanel.tsx';

const AmbientNatureView = React.lazy(() =>
  import('./components/AmbientNatureView.tsx').then((m) => ({ default: m.AmbientNatureView }))
);

const SETTINGS_KEY = 'still_app_settings_v1';
const THEME_KEY = 'still_theme_preference';
const PREFERENCES_KEY = 'still_preferences';
const INTRO_SEEN_KEY = 'still_intro_seen';
const WELCOME_SEEN_KEY = 'still_seen_welcome';
const VIEW_MODE_KEY = 'still_view_mode';

function loadViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode;
    if (saved === 'laptop' || saved === 'mobile' || saved === 'auto') {
      return saved;
    }
  } catch {
    // Ignore localStorage failures
  }
  return 'auto';
}

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'hosted',
  hostedModel: 'gemma-4-26b-a4b-it',
  localModel: 'gemma4:e2b',
  ollamaUrl: 'http://localhost:11434',
  focusContext: 'Home',
  enableQuietLog: false,
  enableAmbientClock: true,
  enableNatureView: false,
  clockLocale: 'auto',
  clockTimeFormat: 'auto',
  clockDateFormat: 'auto',
  clockTimeZone: 'auto',
};


// Clear previous answers, preferences, and intro state on load as requested by user
try {
  const resetFlag = 'still_reset_all_v5';
  if (!localStorage.getItem(resetFlag)) {
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(INTRO_SEEN_KEY);
    localStorage.removeItem(WELCOME_SEEN_KEY);
    localStorage.removeItem('still_quiet_log');
    localStorage.setItem(resetFlag, 'true');
  }
} catch {
  // Ignore localStorage failures
}

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore localStorage failures
  }
  return {};
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore localStorage failures
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage failures
  }
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.pathname || '/');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const { isInstallable, install } = usePWAInstall();

  // Development debug panel: shown only locally with ?debug=1
  const [isDebugMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]' ||
      Boolean(import.meta.env.DEV);
    const hasDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    return isLocal && hasDebug;
  });
  const [lastRequestDebug, setLastRequestDebug] = useState<DebugInfo | null>(null);

  // App View mode: laptop widescreen vs mobile phone view
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!document.fullscreenElement;
    }
    return false;
  });

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function handleToggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  function handleSelectViewMode(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }

  // Onboarding Intro & User Preferences state
  const [seenWelcome, setSeenWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WELCOME_SEEN_KEY) === 'true';
    } catch {
      return false; // if storage is unavailable, show it each session
    }
  });
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);

  const [introSeen, setIntroSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) === 'true';
    } catch {
      return true;
    }
  });
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(loadPreferences);
  const [energy, setEnergy] = useState<EnergyLevel | undefined>(undefined);

  function handleWelcomeGetStarted() {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
    setSeenWelcome(true);
    setIsWelcomeModalOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function handleIntroComplete(prefs: UserPreferences) {
    setIntroSeen(true);
    setUserPrefs(prefs);
    if (prefs.energy) {
      setEnergy(prefs.energy);
    }
    if (prefs.focus && prefs.focus !== settings.focusContext) {
      handleUpdateSettings({ ...settings, focusContext: prefs.focus });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function handleForgetPreferences() {
    try {
      localStorage.removeItem(PREFERENCES_KEY);
      localStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      // ignore
    }
    setUserPrefs({});
    setIntroSeen(false);
  }



  // Dark/Light mode state: default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Fallback
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } catch {
      // Ignore
    }
  }, [theme]);

  function handleToggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  // Core application states (kept in React memory only)
  const [screenState, setScreenState] = useState<'input' | 'card' | 'closed' | 'care' | 'rest'>('input');
  const [dump, setDump] = useState<string>('');
  const [card, setCard] = useState<Card | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [tooMuchLevel, setTooMuchLevel] = useState<number>(0);
  const [previousCard, setPreviousCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTooMuch, setIsLoadingTooMuch] = useState<boolean>(false);
  const [isDecompressing, setIsDecompressing] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | undefined>(undefined);
  const BUSY_USER_MESSAGE = 'Still is resting for a moment. You can try again soon, or switch to Local mode in Settings.';

  // Browser navigation support (back/forward)
  useEffect(() => {
    function handlePopState() {
      setCurrentRoute(window.location.pathname || '/');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Escape key listener: if card is open and drawer is closed, gently clear state
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSettingsOpen && screenState === 'card') {
        clearState();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, screenState]);

  // When card state is activated or card updates, ensure window is scrolled to top so user sees the full card & header
  useEffect(() => {
    if (screenState === 'card' || screenState === 'care' || screenState === 'closed') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [screenState, card]);

  function navigateTo(route: string) {
    if (route !== window.location.pathname) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo(0, 0);
    }
  }

  function handleUpdateSettings(newSettings: AppSettings) {
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  // Clear all in-memory task state
  function clearState() {
    setDump('');
    setCard(null);
    setIsFallback(false);
    setTooMuchLevel(0);
    setPreviousCard(null);
    setErrorNotice(null);
    setFallbackNote(undefined);
    setIsLoading(false);
    setIsLoadingTooMuch(false);
    setIsDecompressing(false);
    setIsTimerActive(false);
    setScreenState('input');
  }

  const currentProfile: UserProfile = {
    focus: userPrefs.focus || settings.focusContext,
    helps: userPrefs.helps,
    avoid: userPrefs.avoid,
    energy,
  };

  // Action: "Too overwhelmed to type?" (bypass AI, serve 1-minute pickMicro card, log locally)
  function handleOverwhelmed() {
    const microCard = pickMicro(currentProfile.avoid);
    if (settings.enableQuietLog) {
      addQuietLogEntry({
        action: microCard.action,
        why_gentle: microCard.why_gentle,
        time_box_minutes: microCard.time_box_minutes,
        context: settings.focusContext,
      });
    }
    setCard(microCard);
    setIsFallback(true);
    setPreviousCard(microCard);
    setTooMuchLevel(0);
    setIsTimerActive(false);
    setScreenState('card');
  }

  // Action: "Give me one thing"
  async function handleGiveOneThing() {
    const trimmed = dump.trim();
    if (!trimmed || isLoading) return;

    setErrorNotice(null);

    // 1. Safety check first: no model call, no logging
    if (needsCare(trimmed)) {
      setScreenState('care');
      return;
    }

    setIsLoading(true);
    setIsTimerActive(false);

    if (settings.mode === 'hosted') {
      try {
        const response = await fetch('/api/still', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dump: trimmed,
            model: settings.hostedModel,
            context: settings.focusContext,
            profile: currentProfile,
          }),
        });

        if (response.status === 429) {
          const fb = pickFallback(currentProfile.avoid);
          setIsDecompressing(true);
          await new Promise((r) => setTimeout(r, 150));
          setCard(fb);
          setIsFallback(true);
          setFallbackNote(BUSY_USER_MESSAGE);
          setPreviousCard(fb);
          setTooMuchLevel(0);
          setIsTimerActive(false);
          setScreenState('card');
          setIsDecompressing(false);
          setErrorNotice(BUSY_USER_MESSAGE);
          setLastRequestDebug({
            model: settings.hostedModel,
            attempts: 0,
            failures: ['busy'],
            latencyMs: 0,
            source: 'fallback',
            isBusy: true,
            timestamp: new Date(),
          });
          setIsLoading(false);
          return;
        }

        if (!response.ok && response.status !== 502) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        const isBusy = Boolean(
          data.busy ||
          data.reason === 'busy' ||
          (Array.isArray(data.failures) && data.failures.includes('busy'))
        );

        setLastRequestDebug({
          model: data.model || settings.hostedModel,
          attempts: data.attempts ?? 1,
          failures: Array.isArray(data.failures) ? data.failures : [],
          latencyMs: data.latencyMs ?? 0,
          source: data.source || 'fallback',
          isBusy,
          quota: data.quota,
          timestamp: new Date(),
        });

        if (isBusy) {
          setErrorNotice(BUSY_USER_MESSAGE);
        }

        if (data.care) {
          setScreenState('care');
          setIsLoading(false);
          return;
        }

        let candidateCard: Card = data.card;
        let isCardFallback = data.source === 'fallback';

        // Never render a card that has not passed validate() or violates avoid choices
        const valRes = validate(candidateCard);
        const avoidRes = validateAvoidPreferences(candidateCard.action, currentProfile.avoid);
        if (!valRes.ok || !avoidRes.ok) {
          candidateCard = pickFallback(currentProfile.avoid);
          isCardFallback = true;
        }

        // Decompression animation: gently fade out and collapse text box (150ms)
        setIsDecompressing(true);
        await new Promise((r) => setTimeout(r, 150));

        setCard(candidateCard);
        setIsFallback(isCardFallback);
        setFallbackNote(data.note || (isBusy ? BUSY_USER_MESSAGE : undefined));
        setPreviousCard(candidateCard);
        setTooMuchLevel(0);
        setIsTimerActive(false);
        setScreenState('card');
        setIsDecompressing(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_err: unknown) {
        setLastRequestDebug({
          model: settings.hostedModel,
          attempts: 1,
          failures: ['timeout'],
          latencyMs: 0,
          source: 'fallback',
          timestamp: new Date(),
        });
        if (!navigator.onLine) {
          setErrorNotice('You seem to be offline. Local mode works without internet.');
        } else {
          // Model unavailable or timeout: show fallback card with dim note
          const fb = pickFallback(currentProfile.avoid);
          setIsDecompressing(true);
          await new Promise((r) => setTimeout(r, 150));
          setCard(fb);
          setIsFallback(true);
          setPreviousCard(fb);
          setTooMuchLevel(0);
          setIsTimerActive(false);
          setScreenState('card');
          setIsDecompressing(false);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Ollama mode
      try {
        const res = await executeLocalOllama(trimmed, settings.ollamaUrl, settings.localModel, false, settings.focusContext);
        setLastRequestDebug({
          model: res.model || settings.localModel,
          attempts: res.attempts ?? 1,
          failures: res.source === 'fallback' ? [res.ollamaError ? 'model not found' : 'timeout'] : [],
          latencyMs: res.latencyMs ?? 0,
          source: res.source || 'fallback',
          timestamp: new Date(),
        });
        if (res.ollamaError) {
          setErrorNotice(res.ollamaError);
        }

        let candidateCard: Card = res.card;
        let isCardFallback = res.source === 'fallback';

        const valRes = validate(candidateCard);
        const avoidRes = validateAvoidPreferences(candidateCard.action, currentProfile.avoid);
        if (!valRes.ok || !avoidRes.ok) {
          candidateCard = pickFallback(currentProfile.avoid);
          isCardFallback = true;
        }

        setIsDecompressing(true);
        await new Promise((r) => setTimeout(r, 150));

        setCard(candidateCard);
        setIsFallback(isCardFallback);
        setPreviousCard(candidateCard);
        setTooMuchLevel(0);
        setIsTimerActive(false);
        setScreenState('card');
        setIsDecompressing(false);
      } catch (_err: unknown) {
        const fb = pickFallback(currentProfile.avoid);
        setIsDecompressing(true);
        await new Promise((r) => setTimeout(r, 150));
        setCard(fb);
        setIsFallback(true);
        setPreviousCard(fb);
        setTooMuchLevel(0);
        setIsTimerActive(false);
        setScreenState('card');
        setIsDecompressing(false);
      } finally {
        setIsLoading(false);
      }
    }
  }

  // Action: "Too much" ladder
  async function handleTooMuch() {
    if (isLoadingTooMuch) return;
    setErrorNotice(null);
    setIsTimerActive(false);

    const currentLevel = tooMuchLevel;
    const prev = card || previousCard;

    if (currentLevel === 0) {
      // Level 1: call model with tooMuch=true, apply isSmaller guard and avoid check
      setIsLoadingTooMuch(true);
      if (settings.mode === 'hosted') {
        try {
          const response = await fetch('/api/still', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dump: dump.trim(),
              tooMuch: true,
              model: settings.hostedModel,
              context: settings.focusContext,
              profile: currentProfile,
            }),
          });

          if (response.status === 429) {
            const micro = pickMicro(currentProfile.avoid);
            setCard(micro);
            setIsFallback(true);
            setFallbackNote(BUSY_USER_MESSAGE);
            setPreviousCard(micro);
            setTooMuchLevel(1);
            setErrorNotice(BUSY_USER_MESSAGE);
            setLastRequestDebug({
              model: settings.hostedModel,
              attempts: 0,
              failures: ['busy'],
              latencyMs: 0,
              source: 'fallback',
              isBusy: true,
              timestamp: new Date(),
            });
            setIsLoadingTooMuch(false);
            return;
          }

          const data = await response.json();
          const isBusy = Boolean(
            data.busy ||
            data.reason === 'busy' ||
            (Array.isArray(data.failures) && data.failures.includes('busy'))
          );

          setLastRequestDebug({
            model: data.model || settings.hostedModel,
            attempts: data.attempts ?? 1,
            failures: Array.isArray(data.failures) ? data.failures : [],
            latencyMs: data.latencyMs ?? 0,
            source: data.source || 'fallback',
            isBusy,
            quota: data.quota,
            timestamp: new Date(),
          });

          if (isBusy) {
            setErrorNotice(BUSY_USER_MESSAGE);
          }

          let candidate = data.card;
          let isFb = data.source === 'fallback';

          const val = validate(candidate);
          const avoidRes = validateAvoidPreferences(candidate.action, currentProfile.avoid);
          if (!val.ok || !avoidRes.ok || (prev && !isSmaller(candidate, prev))) {
            // Guard: if new card is NOT smaller than previous or violates avoid, use pickMicro()
            candidate = pickMicro(currentProfile.avoid);
            isFb = true;
          }

          setCard(candidate);
          setIsFallback(isFb);
          setFallbackNote(data.note || (isBusy ? BUSY_USER_MESSAGE : undefined));
          setPreviousCard(candidate);
          setTooMuchLevel(1);
        } catch {
          const micro = pickMicro(currentProfile.avoid);
          setCard(micro);
          setIsFallback(true);
          setPreviousCard(micro);
          setTooMuchLevel(1);
        } finally {
          setIsLoadingTooMuch(false);
        }
      } else {
        // Local mode tooMuch
        try {
          const res = await executeLocalOllama(dump.trim(), settings.ollamaUrl, settings.localModel, true, settings.focusContext);
          let candidate = res.card;
          let isFb = res.source === 'fallback';

          const val = validate(candidate);
          const avoidRes = validateAvoidPreferences(candidate.action, currentProfile.avoid);
          if (!val.ok || !avoidRes.ok || (prev && !isSmaller(candidate, prev))) {
            candidate = pickMicro(currentProfile.avoid);
            isFb = true;
          }

          setCard(candidate);
          setIsFallback(isFb);
          setPreviousCard(candidate);
          setTooMuchLevel(1);
        } catch {
          const micro = pickMicro(currentProfile.avoid);
          setCard(micro);
          setIsFallback(true);
          setPreviousCard(micro);
          setTooMuchLevel(1);
        } finally {
          setIsLoadingTooMuch(false);
        }
      }
    } else if (currentLevel === 1) {
      // Level 2: show pickMicro() locally (no model)
      const micro = pickMicro(currentProfile.avoid);
      setCard(micro);
      setIsFallback(true);
      setPreviousCard(micro);
      setTooMuchLevel(2);
    } else {
      // Level 3: show the rest card (REST_MESSAGE) with only "Start fresh"
      setScreenState('rest');
      setTooMuchLevel(3);
    }
  }

  // Render secondary routes with responsive width for laptop and mobile
  if (currentRoute === '/selftest') {
    return (
      <main className="min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        <div className={viewMode === 'mobile' ? 'w-full max-w-[420px] mx-auto rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl p-4 sm:p-5' : 'w-full max-w-4xl xl:max-w-5xl'}>
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          <SelfTestPage onNavigateHome={() => navigateTo('/')} />
          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      </main>
    );
  }

  if (currentRoute === '/lab') {
    return (
      <main className="min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        <div className={viewMode === 'mobile' ? 'w-full max-w-[420px] mx-auto rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl p-4 sm:p-5' : 'w-full max-w-4xl xl:max-w-5xl'}>
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          <LabPage onNavigateHome={() => navigateTo('/')} />
          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      </main>
    );
  }

  if (currentRoute === '/privacy') {
    return (
      <main className="min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        <div className={viewMode === 'mobile' ? 'w-full max-w-[420px] mx-auto rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl p-4 sm:p-5' : 'w-full max-w-4xl xl:max-w-5xl'}>
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          <PrivacyPage onNavigateHome={() => navigateTo('/')} />
          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      </main>
    );
  }

  if (currentRoute === '/terms') {
    return (
      <main className="min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        <div className={viewMode === 'mobile' ? 'w-full max-w-[420px] mx-auto rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl p-4 sm:p-5' : 'w-full max-w-4xl xl:max-w-5xl'}>
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          <TermsPage onNavigateHome={() => navigateTo('/')} />
          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      </main>
    );
  }

  if (currentRoute === '/log') {
    return (
      <main className="min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        <div className={viewMode === 'mobile' ? 'w-full max-w-[420px] mx-auto rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl p-4 sm:p-5' : 'w-full max-w-4xl xl:max-w-5xl'}>
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          <QuietLogPage onNavigateHome={() => navigateTo('/')} />
          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      </main>
    );
  }

  // Main Still application flow (clean, quiet, editorial layout)
  const isMobileView = viewMode === 'mobile';

  return (
    <main className="relative min-h-[100dvh] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-6 flex justify-center items-start">
      {(!seenWelcome || isWelcomeModalOpen) && (
        <WelcomeScreen
          mode={settings.mode}
          onGetStarted={handleWelcomeGetStarted}
        />
      )}

      {seenWelcome && !isWelcomeModalOpen && !introSeen && (
        <QuietIntro onComplete={handleIntroComplete} />
      )}

      {isMobileView ? (
        /* Mobile View: On desktop, wrapped in a sleek smartphone shell; on phone, native full width */
        <div className="relative z-10 w-full max-w-[420px] mx-auto my-2 sm:my-6 rounded-[36px] sm:border-[6px] sm:border-[var(--card-border)] bg-[var(--bg-page)] sm:shadow-2xl overflow-hidden flex flex-col min-h-[700px] animate-fade-in transition-all">
          {/* Subtle phone status header on larger screens */}
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] text-[var(--dim-text)] select-none border-b border-[var(--card-border)]/40">
            <span className="font-semibold text-xs tracking-tight">Still Mobile</span>
            <div className="w-16 h-3 bg-[var(--card-border)]/80 rounded-full mx-auto" />
            <span className="text-[10px] text-[var(--accent-sage)] font-medium">390×844</span>
          </div>

          <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <Header
                mode={settings.mode}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onNavigateHome={() => navigateTo('/')}
                viewMode={viewMode}
                onSelectViewMode={handleSelectViewMode}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />

              {settings.enableNatureView && (
                <div className="mb-4">
                  <React.Suspense fallback={null}>
                    <AmbientNatureView
                      mode="side"
                      onModeChange={(m) => handleUpdateSettings({ ...settings, enableNatureView: m !== 'off' })}
                      theme={theme}
                    />
                  </React.Suspense>
                </div>
              )}

              {screenState === 'input' && settings.enableAmbientClock && (
                <AmbientClock
                  locale={settings.clockLocale}
                  timeFormat={settings.clockTimeFormat}
                  dateFormat={settings.clockDateFormat}
                  timeZone={settings.clockTimeZone}
                />
              )}

              {errorNotice && (
                <div
                  className="mb-6 p-4 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--subtle-ink)] leading-relaxed space-y-2.5 shadow-xs"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs leading-relaxed text-[var(--subtle-ink)]">{errorNotice}</p>
                    <button
                      onClick={() => setErrorNotice(null)}
                      className="text-xs text-[var(--dim-text)] hover:text-[var(--text-ink)] underline cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                  {settings.mode === 'local' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateSettings({ ...settings, mode: 'hosted' });
                          setErrorNotice(null);
                        }}
                        className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] cursor-pointer transition-colors shadow-xs"
                      >
                        Switch to Hosted mode
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="min-h-[360px] flex flex-col justify-center">
                {screenState === 'input' && (
                  <InputState
                    dump={dump}
                    onDumpChange={setDump}
                    onSubmit={handleGiveOneThing}
                    onOverwhelmed={handleOverwhelmed}
                    isLoading={isLoading}
                    isDecompressing={isDecompressing}
                    mode={settings.mode}
                    energy={energy}
                    onEnergyChange={setEnergy}
                  />
                )}

                {screenState === 'card' && card && (
                  <CardState
                    card={card}
                    isFallback={isFallback}
                    profile={currentProfile}
                    onDoable={() => {
                      if (settings.enableQuietLog && card) {
                        addQuietLogEntry({
                          action: card.action,
                          why_gentle: card.why_gentle,
                          time_box_minutes: card.time_box_minutes,
                          context: settings.focusContext,
                        });
                      }
                      setIsTimerActive(false);
                      setScreenState('closed');
                    }}
                    onDone={() => {
                      if (settings.enableQuietLog && card) {
                        addQuietLogEntry({
                          action: card.action,
                          why_gentle: card.why_gentle,
                          time_box_minutes: card.time_box_minutes,
                          context: settings.focusContext,
                        });
                      }
                      setIsTimerActive(false);
                      setScreenState('closed');
                    }}
                    isTimerActive={isTimerActive}
                    onTooMuch={handleTooMuch}
                    onForget={clearState}
                    isLoadingTooMuch={isLoadingTooMuch}
                  />
                )}

                {screenState === 'closed' && (
                  <ClosedState onStartFresh={clearState} />
                )}

                {screenState === 'care' && (
                  <CareCard onStartFresh={clearState} region={settings.clockLocale} />
                )}

                {screenState === 'rest' && (
                  <RestCard onStartFresh={clearState} />
                )}
              </div>
            </div>

            <Footer mode={settings.mode} onNavigate={navigateTo} />
          </div>
        </div>
      ) : (
        /* Laptop Full Screen View: Widescreen dual-column companion & action workspace */
        <div className="relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto py-2 sm:py-4 transition-all">
          <Header
            mode={settings.mode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateHome={() => navigateTo('/')}
            viewMode={viewMode}
            onSelectViewMode={handleSelectViewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            {/* Left Companion Column on Laptop View */}
            <aside className="hidden lg:flex lg:col-span-5 flex-col space-y-5">
              {/* Ambient Clock in Companion panel */}
              {settings.enableAmbientClock && (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-5 shadow-xs">
                  <AmbientClock
                    locale={settings.clockLocale}
                    timeFormat={settings.clockTimeFormat}
                    dateFormat={settings.clockDateFormat}
                    timeZone={settings.clockTimeZone}
                  />
                </div>
              )}

              {/* 3D Nature Banner */}
              {settings.enableNatureView && (
                <React.Suspense fallback={null}>
                  <AmbientNatureView
                    mode="side"
                    onModeChange={(m) => handleUpdateSettings({ ...settings, enableNatureView: m !== 'off' })}
                    theme={theme}
                  />
                </React.Suspense>
              )}

              {/* Space Focus Switcher Card */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--dim-text)] uppercase tracking-wider">
                    Current Space Focus
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent-sage)]">
                    {settings.focusContext}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {(['Work', 'Study', 'Home', 'Rest'] as const).map((space) => (
                    <button
                      key={space}
                      type="button"
                      onClick={() => handleUpdateSettings({ ...settings, focusContext: space })}
                      className={`py-2 px-2 text-xs rounded-md border font-medium transition-colors cursor-pointer text-center ${
                        settings.focusContext === space
                          ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-2xs font-semibold'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--subtle-ink)] hover:text-[var(--text-ink)] hover:border-[var(--accent-sage)]'
                      }`}
                    >
                      {space}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Mind Freshener */}
              <DailySmile />
            </aside>

            {/* Right Action Canvas on Laptop View */}
            <div className="lg:col-span-7 flex flex-col justify-start min-h-[440px] space-y-4">
              {/* On screens smaller than lg, show clock & nature view here */}
              <div className="lg:hidden">
                {screenState === 'input' && settings.enableAmbientClock && (
                  <AmbientClock
                    locale={settings.clockLocale}
                    timeFormat={settings.clockTimeFormat}
                    dateFormat={settings.clockDateFormat}
                    timeZone={settings.clockTimeZone}
                  />
                )}
                {settings.enableNatureView && (
                  <div className="mb-4">
                    <React.Suspense fallback={null}>
                      <AmbientNatureView
                        mode="side"
                        onModeChange={(m) => handleUpdateSettings({ ...settings, enableNatureView: m !== 'off' })}
                        theme={theme}
                      />
                    </React.Suspense>
                  </div>
                )}
              </div>

              {errorNotice && (
                <div
                  className="mb-6 p-4 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--subtle-ink)] leading-relaxed space-y-2.5 shadow-xs"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs leading-relaxed text-[var(--subtle-ink)]">{errorNotice}</p>
                    <button
                      onClick={() => setErrorNotice(null)}
                      className="text-xs text-[var(--dim-text)] hover:text-[var(--text-ink)] underline cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                  {settings.mode === 'local' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateSettings({ ...settings, mode: 'hosted' });
                          setErrorNotice(null);
                        }}
                        className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] cursor-pointer transition-colors shadow-xs"
                      >
                        Switch to Hosted mode
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main Interactive State */}
              <div>
                {screenState === 'input' && (
                  <InputState
                    dump={dump}
                    onDumpChange={setDump}
                    onSubmit={handleGiveOneThing}
                    onOverwhelmed={handleOverwhelmed}
                    isLoading={isLoading}
                    isDecompressing={isDecompressing}
                    mode={settings.mode}
                    energy={energy}
                    onEnergyChange={setEnergy}
                  />
                )}

                {screenState === 'card' && card && (
                  <CardState
                    card={card}
                    isFallback={isFallback}
                    fallbackNote={fallbackNote}
                    profile={currentProfile}
                    onDoable={() => {
                      if (settings.enableQuietLog && card) {
                        addQuietLogEntry({
                          action: card.action,
                          why_gentle: card.why_gentle,
                          time_box_minutes: card.time_box_minutes,
                          context: settings.focusContext,
                        });
                      }
                      setIsTimerActive(false);
                      setScreenState('closed');
                    }}
                    onDone={() => {
                      if (settings.enableQuietLog && card) {
                        addQuietLogEntry({
                          action: card.action,
                          why_gentle: card.why_gentle,
                          time_box_minutes: card.time_box_minutes,
                          context: settings.focusContext,
                        });
                      }
                      setIsTimerActive(false);
                      setScreenState('closed');
                    }}
                    isTimerActive={isTimerActive}
                    onTooMuch={handleTooMuch}
                    onForget={clearState}
                    isLoadingTooMuch={isLoadingTooMuch}
                  />
                )}

                {screenState === 'closed' && (
                  <ClosedState onStartFresh={clearState} />
                )}

                {screenState === 'care' && (
                  <CareCard onStartFresh={clearState} region={settings.clockLocale} />
                )}

                {screenState === 'rest' && (
                  <RestCard onStartFresh={clearState} />
                )}
              </div>
            </div>
          </div>

          <Footer mode={settings.mode} onNavigate={navigateTo} />
        </div>
      )}

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onNavigate={navigateTo}
        isInstallable={isInstallable}
        onInstall={install}
        onForgetPreferences={handleForgetPreferences}
        onOpenWelcome={() => setIsWelcomeModalOpen(true)}
        viewMode={viewMode}
        onSelectViewMode={handleSelectViewMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
      {isDebugMode && <DebugPanel debugInfo={lastRequestDebug} />}
    </main>
  );
}
