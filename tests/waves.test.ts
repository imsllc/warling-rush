import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AI,
  BATTLE,
  COMBAT_UNITS,
  ENEMY_UNITS,
  UNITS,
  UnitKind,
} from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { updateAI } from "../src/game/ai";
import { damage, updateCombat } from "../src/game/combat";
import { spawn } from "../src/game/units";
import { waveDifficulty } from "../src/game/waves";
import { decodeProgress, initialProgress, rewardBattle } from "../src/progress";

const levels = { food: 0, health: 0, damage: 0 };

test("a new player's first slime wave can be cleared by the starter army", () => {
  const p = initialProgress();
  const w = createWorld(p.levels, p.unlockedUnits, p.army);
  let next = 0;
  for (let tick = 0; tick < 180 * 60 && !w.result; tick++) {
    if (tick % 30 === 0 && spawn(w, "player", p.unlockedUnits[next % 3]))
      next++;
    step(w, BATTLE.fixedStep, () => 0.99);
    assert.ok(
      w.units.every((u) =>
        u.side === "player"
          ? p.unlockedUnits.includes(u.kind as UnitKind)
          : Object.hasOwn(ENEMY_UNITS, u.kind),
      ),
    );
  }
  assert.equal(w.result, "player");
  for (const wave of [1, 2, 3, 50]) {
    const later = createWorld(levels, undefined, undefined, wave);
    later.time = later.nextAI;
    updateAI(later, () => 0.99);
    assert.equal(later.units[0].kind, wave === 1 ? "slimeArm" : "slimeThrower");
  }
});

test("wave budget is finite, grows with wave number, and does not regenerate", () => {
  const w = createWorld(levels);
  assert.equal(w.remainingEnemies, waveDifficulty(1).enemyCount);
  assert.ok(
    createWorld(levels, undefined, undefined, 2).remainingEnemies >
      w.remainingEnemies,
  );
  assert.ok(
    Number.isSafeInteger(
      createWorld(levels, undefined, undefined, Number.MAX_SAFE_INTEGER)
        .remainingEnemies,
    ),
  );
  w.nextAI = Infinity;
  for (let i = 0; i < 600; i++) step(w, BATTLE.fixedStep);
  assert.equal(w.remainingEnemies, waveDifficulty(1).enemyCount);
  assert.equal(w.result, null);
});

test("wave enemies enter fully offscreen and spawning stops when its budget is spent", () => {
  const w = createWorld(levels);
  let spent = 0;
  for (let i = 0; i < 30; i++) {
    w.time = w.nextAI;
    const before = w.units.length;
    updateAI(w, () => 0.99);
    if (w.units.length > before) {
      const enemy = w.units.at(-1)!;
      assert.equal(enemy.x, BATTLE.enemySpawnX);
      assert.ok(enemy.x > BATTLE.width + 60);
      spent++;
      for (const unit of w.units) unit.x -= 100;
    }
  }
  assert.equal(spent, waveDifficulty(1).enemyCount);
  assert.equal(w.remainingEnemies, 0);
  const count = w.units.length;
  w.time += 100;
  updateAI(w, () => 0.5);
  assert.equal(w.units.length, count);
});

test("a temporarily blocked entry retains its next enemy and budget", () => {
  const w = createWorld(levels);
  for (let i = 0; i < 3; i++) assert.ok(spawn(w, "enemy", "slimeArm"));
  const budget = w.remainingEnemies;
  w.time = w.nextAI;
  updateAI(w, () => 0);
  assert.equal(w.units.length, 3);
  assert.equal(w.remainingEnemies, budget);
  assert.equal(w.aiPlan, "slimeArm");
  for (const unit of w.units) unit.x -= 100;
  w.time = w.nextAI;
  updateAI(w, () => 0.99);
  assert.equal(w.units.length, 4);
  assert.equal(w.units[3].kind, "slimeArm");
  assert.equal(w.remainingEnemies, budget - 1);
});

test("victory requires no pending spawns and no living enemies, with no enemy base", () => {
  const w = createWorld(levels);
  assert.deepEqual(w.bases, { player: BATTLE.baseHp });
  updateCombat(w, 0.1);
  assert.equal(w.result, null); // Waiting for the first spawn is not a win.
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const enemy = w.units[0];
  damage(w, enemy, enemy.maxHp, enemy.lane);
  updateCombat(w, 0.1);
  assert.equal(w.result, null); // More enemies remain in the wave budget.
  w.remainingEnemies = 1;
  assert.ok(spawn(w, "enemy", "slimeArm"));
  updateCombat(w, 0.1);
  assert.equal(w.result, null); // Last living enemy must still be defeated.
  const last = w.units.at(-1)!;
  damage(w, last, last.maxHp, last.lane);
  step(w, BATTLE.fixedStep);
  assert.equal(w.result, "player");
  const time = w.time;
  step(w, 1);
  assert.equal(w.time, time);
});

test("player troops hold inside the right edge and never fire at a removed bunker", () => {
  const kinds: [UnitKind, UnitKind, UnitKind] = ["clubman", "rock", "mech"];
  for (const kind of kinds) {
    const w = createWorld(levels, kinds, kinds);
    w.nextAI = Infinity;
    w.food = 15;
    assert.ok(spawn(w, "player", kind));
    w.units[0].x = 930;
    for (let i = 0; i < 600; i++) step(w, BATTLE.fixedStep);
    assert.equal(w.units[0].x, BATTLE.playerAdvanceX);
    assert.equal(w.projectiles.length, 0);
    assert.equal(w.result, null);
  }
});

test("thrown slime damages the player bunker and its destruction takes priority", () => {
  const w = createWorld(levels);
  w.nextAI = Infinity;
  w.remainingEnemies = 9;
  assert.ok(spawn(w, "enemy", "slimeThrower"));
  w.units[0].x = 200;
  for (let i = 0; i < 12; i++) step(w, BATTLE.fixedStep);
  assert.equal(w.projectiles.length, 1);
  assert.equal(w.projectiles[0].kind, "slime");
  assert.ok(w.projectiles.every((p) => p.target === "player"));
  for (let i = 0; i < 60; i++) step(w, BATTLE.fixedStep);
  assert.equal(w.bases.player, BATTLE.baseHp - ENEMY_UNITS.slimeThrower.damage);
  w.units[0].hp = 0;
  w.bases.player = 0;
  updateCombat(w, 0.1);
  assert.equal(w.result, "enemy");
});

test("only victory advances the saved wave, and old saves retain their current number", () => {
  const initial = initialProgress();
  assert.equal(initial.waveNumber, 1);
  const won = rewardBattle(initial, true);
  const lost = rewardBattle(won, false);
  assert.equal(won.waveNumber, 2);
  assert.equal(lost.waveNumber, 2);
  assert.equal(lost.battles, 2);
  assert.equal(lost.coins, 100);
  assert.deepEqual(decodeProgress(JSON.stringify(lost)), lost);
  const { waveNumber, ...legacy } = { ...lost, battles: 41 };
  assert.equal(decodeProgress(JSON.stringify(legacy)).waveNumber, 42);
  for (const invalid of [null, 0, -1, 2.5, "2"]) {
    assert.throws(() =>
      decodeProgress(JSON.stringify({ ...initial, waveNumber: invalid })),
    );
  }
});
