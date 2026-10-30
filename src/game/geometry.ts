import { BOSS, COMBAT_UNITS, CombatKind, isBossKind, isRanged } from "./config";
import type { Unit } from "./types";

// Logical model coordinates from draw.ts, before the shared battlefield scale.
// Body fronts exclude held weapons; melee tips include their attack animation.
export const BATTLE_UNIT_SCALE = 1.4;
export const CONTACT_OVERLAP = 3 * BATTLE_UNIT_SCALE;
export const PLAYER_RANGED_RANGE_MULTIPLIER = 1.2;
const BODY_FRONT: Record<CombatKind, number> = {
  clubman: 19,
  spearman: 19,
  rock: 19,
  stormblade: 31,
  mech: 37,
  machineGunner: 25,
  basketballPlayer: 20,
  cannon: 46,
  shark: 35,
  tiger: 45,
  cyborgWalrus: 42,
  mafia: 20,
  rapper: 22,
  barbarian: 30,
  spaceMarine: 39,
  duck: 34,
  mig17: 61,
  // Outward-bending elbows include the armored/bone arm outline at full sweep.
  gundam: 49,
  skeletonKing: 37,
  darkMage: 33,
  raccoon: 46,
  slimeArm: 32,
  slimeThrower: 32,
  // Lower torso/far arm at troop height; the raised snout is above the frontline.
  dreadmaw: 28,
  ironback: 32,
  titan: 30,
  scientist: 25,
  pyramid: 48,
};
const MELEE_TIP: Partial<Record<CombatKind, number>> = {
  clubman: 35,
  spearman: 61,
  stormblade: 104,
  shark: 43,
  cyborgWalrus: 58,
  barbarian: 72,
  // Contact pose includes the six-pixel outer beam/glow in draw.ts.
  gundam: 90,
  skeletonKing: 84,
  duck: 65,
  slimeArm: 78,
  // drawDinosaur: hand x=17+12*swing, plus outline and the 4-degree swipe.
  dreadmaw: 34,
  ironback: 58,
  titan: 58,
};
export function modelScale(kind: CombatKind) {
  return BATTLE_UNIT_SCALE * (isBossKind(kind) ? BOSS.scale : 1);
}
export function bodyFront(kind: CombatKind) {
  return BODY_FRONT[kind] * modelScale(kind);
}
export function meleeReach(kind: CombatKind) {
  return (
    Math.max(
      BODY_FRONT[kind] + 3,
      MELEE_TIP[kind] ?? COMBAT_UNITS[kind].range,
    ) * modelScale(kind)
  );
}
export function bodyContactDistance(a: Unit, b: Unit) {
  return bodyFront(a.kind) + bodyFront(b.kind) - CONTACT_OVERLAP;
}
export function attackDistance(a: Unit, b?: Unit) {
  if (!isRanged(a.kind))
    return meleeReach(a.kind) + (b ? bodyFront(b.kind) : 0) - CONTACT_OVERLAP;
  // Player range is measured to the enemy's visible body edge. A fixed boss
  // padding loses most of the stand-off distance against three-times-size art.
  // Enemy ranges retain their existing center-distance behavior.
  return Math.max(
    COMBAT_UNITS[a.kind].range *
      (a.side === "player" ? PLAYER_RANGED_RANGE_MULTIPLIER : 1) +
      (b
        ? a.side === "player"
          ? bodyFront(b.kind)
          : isBossKind(b.kind)
            ? BOSS.bodyRadius
            : 0
        : 0),
    b ? bodyContactDistance(a, b) : 0,
  );
}
