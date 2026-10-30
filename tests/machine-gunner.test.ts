import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, GUNNER, UNITS, isRanged } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("machine gunner fires fast individual bullets with travel time and no splash", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "machineGunner"],
    ["machineGunner", null, null],
  );
  w.nextAI = Infinity;
  w.food = 15;
  assert.ok(spawn(w, "player", "machineGunner"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [gunner, target, other] = w.units;
  gunner.x = 400;
  target.x = 630;
  other.x = 650;
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
      assert.equal(bullet.damage, UNITS.machineGunner.damage);
      assert.equal(bullet.startX, gunner.x + GUNNER.muzzleOffsetX);
      assert.ok(bullet.duration < 0.2);
    }
    if (tick === 11) {
      assert.ok(w.projectiles.length > 0);
      assert.equal(target.hp, 10000);
    }
  }
  assert.ok(seen.size >= 6 && seen.size <= 7);
  const hits = (10000 - target.hp) / gunner.damage;
  assert.ok(Number.isInteger(hits) && hits >= 5);
  assert.equal(other.hp, 10000);
  assert.ok(isRanged("machineGunner"));
  assert.ok(UNITS.machineGunner.cooldown < UNITS.rock.cooldown / 5);
});
