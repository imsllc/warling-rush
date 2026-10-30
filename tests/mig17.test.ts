import test from "node:test";
import assert from "node:assert/strict";
import { BATTLE, MIG, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("MiG-17 launches one underwing missile per attack, damages after flight and reloads", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "mig17"],
    ["mig17", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "mig17"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [jet, target, other] = w.units;
  jet.x = 400;
  target.x = 625;
  other.x = 655;
  for (const enemy of [target, other]) {
    enemy.hp = enemy.maxHp = 10000;
    enemy.cooldown = 100;
  }
  for (let tick = 0; tick < 12; tick++) step(w, BATTLE.fixedStep);
  assert.equal(w.projectiles.length, 1);
  const missile = w.projectiles[0];
  assert.equal(missile.kind, "missile");
  assert.equal(missile.damage, UNITS.mig17.damage);
  assert.equal(missile.startX, jet.x + MIG.missileX);
  assert.equal(missile.launchOffsetY, MIG.missileY);
  assert.equal(missile.launchLane, jet.lane);
  assert.equal(target.hp, 10000);
  const firstId = missile.id;
  while (w.time < 1.5) step(w, BATTLE.fixedStep);
  assert.equal(target.hp, 10000 - jet.damage);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  while (w.time < 2.05) step(w, BATTLE.fixedStep);
  assert.equal(w.projectiles.length, 1);
  assert.notEqual(w.projectiles[0].id, firstId);
  assert.ok(isRanged("mig17"));
});
