import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("barbarian closes to melee range, strikes one target with double axe, and waits between axe swings", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "barbarian"],
    ["barbarian", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "barbarian"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [barbarian, target, other] = w.units;
  barbarian.x = 400;
  target.x = barbarian.x + attackDistance(barbarian, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(barbarian.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(barbarian.attack, 0);
  // Hold the target in axe range to check the hit and full reload independently.
  target.x = barbarian.x + attackDistance(barbarian, target);
  advance(1);
  assert.equal(
    target.hp,
    10000,
    "the lowered axe must rise before dealing damage",
  );
  advance(5);
  assert.equal(target.hp, 10000 - barbarian.damage);
  assert.equal(other.hp, 10000);
  assert.ok(barbarian.attack > 0);
  advance(75);
  assert.equal(target.hp, 10000 - barbarian.damage);
  advance(12);
  assert.equal(target.hp, 10000 - barbarian.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("barbarian"), false);
});
