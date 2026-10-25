export interface QuietLogEntry {
  id: string;
  action: string;
  why_gentle: string;
  time_box_minutes: number;
  context: 'Work' | 'Home' | 'Rest' | 'Study';
  timestamp: number;
}

const QUIET_LOG_KEY = 'still_quiet_log_v1';

export function getQuietLog(): QuietLogEntry[] {
  try {
    const raw = localStorage.getItem(QUIET_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 5);
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

export function addQuietLogEntry(
  entry: Omit<QuietLogEntry, 'id' | 'timestamp'>
): QuietLogEntry[] {
  try {
    const current = getQuietLog();
    const newEntry: QuietLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...current].slice(0, 5);
    localStorage.setItem(QUIET_LOG_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearQuietLog(): void {
  try {
    localStorage.removeItem(QUIET_LOG_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function getQuietLogInsight(entries: QuietLogEntry[]): string {
  if (!entries || entries.length === 0) {
    return '';
  }

  // Analyze the last up to 3 entries
  const recent = entries.slice(0, 3);
  const counts: Record<string, number> = { Work: 0, Home: 0, Rest: 0, Study: 0 };

  for (const item of recent) {
    if (item.context && counts[item.context] !== undefined) {
      counts[item.context]++;
    }
  }

  if (counts.Rest >= 2) {
    return 'You have been choosing Rest mode a lot lately. It is okay to take it slow.';
  }

  if (counts.Home >= 2) {
    return 'You often get stuck on Home tasks. Start small.';
  }

  if (counts.Work >= 2) {
    return 'You have been focusing on Work tasks recently. Remember to take gentle breaths between them.';
  }

  if (counts.Study >= 2) {
    return 'You have been in Study mode recently. Remember to pause and let concepts settle.';
  }

  return 'A quiet rhythm across different parts of your day. Take each moment as it comes.';
}
