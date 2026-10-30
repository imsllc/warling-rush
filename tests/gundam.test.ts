import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("gundam closes to melee range, strikes one target with blue beam sword, and waits between sword swings", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "gundam"],
    ["gundam", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "gundam"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [gundam, target, other] = w.units;
  gundam.x = 400;
  target.x = gundam.x + attackDistance(gundam, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(gundam.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(gundam.attack, 0);
  // Hold the target in sword range to check the hit and full reload independently.
  target.x = gundam.x + attackDistance(gundam, target);
  advance(1);
  assert.equal(target.hp, 10000 - gundam.damage);
  assert.equal(other.hp, 10000);
  assert.ok(gundam.attack > 0);
  advance(60);
  assert.equal(target.hp, 10000 - gundam.damage);
  advance(12);
  assert.equal(target.hp, 10000 - gundam.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("gundam"), false);
});
