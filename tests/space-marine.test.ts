import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, MARINE, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("spaceMarine fires fast individual bullets with travel time and no splash", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "spaceMarine"],
    ["spaceMarine", null, null],
  );
  w.nextAI = Infinity;
  w.food = BATTLE.maxUnitFoodCost;
  assert.ok(spawn(w, "player", "spaceMarine"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [gunner, target, other] = w.units;
  gunner.x = 400;
  target.x = 595;
  other.x = 625;
  for (const enemy of [target, other]) {
    enemy.hp = enemy.maxHp = 10000;
    enemy.cooldown = 100;
  }
  const seen = new Set<number>();
  for (let tick = 0; tick < 72; tick++) {
    step(w, BATTLE.fixedStep);
    for (const bullet of w.projectiles) {
      seen.add(bullet.id);
      assert.equal(bullet.kind, "bullet");
      assert.equal(bullet.damage, UNITS.spaceMarine.damage);
      assert.equal(bullet.startX, gunner.x + MARINE.muzzleOffsetX);
      assert.equal(bullet.launchOffsetY, MARINE.muzzleY);
      assert.ok(bullet.duration < 0.2);
    }
    if (tick === 11) {
      assert.ok(w.projectiles.length > 0);
      assert.equal(target.hp, 10000);
    }
  }
  assert.ok(seen.size === 3);
  const hits = (10000 - target.hp) / gunner.damage;
  assert.ok(Number.isInteger(hits) && hits >= 2);
  assert.equal(other.hp, 10000);
  assert.ok(isRanged("spaceMarine"));
  assert.ok(UNITS.spaceMarine.cooldown < UNITS.rock.cooldown);
});
