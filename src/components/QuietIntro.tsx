import React, { useState } from 'react';
import type { FocusOption, HelpOption, AvoidOption, EnergyLevel, UserPreferences } from '../shared/preferences';
import { StillLogo } from './StillLogo.tsx';

interface QuietIntroProps {
  onComplete: (prefs: UserPreferences) => void;
}

const FOCUS_ITEMS: Array<{
  id: FocusOption;
  emoji: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'Work',
    emoji: '💼',
    title: 'Work & Career',
    subtitle: 'Deadlines, email overflow, client asks, or work tasks.',
  },
  {
    id: 'Study',
    emoji: '📚',
    title: 'Study & Learning',
    subtitle: 'Exams, readings, assignments, or feeling behind.',
  },
  {
    id: 'Home',
    emoji: '🏠',
    title: 'Home & Daily Life',
    subtitle: 'Laundry, clutter, meals, dishes, bills, or errands.',
  },
  {
    id: 'Rest',
    emoji: '🛋️',
    title: 'Just Pure Burnout',
    subtitle: 'Exhausted mind, sensory overload, need permission to pause.',
  },
];

const ENERGY_ITEMS: Array<{
  id: EnergyLevel;
  emoji: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'Very low',
    emoji: '🪫',
    title: 'Running on empty',
    subtitle: 'Hard to move or decide. Barely keeping eyes open.',
  },
  {
    id: 'Low',
    emoji: '🔋',
    title: 'Pretty tired',
    subtitle: 'Can do one tiny 2-minute step, but nothing demanding.',
  },
  {
    id: 'Okay',
    emoji: '⚡',
    title: 'Steady / Okay',
    subtitle: 'Have a little momentum, just need a clear gentle nudge.',
  },
];

const HELP_ITEMS: Array<{
  id: HelpOption;
  emoji: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'Moving my body',
    emoji: '🚶',
    title: 'Moving my body a little',
    subtitle: 'A slow stretch, gentle pacing, or rolling my shoulders.',
  },
  {
    id: 'Tidying one small thing',
    emoji: '🧹',
    title: 'Clearing one tiny spot',
    subtitle: 'Putting away one mug, tossing a receipt, or wiping a spot.',
  },
  {
    id: 'Writing it down',
    emoji: '✍️',
    title: 'Jotting it down',
    subtitle: 'Getting tangled thoughts onto paper or a quick scratchpad.',
  },
  {
    id: 'A sip or snack',
    emoji: '☕',
    title: 'A calm sip or bite',
    subtitle: 'A cool glass of water, warm tea, or a small snack.',
  },
  {
    id: 'Just breathing',
    emoji: '🫁',
    title: 'Just sitting & breathing',
    subtitle: 'Closing my eyes for 60 seconds with zero demands.',
  },
];

const AVOID_ITEMS: Array<{
  id: AvoidOption;
  emoji: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'Screens or messages',
    emoji: '📱',
    title: 'No more screens or messages',
    subtitle: 'Keep me away from phones, inboxes, and apps right now.',
  },
  {
    id: 'Going outside',
    emoji: '🚪',
    title: 'Don’t make me go outside',
    subtitle: 'I want to stay safe and cozy inside where I am.',
  },
  {
    id: 'Talking to people',
    emoji: '🗣️',
    title: 'No talking to anyone',
    subtitle: 'Social battery is flat. No texts, calls, or chats.',
  },
  {
    id: 'Anything physical',
    emoji: '🧘',
    title: 'No physical exertion',
    subtitle: 'Keep it seated and require minimal movement.',
  },
];

const MEMORY_CHOICES = [
  {
    value: true,
    emoji: '🔒',
    title: 'Remember my preferences on this device',
    subtitle: 'Saves your space, energy, and avoid choices locally so Still greets you tailored next time. You can clear them anytime in Settings. (Brain dumps are never saved)',
  },
  {
    value: false,
    emoji: '🍃',
    title: 'Forget me completely every single visit',
    subtitle: 'Wipe all choices as soon as you close this browser tab. Start 100% fresh each time.',
  },
];

export const QuietIntro: React.FC<QuietIntroProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [focus, setFocus] = useState<FocusOption | undefined>(undefined);
  const [energy, setEnergy] = useState<EnergyLevel | undefined>(undefined);
  const [helps, setHelps] = useState<HelpOption[]>([]);
  const [avoid, setAvoid] = useState<AvoidOption[]>([]);
  const [rememberOnDevice, setRememberOnDevice] = useState<boolean | undefined>(undefined);

  const toggleHelp = (item: HelpOption) => {
    setHelps(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleAvoid = (item: AvoidOption) => {
    setAvoid(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const finish = (save: boolean = rememberOnDevice ?? false) => {
    const prefs: UserPreferences = {
      focus,
      energy,
      helps: helps.length > 0 ? helps : undefined,
      avoid: avoid.length > 0 ? avoid : undefined,
      rememberOnDevice: save,
    };

    try {
      localStorage.setItem('still_intro_seen', 'true');
      if (save) {
        localStorage.setItem('still_preferences', JSON.stringify(prefs));
      } else {
        localStorage.removeItem('still_preferences');
      }
    } catch {
      // LocalStorage access might be restricted in private browsing
    }

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      // ignore
    }

    onComplete(prefs);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Quiet Introduction"
    >
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-[var(--bg-page)] border-2 border-[var(--card-border)] rounded-2xl p-5 sm:p-7 md:p-9 shadow-2xl transition-all my-auto">
        {/* Top header: question counter and 5 progress indicator dots */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2.5">
            <StillLogo size="sm" showText={false} animated={false} />
            <span className="text-xs uppercase tracking-widest text-[var(--accent-sage)] font-semibold">
              Question {step} of 5
            </span>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`Question ${step} of 5`} role="group">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  s === step
                    ? 'w-6 bg-[var(--accent-sage)]'
                    : s < step
                    ? 'w-2 bg-[var(--accent-sage)]/60'
                    : 'w-2 bg-[var(--card-border)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question 1: Space & Focus */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-tight">
                Where is life feeling most crowded right now?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] font-normal">
                Pick the space where your thoughts and tasks are piling up.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {FOCUS_ITEMS.map((item) => {
                const isSelected = focus === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocus(item.id)}
                    className={`min-h-[72px] p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-sm'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-xl" role="img" aria-hidden="true">{item.emoji}</span>
                      <span className="text-sm font-semibold">{item.title}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/90' : 'text-[var(--subtle-ink)]'}`}>
                      {item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end items-center pt-3.5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[44px] px-7 py-2.5 rounded-md bg-[var(--accent-sage)] text-white font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Question 2: Energy Level */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-tight">
                How is your energy feeling at this exact moment?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] font-normal">
                Be completely honest. Still never expects you to be productive.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {ENERGY_ITEMS.map((item) => {
                const isSelected = energy === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEnergy(item.id)}
                    className={`min-h-[80px] p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-sm'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl" role="img" aria-hidden="true">{item.emoji}</span>
                      <span className="text-sm font-semibold">{item.title}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/90' : 'text-[var(--subtle-ink)]'}`}>
                      {item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] min-h-[44px] px-3 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-[44px] px-7 py-2.5 rounded-md bg-[var(--accent-sage)] text-white font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Question 3: What helps you start */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-tight">
                When you're stuck, what helps unlock you?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] font-normal">
                Pick whatever feels comforting and kind (select all that apply).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {HELP_ITEMS.map((item) => {
                const isSelected = helps.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleHelp(item.id)}
                    className={`w-full min-h-[58px] px-3.5 py-3 rounded-xl border-2 text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white shadow-sm'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)] shadow-xs'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base" role="img" aria-hidden="true">{item.emoji}</span>
                        <span className="text-xs sm:text-sm font-semibold">{item.title}</span>
                      </div>
                      <p className={`text-[11px] leading-snug ${isSelected ? 'text-white/90' : 'text-[var(--subtle-ink)]'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${
                        isSelected
                          ? 'border-white bg-white text-[var(--accent-sage)]'
                          : 'border-[var(--card-border)] bg-[var(--bg-page)] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] min-h-[44px] px-3 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="min-h-[44px] px-7 py-2.5 rounded-md bg-[var(--accent-sage)] text-white font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Question 4: What to avoid */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-tight">
                What should Still definitely NOT ask you to do?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] font-normal">
                Still will strictly reject any suggestion involving these boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {AVOID_ITEMS.map((item) => {
                const isSelected = avoid.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAvoid(item.id)}
                    className={`w-full min-h-[58px] px-3.5 py-3 rounded-xl border-2 text-left font-medium flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-700 bg-rose-700 text-white shadow-sm'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-rose-400 shadow-xs'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base" role="img" aria-hidden="true">{item.emoji}</span>
                        <span className="text-xs sm:text-sm font-semibold">{item.title}</span>
                      </div>
                      <p className={`text-[11px] leading-snug ${isSelected ? 'text-white/90' : 'text-[var(--subtle-ink)]'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${
                        isSelected
                          ? 'border-white bg-white text-rose-700'
                          : 'border-[var(--card-border)] bg-[var(--bg-page)] text-transparent'
                      }`}
                    >
                      ✕
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] min-h-[44px] px-3 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="min-h-[44px] px-7 py-2.5 rounded-md bg-[var(--accent-sage)] text-white font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Question 5: How Still remembers you */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal leading-tight">
                How would you like Still to remember you?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--subtle-ink)] font-normal">
                Your brain dumps are never stored or seen. Choose how your preferences are kept.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {MEMORY_CHOICES.map((choice) => {
                const isSelected = rememberOnDevice === choice.value;
                return (
                  <button
                    key={String(choice.value)}
                    type="button"
                    onClick={() => setRememberOnDevice(choice.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--card-bg)] shadow-sm ring-1 ring-[var(--accent-sage)]'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-ink)] hover:border-[var(--accent-sage)]'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" role="img" aria-hidden="true">{choice.emoji}</span>
                        <span className="text-sm font-semibold text-[var(--text-ink)]">{choice.title}</span>
                      </div>
                      <p className="text-xs text-[var(--subtle-ink)] leading-relaxed">
                        {choice.subtitle}
                      </p>
                    </div>

                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white'
                          : 'border-[var(--card-border)] bg-[var(--bg-page)] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs text-[var(--subtle-ink)] hover:text-[var(--text-ink)] min-h-[44px] px-3 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => finish(rememberOnDevice ?? false)}
                className="min-h-[44px] px-8 py-2.5 rounded-md bg-[var(--accent-sage)] text-white font-medium hover:bg-[var(--accent-sage-hover)] active:bg-[var(--accent-sage-active)] transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Begin Still
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
