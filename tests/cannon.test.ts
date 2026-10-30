import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, CANNON, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("cannon fires heavy balls from its muzzle, damages on impact, and reloads", () => {
  const w = createWorld(
    { food: 0, health: 2, damage: 3 },
    ["clubman", "cannon"],
    ["cannon", null, null],
  );
  w.food = 15;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "cannon"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [cannon, target, other] = w.units;
  cannon.x = 400;
  cannon.lane = 2;
  target.x = 650;
  other.x = 670;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  const advance = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step(w, BATTLE.fixedStep);
  };
  advance(12);
  assert.equal(w.projectiles.length, 1);
  const ball = w.projectiles[0];
  assert.equal(ball.kind, "cannonball");
  assert.equal(ball.startX, cannon.x + CANNON.muzzleOffsetX);
  assert.equal(ball.launchLane, 2);
  assert.equal(ball.damage, UNITS.cannon.damage * 1.3);
  assert.equal(cannon.maxHp, UNITS.cannon.hp * 1.2);
  assert.equal(target.hp, 10000);
  advance(40);
  assert.equal(target.hp, 10000 - cannon.damage);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  advance(60);
  assert.equal(w.projectiles.length, 0);
  assert.equal(target.hp, 10000 - cannon.damage);
  advance(20);
  assert.equal(w.projectiles.length, 1);
  advance(40);
  assert.ok(Math.abs(target.hp - (10000 - cannon.damage * 2)) < 1e-8);
  assert.ok(isRanged("cannon"));
});
