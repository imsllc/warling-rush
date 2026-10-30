import type { Unit } from "../game/types";
import { UPSWING } from "../game/meleeTiming";

// Presentation only. Melee lunges pull BACK from the established contact pose,
// never extending reach or changing the weapon edge at the damage frame.
export function attackMotion(
  unit: Pick<Unit, "kind" | "attack" | "hp"> & Partial<Pick<Unit, "cooldown">>,
) {
  const pose = { x: 0, y: 0, angle: 0 };
  if (unit.hp <= 0) return pose;
  // A short anticipation dash pulls back, then reaches the unchanged contact
  // position precisely when the existing timer starts the next attack.
  if (unit.attack <= 0) {
    if (
      unit.kind === "gundam" &&
      unit.cooldown !== undefined &&
      unit.cooldown > 0 &&
      unit.cooldown < 0.18
    )
      pose.x = -34 * Math.sin((Math.PI * unit.cooldown) / 0.18);
    return pose;
  }
  const t = Math.max(0, Math.min(1, 1 - unit.attack / UPSWING.duration));
  if (unit.kind === "barbarian" && t < UPSWING.windup / UPSWING.duration) {
    pose.y =
      -34 * Math.sin((Math.PI * t) / (UPSWING.windup / UPSWING.duration));
  } else if (unit.kind === "gundam") {
    pose.x = -7 * Math.sin(Math.PI * t);
  } else if (unit.kind === "basketballPlayer") {
    // The shot is released at attack start, so begin at the jump's apex.
    pose.y = -30 * (1 - t) ** 2;
  } else if (unit.kind === "duck") {
    pose.y = -12 * Math.sin(Math.PI * t);
  } else if (unit.kind === "mig17") {
    pose.angle = -8 * Math.sin(Math.PI * t);
  } else if (unit.kind === "rock") {
    pose.angle = -16 * Math.sin(Math.PI * t);
  } else if (unit.kind === "rapper") {
    pose.y = 7 * Math.sin(Math.PI * t);
  }
  return pose;
}
