import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, ENEMY_UNITS, UNITS } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { updateAI } from "../src/game/ai";
import {
  enemyStats,
  bossForWave,
  isBossWave,
  waveDifficulty,
  waveEnemyCount,
} from "../src/game/waves";

const levels = { food: 0, health: 0, damage: 0 };

test("difficulty is a superlinear power curve whose percentage growth eases", () => {
  let previous = waveDifficulty(1);
  let previousRatio = Infinity;
  let previousIncrement = 0;
  for (let wave = 2; wave <= 1000; wave++) {
    const current = waveDifficulty(wave);
    assert.ok(current.enemyCount >= previous.enemyCount);
    assert.ok(current.healthMultiplier > previous.healthMultiplier);
    assert.ok(current.attackMultiplier > previous.attackMultiplier);
    const increment = current.strength - previous.strength;
    const ratio = current.strength / previous.strength;
    assert.ok(increment > previousIncrement); // Faster than linear.
    assert.ok(ratio < previousRatio); // No constant exponential percentage.
    const countBeforeRounding = 12 * current.strength ** 0.4;
    assert.ok(
      Math.abs(
        ((countBeforeRounding / 12) *
          Math.sqrt(current.healthMultiplier * current.attackMultiplier)) /
          current.strength -
          1,
      ) < 1e-10,
    );
    previous = current;
    previousRatio = ratio;
    previousIncrement = increment;
  }
  assert.ok(waveDifficulty(200).enemyCount > waveDifficulty(100).enemyCount);
  assert.ok(
    waveDifficulty(200).healthMultiplier > waveDifficulty(100).healthMultiplier,
  );
});

test("spawned slimes use their wave's health and attack without changing player stats", () => {
  for (const wave of [1, 2, 10, 50, 101, 1001]) {
    for (const kind of ["slimeArm", "slimeThrower"] as const) {
      const w = createWorld(
        { food: 0, health: 3, damage: 4 },
        undefined,
        undefined,
        wave,
      );
      assert.ok(spawn(w, "enemy", kind));
      assert.equal(w.units[0].hp, enemyStats(kind, wave).hp);
      assert.equal(w.units[0].maxHp, w.units[0].hp);
      assert.equal(w.units[0].damage, enemyStats(kind, wave).damage);
      assert.ok(spawn(w, "player", "clubman"));
      assert.equal(w.units[1].hp, UNITS.clubman.hp * 1.3);
      assert.equal(w.units[1].damage, UNITS.clubman.damage * 1.4);
    }
  }
  assert.equal(enemyStats("slimeArm", 1).hp, ENEMY_UNITS.slimeArm.hp);
  assert.equal(ENEMY_UNITS.slimeArm.hp, 100);
});

test("both wave compositions spawn exactly the scheduled slime count and then stop", () => {
  for (const wave of [1, 2, 10, 50, 100]) {
    for (const roll of [0, 0.99]) {
      const w = createWorld(levels, undefined, undefined, wave);
      const count = waveEnemyCount(wave);
      for (let i = 0; i < count; i++) {
        w.time = w.nextAI;
        updateAI(w, () => roll);
        assert.equal(w.units.length, 1);
        assert.equal(
          w.units[0].kind,
          isBossWave(wave)
            ? bossForWave(wave)
            : wave === 1 || roll === 0
              ? "slimeArm"
              : "slimeThrower",
        );
        assert.equal(w.remainingEnemies, count - i - 1);
        w.units = []; // Defeat each spawn to exercise the full schedule.
      }
      w.time = w.nextAI;
      updateAI(w, () => roll);
      assert.equal(w.units.length, 0);
      step(w, BATTLE.fixedStep);
      assert.equal(w.result, "player");
    }
  }
});

test("scaled projectile attacks carry the spawned slime's damage to the bunker", () => {
  const wave = 25;
  const w = createWorld(levels, undefined, undefined, wave);
  w.nextAI = Infinity;
  spawn(w, "enemy", "slimeThrower");
  w.units[0].x = 200;
  for (let i = 0; i < 12; i++) step(w, 1 / 60);
  assert.equal(
    w.projectiles[0].damage,
    enemyStats("slimeThrower", wave).damage,
  );
  for (let i = 0; i < 60; i++) step(w, 1 / 60);
  assert.equal(
    w.bases.player,
    BATTLE.baseHp - enemyStats("slimeThrower", wave).damage,
  );
});

test("invalid wave numbers cannot create invalid wave stats", () => {
  for (const wave of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() => waveDifficulty(wave));
  const high = waveDifficulty(Number.MAX_SAFE_INTEGER);
  assert.ok(Number.isSafeInteger(high.enemyCount));
  assert.ok(Number.isFinite(high.healthMultiplier));
  assert.ok(Number.isFinite(high.attackMultiplier));
});
