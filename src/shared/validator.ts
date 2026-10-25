// Zero AI dependencies by design.

export interface Card { action: string; why_gentle: string; time_box_minutes: number; }
export type ValidationResult = { ok: true } | { ok: false; reason: string };
export const GENTLE_VERBS = new Set(["open","read","look","glance","skim","write","jot","put","move","pick","turn","close","clear","drink","eat","stand","sit","stretch","walk","breathe","fill","empty","wipe","water","feed","charge","plug","unplug","step","take"]);
const MULTI_ACTION = /(\band\b|\bthen\b|\bafter\b|\bbefore\b|\balso\b|\bplus\b|;|&|\+|,)/i;
const HIGH_EFFORT = /\b(reply|respond|send|call|decide|finish|complete|schedule|organi[sz]e|plan|submit|prepare|fix|solve|apply|pay|negotiate|confront|apologi[sz]e|ask|cancel|confirm|update)\b/i;
const SCOPE_WORDS = /\b(all|every|everything|entire|whole|each|both|several|multiple|many)\b/i;
const TWO_SENTENCES = /[.!?]\s+\S/;
export function wordCount(s: string): number { return s.trim().split(/\s+/).filter(Boolean).length; }
export function allowedVerbsCsv(): string { return Array.from(GENTLE_VERBS).sort().join(", "); }
export function validate(payload: unknown): ValidationResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return { ok: false, reason: "not a JSON object" };
  const p = payload as Record<string, unknown>;
  const { action, why_gentle, time_box_minutes } = p;
  if (typeof action !== "string" || !action.trim()) return { ok: false, reason: "missing action" };
  if (typeof why_gentle !== "string" || !why_gentle.trim()) return { ok: false, reason: "missing why_gentle" };
  if (typeof time_box_minutes !== "number" || !Number.isInteger(time_box_minutes)) return { ok: false, reason: "time_box_minutes must be an integer" };
  if (time_box_minutes < 1 || time_box_minutes > 10) return { ok: false, reason: "time_box_minutes must be between 1 and 10" };
  const a = action.trim();
  if (/\n/.test(a) || /\n/.test(why_gentle)) return { ok: false, reason: "must be a single line" };
  if (/\?/.test(a)) return { ok: false, reason: "action must not be a question" };
  if (/https?:\/\//i.test(a)) return { ok: false, reason: "action must not contain a link" };
  if (wordCount(a) > 15) return { ok: false, reason: "action longer than 15 words" };
  if (wordCount(why_gentle) > 25) return { ok: false, reason: "why_gentle longer than 25 words" };
  if (TWO_SENTENCES.test(a)) return { ok: false, reason: "action contains more than one sentence" };
  if (MULTI_ACTION.test(a)) return { ok: false, reason: "action contains more than one step" };
  if (HIGH_EFFORT.test(a)) return { ok: false, reason: "action contains a high-effort word" };
  if (SCOPE_WORDS.test(a)) return { ok: false, reason: "action is too broad in scope" };
  const words = a.toLowerCase().replace(/[.!]+$/, "").split(/\s+/);
  const first = words[0].replace(/[^a-z]/g, "");
  if (!GENTLE_VERBS.has(first)) return { ok: false, reason: `action must start with a gentle verb, got "${first}"` };
  if ((first === "write" || first === "jot") && words[1]?.replace(/[^a-z]/g, "") !== "down") return { ok: false, reason: `"${first}" must be followed by "down"` };
  return { ok: true };
}
