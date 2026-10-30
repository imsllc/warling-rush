import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("cyborgWalrus closes to melee range, strikes one target with tusks, and waits between tusk attacks", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "cyborgWalrus"],
    ["cyborgWalrus", null, null],
  );
  w.food = 15;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "cyborgWalrus"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [cyborgWalrus, target, other] = w.units;
  cyborgWalrus.x = 400;
  target.x = cyborgWalrus.x + attackDistance(cyborgWalrus, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(cyborgWalrus.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(cyborgWalrus.attack, 0);
  // Hold the target in tusk range to check the hit and full reload independently.
  target.x = cyborgWalrus.x + attackDistance(cyborgWalrus, target);
  advance(1);
  assert.equal(target.hp, 10000 - cyborgWalrus.damage);
  assert.equal(other.hp, 10000);
  assert.ok(cyborgWalrus.attack > 0);
  advance(65);
  assert.equal(target.hp, 10000 - cyborgWalrus.damage);
  advance(12);
  assert.equal(target.hp, 10000 - cyborgWalrus.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("cyborgWalrus"), false);
});
