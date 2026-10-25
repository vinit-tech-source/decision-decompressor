import type { Card } from "./validator.ts";
import { validateAvoidPreferences, type AvoidOption } from "./preferences.ts";

export const FALLBACKS: Card[] = [
  { action: "Write down the first thing on your mind.", why_gentle: "It takes under two minutes and needs no decision.", time_box_minutes: 2 },
  { action: "Drink a glass of water.", why_gentle: "It is physical, tiny, and impossible to get wrong.", time_box_minutes: 2 },
  { action: "Open a window.", why_gentle: "It changes the room without changing your list.", time_box_minutes: 1 },
  { action: "Put one object back where it belongs.", why_gentle: "One object is reversible and visibly finished.", time_box_minutes: 2 },
  { action: "Stretch your arms slowly.", why_gentle: "Your body gets a small reset and nothing else is asked of you.", time_box_minutes: 1 },
  { action: "Look out of the nearest window.", why_gentle: "It costs nothing and gives your attention somewhere calm to rest.", time_box_minutes: 1 }
];

export const MICRO: Card[] = [
  { action: "Breathe out slowly.", why_gentle: "One breath is the smallest possible step.", time_box_minutes: 1 },
  { action: "Put your phone face down.", why_gentle: "It is instant and fully reversible.", time_box_minutes: 1 },
  { action: "Drink one sip of water.", why_gentle: "It takes a few seconds and asks nothing of you.", time_box_minutes: 1 },
  { action: "Look at something green.", why_gentle: "Your eyes get a break and nothing needs deciding.", time_box_minutes: 1 }
];

export const REST_MESSAGE = { title: "Nothing is also an option.", body: "You can stop here." };

export function pickFallback(avoidList?: AvoidOption[]): Card {
  const eligible = avoidList && avoidList.length > 0
    ? FALLBACKS.filter(c => validateAvoidPreferences(c.action, avoidList).ok)
    : FALLBACKS;
  const list = eligible.length > 0 ? eligible : FALLBACKS;
  return { ...list[Math.floor(Math.random() * list.length)] };
}

export function pickMicro(avoidList?: AvoidOption[]): Card {
  const eligible = avoidList && avoidList.length > 0
    ? MICRO.filter(c => validateAvoidPreferences(c.action, avoidList).ok)
    : MICRO;
  const list = eligible.length > 0 ? eligible : MICRO;
  return { ...list[Math.floor(Math.random() * list.length)] };
}
