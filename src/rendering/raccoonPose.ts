import { armElbow, type Point } from "./meleePose";

export function raccoonRiflePose(attack: number) {
  const age = Math.max(0, Math.min(0.12, 0.12 - attack));
  const recoil = attack > 0 ? Math.sin((age / 0.12) * Math.PI) * 1.8 : 0;
  const weaponX = -6 - recoil;
  const weaponY = 9;
  function arm(shoulder: Point, hand: Point, upper: number, lower: number) {
    return { shoulder, elbow: armElbow(shoulder, hand, upper, lower), hand };
  }
  return {
    weaponX,
    weaponY,
    // The far arm is behind the torso; only its forearm emerges at the guard.
    support: arm([12, -43], [47 + weaponX, -36 + weaponY], 23, 22),
    // The near upper arm hangs beside the ribs, then bends to the pistol grip.
    trigger: arm([-13, -43], [21 + weaponX, -27 + weaponY], 21, 27),
  };
}
