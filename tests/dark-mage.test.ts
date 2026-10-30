import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, MAGE, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("fire spells travel before dealing one hit, repeat on cooldown, and do not splash", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "darkMage"],
    ["darkMage", null, null],
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "darkMage"));
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
  assert.equal(w.projectiles[0].kind, "fireball");
  assert.equal(w.projectiles[0].damage, UNITS.darkMage.damage);
  assert.equal(w.projectiles[0].startX, player.x + MAGE.staffX);
  assert.equal(w.projectiles[0].launchOffsetY, MAGE.staffY);
  assert.equal(w.projectiles[0].launchLane, 2);
  assert.equal(target.hp, 10000);
  for (let i = 0; i < 45; i++) step(w, BATTLE.fixedStep);
  assert.equal(target.hp, 10000 - player.damage);
  assert.equal(other.hp, 10000);
  assert.equal(w.projectiles.length, 0);
  for (let i = 0; i < 100; i++) step(w, BATTLE.fixedStep);
  assert.ok(target.hp <= 10000 - player.damage * 2);
  assert.equal(other.hp, 10000);
  assert.ok(isRanged("darkMage"));
});
