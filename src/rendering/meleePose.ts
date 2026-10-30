import { hasUpswing, UPSWING } from "../game/meleeTiming";

export type Point = readonly [number, number];
export type SwingKind = "stormblade" | "barbarian" | "gundam" | "skeletonKing";

const SWINGS: Record<
  SwingKind,
  {
    idle: Point;
    contact: Point;
    idleAngle: number;
    contactAngle: number;
    follow?: Point;
    followAngle?: number;
  }
> = {
  stormblade: {
    idle: [4, -45],
    contact: [26, -42],
    idleAngle: -70,
    contactAngle: 0,
    follow: [22, -32],
    followAngle: 35,
  },
  barbarian: {
    idle: [-6, -40],
    contact: [0, -25],
    idleAngle: -65,
    contactAngle: -5,
    follow: [0, -15],
    followAngle: 25,
  },
  gundam: {
    idle: [22, -64],
    contact: [30, -47],
    idleAngle: -75,
    contactAngle: 0,
  },
  skeletonKing: {
    idle: [18, -50],
    contact: [26, -34],
    idleAngle: -65,
    contactAngle: 0,
  },
};

export function meleeWeaponPose(kind: SwingKind, attack: number) {
  const pose = SWINGS[kind];
  if (hasUpswing(kind)) {
    const blend = (
      from: Point,
      to: Point,
      fromAngle: number,
      toAngle: number,
      value: number,
      returning = false,
    ) => {
      const progress = Math.max(0, Math.min(1, value));
      const eased = progress * progress * (3 - 2 * progress);
      return {
        x: from[0] + (to[0] - from[0]) * eased,
        y: from[1] + (to[1] - from[1]) * eased,
        angle: fromAngle + (toAngle - fromAngle) * eased,
        extension: returning ? 1 - eased : eased,
      };
    };
    if (attack <= 0)
      return blend(
        pose.idle,
        pose.contact,
        pose.idleAngle,
        pose.contactAngle,
        0,
      );
    const elapsed = Math.max(0, UPSWING.duration - attack);
    if (elapsed + 1e-9 < UPSWING.windup)
      return blend(
        pose.idle,
        pose.contact,
        pose.idleAngle,
        pose.contactAngle,
        elapsed / UPSWING.windup,
      );
    if (elapsed <= UPSWING.windup + UPSWING.hold)
      return blend(
        pose.idle,
        pose.contact,
        pose.idleAngle,
        pose.contactAngle,
        1,
      );
    const follow = pose.follow!;
    const followAngle = pose.followAngle!;
    if (elapsed <= UPSWING.windup + UPSWING.hold + UPSWING.followThrough)
      return blend(
        pose.contact,
        follow,
        pose.contactAngle,
        followAngle,
        (elapsed - UPSWING.windup - UPSWING.hold) / UPSWING.followThrough,
      );
    const recovery = blend(
      follow,
      pose.idle,
      followAngle,
      pose.idleAngle,
      (elapsed - UPSWING.windup - UPSWING.hold - UPSWING.followThrough) /
        UPSWING.recovery,
      true,
    );
    // Keep the axe grip clear of its shoulder's folding point on the return,
    // so the elbow follows a smooth arc instead of flipping around the joint.
    if (kind === "barbarian")
      recovery.y -= 6 * Math.sin(Math.PI * (1 - recovery.extension));
    return recovery;
  }
  // Combat applies the hit at attack start. Hold full contact briefly, then
  // recover the entire arm and weapon together to the raised ready pose.
  const progress = Math.max(0, Math.min(1, attack / 0.19));
  const extension = progress * progress * (3 - 2 * progress);
  return {
    x: pose.idle[0] + (pose.contact[0] - pose.idle[0]) * extension,
    y: pose.idle[1] + (pose.contact[1] - pose.idle[1]) * extension,
    angle: pose.idleAngle + (pose.contactAngle - pose.idleAngle) * extension,
    extension,
  };
}

export function swingPoint(
  pose: ReturnType<typeof meleeWeaponPose>,
  [x, y]: Point,
): Point {
  const angle = (pose.angle * Math.PI) / 180;
  return [
    pose.x + x * Math.cos(angle) - y * Math.sin(angle),
    pose.y + x * Math.sin(angle) + y * Math.cos(angle),
  ];
}

// Two connected limb segments keep the shoulder planted while the grip moves.
// Select the opposite bend for forward-facing sword arms to clear the chest.
export function armElbow(
  shoulder: Point,
  hand: Point,
  upperLength: number,
  lowerLength: number,
  bendDirection: 1 | -1 = 1,
): Point {
  const dx = hand[0] - shoulder[0];
  const dy = hand[1] - shoulder[1];
  const distance = Math.max(0.001, Math.hypot(dx, dy));
  const along =
    (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const bend =
    Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2)) * bendDirection;
  return [
    shoulder[0] + (dx * along - dy * bend) / distance,
    shoulder[1] + (dy * along + dx * bend) / distance,
  ];
}
