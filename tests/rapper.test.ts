import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, RAPPER, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("musical notes travel before dealing one hit, repeat on cooldown, and do not splash", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "rapper"],
    ["rapper", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "rapper"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [player, target, other] = w.units;
  player.x = 400;
  player.lane = 2;
  target.x = 580;
  other.x = 610;
  for (const unit of [target, other]) {
    unit.hp = unit.maxHp = 10000;
    unit.cooldown = 100;
  }
  for (let i = 0; i < 12; i++) step(w, BATTLE.fixedStep);
  assert.equal(w.projectiles.length, 1);
  assert.equal(w.projectiles[0].kind, "note");
  assert.equal(w.projectiles[0].damage, UNITS.rapper.damage);
  assert.equal(w.projectiles[0].startX, player.x + RAPPER.micX);
  assert.equal(w.projectiles[0].launchOffsetY, RAPPER.micY);
  assert.equal(w.projectiles[0].launchLane, 2);
  assert.equal(target.hp, 10000);
  for (let i = 0; i < 45; i++) step(w, BATTLE.fixedStep);
  assert.equal(target.hp, 10000 - player.damage);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  for (let i = 0; i < 72; i++) step(w, BATTLE.fixedStep);
  assert.ok(target.hp <= 10000 - player.damage * 2);
  assert.equal(other.hp, 10000);
  assert.ok(isRanged("rapper"));
});
