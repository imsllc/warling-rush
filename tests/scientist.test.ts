import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, UNITS, UnitKind } from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { updateAI } from "../src/game/ai";
import { damage, updateCombat } from "../src/game/combat";
import { spawn } from "../src/game/units";
import { bossForWave, enemyStats } from "../src/game/waves";
import {
  initialProgress,
  decodeProgress,
  unlockUnit,
  rewardBattle,
} from "../src/progress";

const levels = { food: 0, health: 0, damage: 0 };

test("wave 80 schedules one enemy-only scientist and victory advances to wave 81", () => {
  const w = createWorld(levels, undefined, undefined, 80);
  assert.equal(bossForWave(80), "scientist");
  assert.equal(bossForWave(180), "scientist");
  assert.equal(bossForWave(100), "pyramid");
  assert.equal(spawn(w, "player", "scientist"), false);
  assert.equal(Object.hasOwn(UNITS, "scientist"), false);
  const p = { ...initialProgress(), waveNumber: 80, coins: 100000 };
  assert.equal(unlockUnit(p, "scientist" as UnitKind), null);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "scientist"] }),
    ),
  );
  w.time = w.nextAI;
  updateAI(w, () => 0);
  assert.equal(w.units[0].kind, "scientist");
  assert.equal(w.remainingEnemies, 0);
  assert.equal(w.units[0].hp, enemyStats("scientist", 80).hp);
  assert.equal(w.units[0].damage, enemyStats("scientist", 80).damage);
  damage(w, w.units[0], w.units[0].hp, 1);
  updateCombat(w, 0.01);
  assert.equal(w.result, "player");
  assert.equal(
    decodeProgress(JSON.stringify(rewardBattle(p, true))).waveNumber,
    81,
  );
  assert.equal(rewardBattle(p, false).waveNumber, 80);
});

test("potion attacks travel, splash at most three troops, and never hit outside the radius", () => {
  const w = createWorld(levels, undefined, undefined, 80);
  w.nextAI = Infinity;
  spawn(w, "enemy", "scientist");
  const scientist = w.units[0];
  scientist.x = 600;
  scientist.cooldown = 0;
  for (const x of [400, 395, 390, 385, 300]) {
    w.food = 15;
    assert.ok(spawn(w, "player", "clubman"));
    const troop = w.units.at(-1)!;
    troop.x = x;
    troop.hp = troop.maxHp = 2000;
    troop.cooldown = 100;
  }
  updateCombat(w, 0.01);
  assert.equal(w.projectiles.length, 1);
  const projectile = w.projectiles[0];
  assert.equal(projectile.kind, "potion");
  assert.equal(projectile.damage, scientist.damage);
  assert.ok(w.units.slice(1).every((u) => u.hp === 2000));
  updateCombat(w, projectile.duration);
  assert.equal(
    w.units.filter((u) => u.side === "player" && u.hp < 2000).length,
    3,
  );
  assert.equal(w.units[1].hp, 2000 - scientist.damage);
  assert.equal(w.units.at(-1)!.hp, 2000);
  assert.equal(w.projectiles.length, 0);
  const health = w.units.map((u) => u.hp);
  updateCombat(w, 0.01);
  assert.deepEqual(
    w.units.map((u) => u.hp),
    health,
  );
  assert.ok(w.effects.every((effect) => effect.potion));
});

test("scientist potion can damage the bunker with its scaled attack", () => {
  const w = createWorld(levels, undefined, undefined, 80);
  w.nextAI = Infinity;
  spawn(w, "enemy", "scientist");
  w.units[0].x = 250;
  w.units[0].cooldown = 0;
  updateCombat(w, 0.01);
  assert.equal(w.projectiles[0].target, "player");
  assert.equal(w.bases.player, BATTLE.baseHp);
  updateCombat(w, 0.6);
  assert.equal(
    w.bases.player,
    BATTLE.baseHp - enemyStats("scientist", 80).damage,
  );
});
