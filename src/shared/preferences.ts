// Preferences and profile types for Still

export type FocusOption = 'Work' | 'Study' | 'Home' | 'Rest';

export type HelpOption =
  | 'Moving my body'
  | 'Tidying one small thing'
  | 'Writing it down'
  | 'A sip or snack'
  | 'Just breathing';

export type AvoidOption =
  | 'Screens or messages'
  | 'Going outside'
  | 'Talking to people'
  | 'Anything physical';

export type EnergyLevel = 'Very low' | 'Low' | 'Okay';

export const ALLOWED_FOCUS: readonly FocusOption[] = ['Work', 'Study', 'Home', 'Rest'] as const;

export const ALLOWED_HELPS: readonly HelpOption[] = [
  'Moving my body',
  'Tidying one small thing',
  'Writing it down',
  'A sip or snack',
  'Just breathing',
] as const;

export const ALLOWED_AVOIDS: readonly AvoidOption[] = [
  'Screens or messages',
  'Going outside',
  'Talking to people',
  'Anything physical',
] as const;

export const ALLOWED_ENERGY: readonly EnergyLevel[] = ['Very low', 'Low', 'Okay'] as const;

export interface UserPreferences {
  focus?: FocusOption;
  energy?: EnergyLevel;
  helps?: HelpOption[];
  avoid?: AvoidOption[];
  rememberOnDevice?: boolean;
}

export interface UserProfile extends UserPreferences {
  energy?: EnergyLevel;
}

// Deterministic keywords that violate avoid choices
export const AVOID_PATTERNS: Record<AvoidOption, RegExp> = {
  'Screens or messages': /\b(phone|screen|screens|email|emails|message|messages|laptop|computer|app|apps|inbox|text|texts|call|calling|slack|browser|tab|tabs|document|doc|pdf)\b/i,
  'Going outside': /\b(outside|walk|walking|balcony|porch|yard|garden|mail|mailbox|car|drive|street|errand|store)\b/i,
  'Talking to people': /\b(talk|talking|speak|speaking|tell|call|calling|person|people|someone|friend|family|colleague|coworker|ask|chat)\b/i,
  'Anything physical': /\b(stand|standing|stretch|stretching|walk|walking|jump|jumping|move|moving|lift|lifting|clean|cleaning|tidy|tidying|wash|washing|wipe|wiping|water|watering|fold|folding|sweep|sweeping|scrub|scrubbing)\b/i,
};

/**
 * Validates whether an action text respects all user avoid choices.
 */
export function validateAvoidPreferences(
  action: string,
  avoidList?: AvoidOption[]
): { ok: boolean; reason?: string } {
  if (!avoidList || avoidList.length === 0) return { ok: true };
  const normalized = action.toLowerCase();
  for (const avoidItem of avoidList) {
    const pattern = AVOID_PATTERNS[avoidItem];
    if (pattern && pattern.test(normalized)) {
      return {
        ok: false,
        reason: `Action mentions items you preferred to avoid: "${avoidItem}".`,
      };
    }
  }
  return { ok: true };
}

/**
 * Generates a short, reassuring explanation of why the action was tailored
 * without calling any language model.
 * Example: "Chosen for: low energy · you like writing things down"
 */
export function buildChosenForLabel(profile?: UserProfile): string | null {
  if (!profile) return null;
  const parts: string[] = [];

  if (profile.energy) {
    if (profile.energy === 'Very low') parts.push('very low energy');
    else if (profile.energy === 'Low') parts.push('low energy');
    else if (profile.energy === 'Okay') parts.push('steady energy');
  }

  if (profile.helps && profile.helps.length > 0) {
    const firstHelp = profile.helps[0];
    if (firstHelp === 'Moving my body') parts.push('you like moving your body');
    else if (firstHelp === 'Tidying one small thing') parts.push('you like tidying one small thing');
    else if (firstHelp === 'Writing it down') parts.push('you like writing things down');
    else if (firstHelp === 'A sip or snack') parts.push('you like a sip or snack');
    else if (firstHelp === 'Just breathing') parts.push('you like gentle breathing');
  } else if (profile.avoid && profile.avoid.length > 0) {
    const firstAvoid = profile.avoid[0];
    if (firstAvoid === 'Screens or messages') parts.push('stepping away from screens');
    else if (firstAvoid === 'Going outside') parts.push('staying quietly inside');
    else if (firstAvoid === 'Talking to people') parts.push('staying in your own space');
    else if (firstAvoid === 'Anything physical') parts.push('minimal physical effort');
  } else if (profile.focus) {
    parts.push(`${profile.focus.toLowerCase()} focus`);
  }

  if (parts.length === 0) return null;
  return `Chosen for: ${parts.slice(0, 2).join(' · ')}`;
}

/**
 * Builds a brief, non-personal instruction line for the system/user prompt.
 */
export function buildPersonContextPrompt(profile?: UserProfile): string {
  if (!profile) return '';
  const lines: string[] = [];

  if (profile.energy === 'Very low') {
    lines.push('Energy is very low: strictly 1-2 minutes and one tiny physical action.');
  } else if (profile.energy === 'Low') {
    lines.push('Energy is low: keep under 5 minutes.');
  }

  if (profile.focus) {
    lines.push(`Focus area: ${profile.focus}.`);
  }

  if (profile.helps && profile.helps.length > 0) {
    lines.push(`Helpful starting methods: ${profile.helps.join(', ')}.`);
  }

  if (profile.avoid && profile.avoid.length > 0) {
    lines.push(`DO NOT suggest: ${profile.avoid.join(', ')}.`);
  }

  return lines.length > 0 ? `\nPerson context: ${lines.join(' ')}` : '';
}
