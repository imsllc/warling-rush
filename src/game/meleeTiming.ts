import type { CombatKind } from "./config";

export const UPSWING = {
  duration: 0.25,
  windup: 0.08,
  contactRemaining: 0.17,
  hold: 0.025,
  followThrough: 0.055,
  recovery: 0.09,
} as const;

export function hasUpswing(kind: CombatKind) {
  return kind === "stormblade" || kind === "barbarian";
}
