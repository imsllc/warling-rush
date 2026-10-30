import { test } from "node:test";
import assert from "node:assert/strict";
import { COMBAT_UNITS, ENEMY_UNITS, UNITS, UnitKind } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { decodeProgress, initialProgress, unlockUnit } from "../src/progress";

test("the two wave creatures cannot be bought, unlocked, saved, or deployed by players", () => {
  const p = { ...initialProgress(), coins: 100000 };
  assert.deepEqual(Object.keys(ENEMY_UNITS), ["slimeArm", "slimeThrower"]);
  for (const kind of Object.keys(ENEMY_UNITS) as (keyof typeof ENEMY_UNITS)[]) {
    assert.equal(Object.hasOwn(UNITS, kind), false);
    assert.equal(unlockUnit(p, kind as UnitKind), null);
    assert.ok(!p.unlockedUnits.includes(kind as UnitKind));
    assert.throws(() =>
      decodeProgress(
        JSON.stringify({ ...p, unlockedUnits: ["clubman", kind] }),
      ),
    );
    const w = createWorld(p.levels);
    w.food = 15;
    assert.equal(spawn(w, "player", kind), false);
    assert.equal(w.food, 15);
    assert.equal(w.units.length, 0);
  }
  const w = createWorld(p.levels);
  for (const kind of Object.keys(UNITS) as UnitKind[]) {
    assert.equal(spawn(w, "enemy", kind), false);
  }
});

test("slime sword hits directly and slingshot slime damages a troop only after flight", () => {
  for (const kind of ["slimeArm", "slimeThrower"] as const) {
    const w = createWorld({ food: 0, health: 0, damage: 0 });
    w.nextAI = Infinity;
    assert.ok(spawn(w, "player", "clubman"));
    assert.ok(spawn(w, "enemy", kind));
    const [target, slime] = w.units;
    target.x = 400;
    target.cooldown = 100;
    target.hp = target.maxHp = 1000;
    slime.x = kind === "slimeArm" ? 425 : 570;
    for (let i = 0; i < 12; i++) step(w, 1 / 60);
    if (kind === "slimeArm") {
      assert.equal(w.projectiles.length, 0);
      assert.equal(target.hp, 1000 - COMBAT_UNITS[kind].damage);
    } else {
      assert.equal(target.hp, 1000);
      assert.equal(w.projectiles[0].kind, "slime");
      for (let i = 0; i < 40; i++) step(w, 1 / 60);
      assert.equal(target.hp, 1000 - COMBAT_UNITS[kind].damage);
    }
    assert.equal(slime.maxHp, ENEMY_UNITS[kind].hp);
  }
});
