import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, TIGER, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("tiger fires red lasers from both eyes with one total hit budget and a reload", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "tiger"],
    ["tiger", null, null],
  );
  w.food = 15;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "tiger"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [tiger, target, other] = w.units;
  tiger.x = 400;
  tiger.lane = 2;
  target.x = 595;
  other.x = 620;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(12);
  assert.equal(w.projectiles.length, 2);
  assert.deepEqual(
    w.projectiles.map((p) => p.startX),
    TIGER.eyes.map((eye) => tiger.x + eye.x),
  );
  assert.deepEqual(
    w.projectiles.map((p) => p.launchOffsetY),
    TIGER.eyes.map((eye) => eye.y),
  );
  for (const laser of w.projectiles) {
    assert.equal(laser.kind, "laser");
    assert.equal(laser.launchLane, 2);
    assert.equal(laser.target, target.id);
    assert.equal(laser.damage, UNITS.tiger.damage / 2);
  }
  assert.equal(target.hp, 10000);
  advance(15);
  assert.equal(target.hp, 10000 - tiger.damage);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  advance(30);
  assert.equal(target.hp, 10000 - tiger.damage);
  advance(10);
  assert.equal(w.projectiles.length, 2);
  advance(15);
  assert.equal(target.hp, 10000 - tiger.damage * 2);
  assert.equal(other.hp, 10000);
  assert.ok(isRanged("tiger"));
});
