// Zero AI dependencies by design.
import { Card, wordCount } from "./validator.ts";

export function isSmaller(next: Card, prev: Card): boolean {
  return next.time_box_minutes < prev.time_box_minutes || wordCount(next.action) < wordCount(prev.action);
}
