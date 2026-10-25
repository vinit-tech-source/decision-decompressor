const CRISIS = /(kill myself|end my life|suicid|want to die|don'?t want to be alive|no reason to live|self[- ]?harm|hurt myself)/i;

export function needsCare(text: string): boolean {
  return CRISIS.test(text);
}

// Shows only numbers explicitly provided in safety.ts; leave a TODO comment for user verification. Never invent numbers.
// TODO: verify crisis hotline numbers for other international regions
export function getCrisisResources(region?: string): string[] {
  const norm = (region || '').toLowerCase();
  if (norm.includes('in') || norm.includes('india')) {
    return [
      'India: Tele-MANAS 14416',
      'Elsewhere: findahelpline.com'
    ];
  }
  if (norm.includes('us') || norm.includes('america') || norm.includes('united states')) {
    return [
      'US: call or text 988',
      'Elsewhere: findahelpline.com'
    ];
  }

  // Default regional fallback: display known verified numbers plus international directory
  // TODO: verify crisis numbers for UK (e.g. 111), EU (e.g. 112/116 123), AU (e.g. 13 11 14), JP, etc.
  return [
    'India: Tele-MANAS 14416',
    'US: call or text 988',
    'Elsewhere: findahelpline.com'
  ];
}

export const CARE_MESSAGE = {
  title: 'That sounds really heavy.',
  body: "Still can't help with this, and you deserve more than one small task right now. If you might act on these thoughts or you are in danger, please contact your local emergency number now. You can also reach out to someone you trust.",
  resources: getCrisisResources(),
};
