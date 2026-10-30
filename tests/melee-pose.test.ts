import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyFront, meleeReach, modelScale } from "../src/game/geometry";
import { hasUpswing, UPSWING } from "../src/game/meleeTiming";
import {
  armElbow,
  meleeWeaponPose,
  Point,
  SwingKind,
  swingPoint,
} from "../src/rendering/meleePose";

const arms: Record<
  SwingKind,
  {
    shoulder: Point;
    grip: Point;
    upper: number;
    lower: number;
    bend?: 1 | -1;
  }[]
> = {
  stormblade: [
    { shoulder: [-12, -51], grip: [-11, 0], upper: 16, lower: 18 },
    { shoulder: [13, -55], grip: [-4, 0], upper: 12, lower: 14 },
  ],
  barbarian: [
    { shoulder: [-16, -40], grip: [-1, 0], upper: 17, lower: 17 },
    { shoulder: [16, -40], grip: [24, -2], upper: 17, lower: 19 },
  ],
  gundam: [
    { shoulder: [26, -77], grip: [0, 0], upper: 17, lower: 18, bend: -1 },
  ],
  skeletonKing: [
    { shoulder: [16, -67], grip: [0, 0], upper: 16, lower: 20, bend: -1 },
  ],
};
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test("all four weapon arms keep both limb segments connected as grips swing", () => {
  for (const kind of Object.keys(arms) as SwingKind[]) {
    for (const arm of arms[kind]) {
      const idle = swingPoint(meleeWeaponPose(kind, 0), arm.grip);
      const contact = swingPoint(
        meleeWeaponPose(
          kind,
          hasUpswing(kind) ? UPSWING.contactRemaining : 0.25,
        ),
        arm.grip,
      );
      assert.ok(
        distance(idle, contact) > 10,
        `${kind}: hand must visibly travel`,
      );
      const idleElbow = armElbow(
        arm.shoulder,
        idle,
        arm.upper,
        arm.lower,
        arm.bend,
      );
      const contactElbow = armElbow(
        arm.shoulder,
        contact,
        arm.upper,
        arm.lower,
        arm.bend,
      );
      assert.ok(
        distance(idleElbow, contactElbow) > 2,
        `${kind}: elbow must move`,
      );
      for (let frame = 0; frame <= 50; frame++) {
        const pose = meleeWeaponPose(kind, frame / 200);
        const hand = swingPoint(pose, arm.grip);
        const elbow = armElbow(
          arm.shoulder,
          hand,
          arm.upper,
          arm.lower,
          arm.bend,
        );
        assert.ok(
          Math.abs(distance(arm.shoulder, elbow) - arm.upper) < 1e-7,
          kind,
        );
        assert.ok(Math.abs(distance(elbow, hand) - arm.lower) < 1e-7, kind);
        assert.ok(
          hand[0] + 5 <= bodyFront(kind) / modelScale(kind) + 0.01,
          `${kind}: grip outside body bounds`,
        );
      }
    }
  }
});

test("robot and skeleton elbows stay outside the chest and within their body bounds throughout the swing", () => {
  for (const kind of ["gundam", "skeletonKing"] as const) {
    const arm = arms[kind][0];
    const radius = kind === "gundam" ? 8 : 4.5;
    let previous: Point | undefined;
    for (let frame = 0; frame <= 250; frame++) {
      const pose = meleeWeaponPose(kind, frame / 1000);
      const elbow = armElbow(
        arm.shoulder,
        [pose.x, pose.y],
        arm.upper,
        arm.lower,
        arm.bend,
      );
      assert.ok(elbow[0] > arm.shoulder[0], `${kind}: elbow folded into chest`);
      assert.ok(
        elbow[0] + radius <= bodyFront(kind) / modelScale(kind),
        `${kind}: arm exceeds body bounds`,
      );
      if (previous)
        assert.ok(
          distance(previous, elbow) < 1,
          `${kind}: elbow popped between frames`,
        );
      previous = elbow;
    }
  }
});

test("contact poses match combat reach for both rising and raised weapon attacks", () => {
  for (const [kind, tip, glow] of [
    ["stormblade", [78, 0], 0],
    ["gundam", [54, 2], 6],
    ["skeletonKing", [52, 4], 6],
  ] as const) {
    const contact = meleeWeaponPose(
      kind,
      hasUpswing(kind) ? UPSWING.contactRemaining : 0.25,
    );
    assert.equal(contact.extension, 1);
    assert.deepEqual(
      meleeWeaponPose(kind, hasUpswing(kind) ? 0.16 : 0.2),
      contact,
    );
    assert.equal(
      swingPoint(contact, tip)[0] + glow,
      meleeReach(kind) / modelScale(kind),
    );
    const idle = meleeWeaponPose(kind, 0);
    assert.ok(idle.angle < contact.angle - 50);
  }
});
