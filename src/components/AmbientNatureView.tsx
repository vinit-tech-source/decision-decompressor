import React, { useState } from 'react';
import { NatureCanvas, NatureSceneType } from './NatureCanvas.tsx';
import { MountainIcon } from './Icons.tsx';

export type NatureDisplayMode = 'side' | 'backdrop' | 'off';

interface AmbientNatureViewProps {
  mode: NatureDisplayMode;
  onModeChange: (mode: NatureDisplayMode) => void;
  isSideViewActive?: boolean;
  theme?: 'light' | 'dark';
}

export function AmbientNatureView({
  mode,
  onModeChange: _onModeChange,
  theme = 'dark',
}: AmbientNatureViewProps) {
  const [sceneType, setSceneType] = useState<NatureSceneType>('forest');
  const [interactive, setInteractive] = useState<boolean>(true);

  if (mode === 'off') return null;

  return (
    <div
      className="relative w-full h-32 sm:h-36 max-h-40 overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xs transition-all my-4"
    >
      {/* 3D Scene Viewport */}
      <div className="relative w-full h-full bg-[#161a17]">
        <NatureCanvas sceneType={sceneType} interactive={interactive} theme={theme} />

        {/* Ambient Overlay label */}
        <div className="absolute top-2.5 left-3 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-page)]/80 text-[var(--subtle-ink)] border border-[var(--card-border)]/50 text-[10px] uppercase font-medium tracking-wider backdrop-blur-xs">
            <MountainIcon className="w-3 h-3 text-[var(--accent-sage)]" />
            <span>3D Nature Banner</span>
          </div>
        </div>

        {/* Compact Dock Controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {(['forest', 'ripples', 'meadow'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSceneType(type)}
              className={`px-2 py-1 text-[11px] rounded border backdrop-blur-xs transition-colors cursor-pointer min-h-[32px] flex items-center ${
                sceneType === type
                  ? 'border-[var(--accent-sage)] bg-[var(--input-bg)] text-[var(--text-ink)] font-medium shadow-2xs'
                  : 'border-[var(--card-border)] bg-[var(--bg-page)]/80 text-[var(--subtle-ink)] hover:text-[var(--text-ink)]'
              }`}
            >
              {type === 'ripples' ? 'Water' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setInteractive(!interactive)}
            className={`px-2 py-1 text-[11px] rounded border backdrop-blur-xs transition-colors cursor-pointer min-h-[32px] flex items-center ${
              interactive
                ? 'border-[var(--accent-sage)] bg-[var(--input-bg)] text-[var(--accent-sage)] font-medium'
                : 'border-[var(--card-border)] bg-[var(--bg-page)]/80 text-[var(--dim-text)]'
            }`}
            title="Toggle interaction"
          >
            {interactive ? 'Active' : 'Still'}
          </button>
        </div>
      </div>
    </div>
  );
}
