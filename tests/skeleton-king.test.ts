import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("skeletonKing closes to melee range, strikes one target with green sword, and waits between sword swings", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "skeletonKing"],
    ["skeletonKing", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "skeletonKing"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [skeletonKing, target, other] = w.units;
  skeletonKing.x = 400;
  target.x = skeletonKing.x + attackDistance(skeletonKing, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(skeletonKing.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(skeletonKing.attack, 0);
  // Hold the target in sword range to check the hit and full reload independently.
  target.x = skeletonKing.x + attackDistance(skeletonKing, target);
  advance(1);
  assert.equal(target.hp, 10000 - skeletonKing.damage);
  assert.equal(other.hp, 10000);
  assert.ok(skeletonKing.attack > 0);
  advance(68);
  assert.equal(target.hp, 10000 - skeletonKing.damage);
  advance(12);
  assert.equal(target.hp, 10000 - skeletonKing.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("skeletonKing"), false);
});
