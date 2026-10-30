import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

test("shark closes to melee range, bites one target, and waits between bites", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "shark"],
    ["shark", null, null],
  );
  w.food = 15;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "shark"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [shark, target, other] = w.units;
  shark.x = 400;
  target.x = shark.x + attackDistance(shark, target) + 30;
  other.x = target.x + 40;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(10);
  assert.ok(shark.x > 400);
  assert.equal(target.hp, 10000);
  assert.equal(shark.attack, 0);
  // Hold the target in bite range to check the hit and full reload independently.
  target.x = shark.x + attackDistance(shark, target);
  advance(1);
  assert.equal(target.hp, 10000 - shark.damage);
  assert.equal(other.hp, 10000);
  assert.ok(shark.attack > 0);
  advance(45);
  assert.equal(target.hp, 10000 - shark.damage);
  advance(8);
  assert.equal(target.hp, 10000 - shark.damage * 2);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  assert.equal(isRanged("shark"), false);
});
