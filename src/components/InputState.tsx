import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './Icons.tsx';
import type { EnergyLevel } from '../shared/preferences.ts';

interface InputStateProps {
  dump: string;
  onDumpChange: (text: string) => void;
  onSubmit: () => void;
  onOverwhelmed: () => void;
  isLoading: boolean;
  isDecompressing?: boolean;
  mode?: 'hosted' | 'local';
  energy?: EnergyLevel;
  onEnergyChange?: (energy: EnergyLevel | undefined) => void;
}

const EXAMPLE_CHIPS = [
  "deadline thursday, boss emailed 3x, exhausted",
  "too many tabs open, laundry piling up, head spinning",
  "exam tomorrow, haven't opened notes, feeling paralyzed",
];

export function InputState({
  dump,
  onDumpChange,
  onSubmit,
  onOverwhelmed,
  isLoading,
  isDecompressing,
  mode = 'hosted',
  energy,
  onEnergyChange,
}: InputStateProps) {
  const trimmed = dump.trim();
  const isDisabled = trimmed.length === 0 || isLoading;
  const showCounter = dump.length > 800;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  async function handleToggleVoice() {
    setSpeechNotice(null);

    // If currently listening, stop
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('Voice input is not supported by your browser. You can type directly.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      let baseText = dump;

      recognition.onstart = () => {
        setIsListening(true);
        baseText = dump;
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        const combined = baseText
          ? `${baseText.trim()} ${transcript.trim()}`
          : transcript.trim();

        if (combined.length <= 1000) {
          onDumpChange(combined);
        } else {
          onDumpChange(combined.slice(0, 1000));
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechNotice('Microphone access was denied. You can allow microphone access in your browser address bar (site settings) and click Try again, or type directly.');
        } else if (event.error !== 'no-speech') {
          setSpeechNotice('Voice input was interrupted. You can try again or continue typing.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechNotice('Could not start voice input. You can type directly.');
      setIsListening(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isDisabled) {
        onSubmit();
      }
    }
  }

  return (
    <div
      className={`space-y-5 transition-all duration-150 ease-out ${
        isDecompressing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Hero header */}
      <div className="space-y-1.5 text-left">
        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-sage)]">
          No lists. No decisions. One thing.
        </p>
        <h1 className="font-serif-card text-3xl sm:text-4xl text-[var(--text-ink)] tracking-tight font-normal leading-tight">
          What is on your mind?
        </h1>
        <p className="text-sm sm:text-base text-[var(--subtle-ink)] font-normal leading-relaxed">
          One gentle thing, then it forgets you.
        </p>
      </div>

      {/* Energy chip row above the textarea */}
      <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label="Energy level right now">
        <span className="text-xs text-[var(--subtle-ink)] font-medium mr-1">Energy right now:</span>
        {(['Very low', 'Low', 'Okay'] as const).map((lvl) => {
          const isSelected = energy === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onEnergyChange?.(isSelected ? undefined : lvl)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)] shadow-xs'
                  : 'bg-[var(--card-bg)] text-[var(--subtle-ink)] border-[var(--card-border)] hover:text-[var(--text-ink)] hover:border-[var(--accent-sage)]'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* One-tap example chips - placed above the typing space so button sits directly below the textarea */}
      <div className="space-y-1.5 text-left pt-0.5">
        <span className="text-xs text-[var(--subtle-ink)] font-medium">Try an example:</span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onDumpChange(chip)}
              disabled={isLoading}
              className="min-h-[38px] px-3.5 py-1.5 text-xs text-left rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--subtle-ink)] hover:text-[var(--text-ink)] hover:border-[var(--accent-sage)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* Speech notice */}
      {speechNotice && (
        <div
          className="p-3.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--subtle-ink)] leading-relaxed shadow-xs flex items-start justify-between gap-3 animate-card-enter"
          role="status"
          aria-live="polite"
        >
          <div className="space-y-1">
            <p className="font-medium text-[var(--text-ink)]">Microphone access needed</p>
            <p className="text-[var(--subtle-ink)]">{speechNotice}</p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={handleToggleVoice}
              className="text-xs text-[var(--accent-sage)] hover:underline cursor-pointer min-h-[44px] flex items-center"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => setSpeechNotice(null)}
              className="text-xs text-[var(--dim-text)] hover:text-[var(--text-ink)] underline cursor-pointer min-h-[44px] flex items-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Textarea - Actual typing space */}
      <div className="relative">
        <textarea
          value={dump}
          onChange={(e) => onDumpChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          rows={6}
          disabled={isLoading}
          placeholder="Type or paste everything on your mind. Mess is fine."
          aria-label="What is on your mind? Type or paste everything on your mind."
          className="w-full p-4 sm:p-5 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-ink)] text-base sm:text-base leading-relaxed resize-y focus:outline-none focus:border-[var(--accent-sage)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors shadow-xs disabled:opacity-70"
          style={{ minHeight: '140px' }}
        />

        {isListening && (
          <div
            className="absolute bottom-3 left-4 text-xs text-[var(--accent-sage)] bg-[var(--card-bg)] px-2.5 py-1 rounded border border-[var(--accent-sage)]/40 shadow-xs flex items-center gap-2"
            role="status"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-sage)] animate-ping" />
            <span>Listening... speak freely</span>
          </div>
        )}

        {showCounter && (
          <div
            className="absolute bottom-3 right-3 text-xs text-[var(--dim-text)] bg-[var(--input-bg)]/90 px-2 py-0.5 rounded border border-[var(--card-border)]"
            aria-live="polite"
          >
            {dump.length} / 1000
          </div>
        )}
      </div>

      {/* Action controls - directly underneath the typing space */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isDisabled}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer ${
                isDisabled
                  ? 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed'
                  : 'bg-[var(--accent-sage)] text-white hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] shadow-xs'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2.5 tracking-wide">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-breathing-ring"
                    />
                  </svg>
                  <span>Thinking gently...</span>
                </span>
              ) : (
                <span>Give me one thing</span>
              )}
            </button>

            {/* Voice typing button placed beside submit in Hosted mode */}
            {mode !== 'local' && (
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isLoading}
                className={`min-h-[44px] px-3.5 py-2 rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  isListening
                    ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)] shadow-xs animate-pulse ring-2 ring-[var(--accent-sage)]/30'
                    : 'text-[var(--text-ink)] bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--accent-sage)]'
                }`}
                title={isListening ? 'Stop voice typing' : 'Start voice typing'}
                aria-label={isListening ? 'Stop voice typing' : 'Start voice typing'}
              >
                <MicIcon className="w-4 h-4 shrink-0" />
                <span className="font-medium text-xs">{isListening ? 'Stop' : 'Voice typing'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOverwhelmed}
              disabled={isLoading}
              className="min-h-[44px] px-2 text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] underline underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded flex items-center transition-colors disabled:opacity-50"
            >
              Too overwhelmed to type?
            </button>
          </div>

          <span className="text-xs text-[var(--dim-text)] tracking-tight">
            Press Cmd/Ctrl + Enter to submit
          </span>
        </div>

        {/* Notice for voice typing beside the action row */}
        {mode !== 'local' && (
          <p className="text-[11px] text-[var(--dim-text)] leading-snug text-left">
            Voice typing may send audio to your browser's speech service.
          </p>
        )}
      </div>

      {/* Ambient Breathing Ring during loading state */}
      {isLoading && (
        <div
          className="p-4 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center gap-4 animate-card-enter shadow-xs select-none"
          role="status"
          aria-live="polite"
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <svg
              className="w-9 h-9"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="18"
                cy="18"
                r="11"
                stroke="var(--accent-sage)"
                strokeWidth="2"
                className="animate-breathing-ring"
              />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-[var(--text-ink)]">
              Take one slow breath
            </p>
            <p className="text-[11px] text-[var(--dim-text)]">
              Inhale for 4 seconds as the circle expands, exhale for 4 seconds as it rests.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
