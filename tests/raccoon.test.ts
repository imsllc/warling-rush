import test from "node:test";
import assert from "node:assert/strict";
import {
  BATTLE,
  UNITS,
  RACCOON,
  raccoonHover,
  isRanged,
} from "../src/game/config";
import { combatPower } from "../src/game/balance";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import {
  initialProgress,
  unlockUnit,
  equipUnit,
  decodeProgress,
} from "../src/progress";
import { bodyFront, BATTLE_UNIT_SCALE } from "../src/game/geometry";
import { raccoonRiflePose } from "../src/rendering/raccoonPose";

test("raccoon arms attach below the face and keep both paws on the rifle throughout recoil", () => {
  const length = (a: readonly number[], b: readonly number[]) =>
    Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (let frame = 0; frame <= 120; frame++) {
    const pose = raccoonRiflePose(frame / 1000);
    for (const [arm, upper, lower] of [
      [pose.trigger, 21, 27],
      [pose.support, 23, 22],
    ] as const) {
      assert.ok(Math.abs(length(arm.shoulder, arm.elbow) - upper) < 1e-8);
      assert.ok(Math.abs(length(arm.elbow, arm.hand) - lower) < 1e-8);
      assert.ok(
        arm.elbow[1] > arm.shoulder[1] + 10,
        "upper arm should hang beside the body",
      );
      assert.ok(
        Math.min(arm.shoulder[1], arm.elbow[1], arm.hand[1]) >= -43,
        "arm must not start in the face",
      );
    }
    assert.ok(
      pose.trigger.elbow[0] < 0,
      "near elbow must stay beside the ribs",
    );
    assert.deepEqual(pose.trigger.hand, [
      21 + pose.weaponX,
      -27 + pose.weaponY,
    ]);
    assert.deepEqual(pose.support.hand, [
      47 + pose.weaponX,
      -36 + pose.weaponY,
    ]);
    assert.ok(
      pose.support.hand[0] + 4.5 <= bodyFront("raccoon") / BATTLE_UNIT_SCALE,
    );
  }
  const idle = raccoonRiflePose(0);
  assert.equal(83 + idle.weaponX, RACCOON.muzzleOffsetX);
  assert.equal(-40 + idle.weaponY + RACCOON.hoverY, RACCOON.muzzleY);
});

test("final raccoon has five times Dark Mage health and sustained damage, at 10,000 gold", () => {
  assert.equal(UNITS.raccoon.hp, UNITS.darkMage.hp * 5);
  assert.ok(
    Math.abs(
      UNITS.raccoon.damage /
        UNITS.raccoon.cooldown /
        (UNITS.darkMage.damage / UNITS.darkMage.cooldown) -
        5,
    ) < 1e-10,
  );
  assert.ok(
    Math.abs(combatPower(UNITS.raccoon) / combatPower(UNITS.darkMage) - 5) <
      1e-10,
  );
  assert.equal(UNITS.raccoon.unlockCost, 10000);
  assert.equal(UNITS.raccoon.cost, 21);
  assert.ok(isRanged("raccoon"));
  assert.equal(bodyFront("raccoon"), 46 * BATTLE_UNIT_SCALE);
  const poor = { ...initialProgress(), coins: 9999 };
  assert.equal(unlockUnit(poor, "raccoon"), null);
  const saved = decodeProgress(
    JSON.stringify(
      equipUnit(unlockUnit({ ...poor, coins: 10000 }, "raccoon")!, "raccoon"),
    ),
  );
  assert.equal(saved.coins, 0);
  assert.ok(saved.army.includes("raccoon"));
});

test("raccoon shoots repeated rifle bullets from the hovering muzzle with small impact attribution and no splash", () => {
  const world = createWorld(
    initialProgress().levels,
    ["clubman", "raccoon"],
    ["raccoon", null, null],
  );
  world.nextAI = Infinity;
  world.food = 21;
  assert.ok(spawn(world, "player", "raccoon"));
  assert.ok(spawn(world, "enemy", "slimeArm"));
  assert.ok(spawn(world, "enemy", "slimeArm"));
  const [raccoon, target, other] = world.units;
  raccoon.x = 400;
  raccoon.cooldown = 0;
  target.x = 650;
  other.x = 680;
  for (const enemy of [target, other]) {
    enemy.hp = enemy.maxHp = 100000;
    enemy.cooldown = 100;
  }
  step(world, BATTLE.fixedStep);
  const bullet = world.projectiles[0];
  assert.equal(bullet.kind, "bullet");
  assert.equal(bullet.visualKind, "raccoon");
  assert.equal(bullet.startX, raccoon.x + RACCOON.muzzleOffsetX);
  assert.equal(
    bullet.launchOffsetY,
    RACCOON.muzzleY + raccoonHover(world.time, raccoon.id),
  );
  assert.equal(target.hp, 100000);
  for (let i = 0; i < 60; i++) step(world, BATTLE.fixedStep);
  assert.ok(target.hp <= 100000 - raccoon.damage * 3);
  assert.equal(other.hp, 100000);
  assert.ok(world.effects.some((effect) => effect.visual?.kind === "raccoon"));
});
