import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("duck closes to melee range, strikes one target with beak, and waits between pecks", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "duck"],
    ["duck", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "duck"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [duck, target, other] = w.units;
  duck.x = 400;
  target.x = duck.x + attackDistance(duck, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(duck.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(duck.attack, 0);
  // Hold the target in peck range to check the hit and full reload independently.
  target.x = duck.x + attackDistance(duck, target);
  advance(1);
  assert.equal(target.hp, 10000 - duck.damage);
  assert.equal(other.hp, 10000);
  assert.ok(duck.attack > 0);
  advance(25);
  assert.equal(target.hp, 10000 - duck.damage);
  advance(10);
  assert.equal(target.hp, 10000 - duck.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("duck"), false);
});
