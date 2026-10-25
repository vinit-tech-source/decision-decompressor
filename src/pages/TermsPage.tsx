import React from 'react';
import { ArrowLeftIcon } from '../components/Icons.tsx';

export function TermsPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-[var(--card-border)]">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs font-medium text-[var(--subtle-ink)] hover:text-[var(--text-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded p-1 cursor-pointer transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Still
        </button>
      </div>

      <div className="space-y-3">
        <h1 className="font-serif-card text-2xl sm:text-3xl text-[var(--text-ink)] font-normal">
          Terms of Use
        </h1>
        <p className="text-sm text-[var(--subtle-ink)]">
          Plain language guidelines for using Still.
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--text-ink)] leading-relaxed">
        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Not Medical Advice or Therapy
          </h2>
          <p className="text-[var(--subtle-ink)]">
            Still is a simple utility intended to suggest a single, small physical step when feeling overwhelmed. Still is not a healthcare provider, does not provide psychological counseling, and does not offer medical diagnoses or crisis response services.
          </p>
          <p className="text-[var(--subtle-ink)]">
            If you are experiencing a mental health emergency, acute crisis, or thoughts of self-harm, please contact your local emergency services or a dedicated helpline immediately (such as 988 in the US, 14416 in India, or findahelpline.com internationally).
          </p>
        </section>

        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Provided As-Is Without Warranty
          </h2>
          <p className="text-[var(--subtle-ink)]">
            Still is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. Suggestions are generated algorithmically or selected from simple fallback lists. You remain solely responsible for your own safety, actions, and decisions.
          </p>
        </section>

        <section className="p-5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-serif-card text-lg text-[var(--text-ink)]">
            Limitation of Liability
          </h2>
          <p className="text-[var(--subtle-ink)]">
            To the maximum extent permitted by applicable law, the creators and operators of Still shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your access to or inability to use this service.
          </p>
        </section>
      </div>
    </div>
  );
}
