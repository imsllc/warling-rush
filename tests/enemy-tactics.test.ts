import { test } from "node:test";
import assert from "node:assert/strict";
import { AI, BATTLE, ENEMY_TACTICS, UNITS } from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { updateAI } from "../src/game/ai";
import { damage, updateCombat } from "../src/game/combat";
import { attackDistance } from "../src/game/geometry";
import { spawn } from "../src/game/units";
import {
  bossForWave,
  enemyStats,
  enemyTraitForSpawn,
  isBossWave,
  waveBurst,
  waveDifficulty,
  waveEnemyCount,
} from "../src/game/waves";

const levels = { food: 0, health: 0, damage: 0 };

test("counter variants are introduced gradually without changing enemy kinds or boss encounters", () => {
  assert.equal(enemyTraitForSpawn("slimeArm", 2, 0), undefined);
  assert.equal(enemyTraitForSpawn("slimeArm", 3, 0), "armored");
  assert.equal(enemyTraitForSpawn("slimeArm", 3, 1), undefined);
  assert.equal(enemyTraitForSpawn("slimeThrower", 4, 1), undefined);
  assert.equal(enemyTraitForSpawn("slimeThrower", 5, 1), "frail");
  assert.equal(enemyTraitForSpawn("slimeThrower", 5, 0), undefined);
  for (const kind of [
    "dreadmaw",
    "ironback",
    "titan",
    "scientist",
    "pyramid",
  ] as const)
    assert.equal(enemyTraitForSpawn(kind, 200, 0), undefined);
});

test("armored counters keep scaled stats, while fragile ranged troops exchange health for damage at the same power budget", () => {
  for (const wave of [5, 19, 21, 101, 1001]) {
    assert.deepEqual(
      enemyStats("slimeArm", wave, "armored"),
      enemyStats("slimeArm", wave),
    );
    const normal = enemyStats("slimeThrower", wave);
    const fragile = enemyStats("slimeThrower", wave, "frail");
    assert.equal(fragile.hp, Math.round(normal.hp * 0.5));
    assert.equal(fragile.damage, normal.damage * 2);
    assert.equal(fragile.cooldown, normal.cooldown);
    assert.equal(fragile.range, normal.range);
    const ratio = (fragile.hp * fragile.damage) / (normal.hp * normal.damage);
    assert.ok(Math.abs(ratio - 1) <= 1 / normal.hp + 1e-12);
  }
  assert.equal(ENEMY_TACTICS.armorRangedDamage, 0.7);
  assert.equal(ENEMY_TACTICS.armorMeleeDamage, 1.3);
});

test("live melee and projectile combat apply the shield counter exactly once per hit/volley", () => {
  for (const kind of ["clubman", "rock", "mech"] as const) {
    const w = createWorld(levels, [kind], [kind, null, null], 5);
    w.nextAI = Infinity;
    w.food = 20;
    assert.ok(spawn(w, "player", kind));
    assert.ok(spawn(w, "enemy", "slimeArm", "armored"));
    const [troop, target] = w.units;
    troop.x = 400;
    troop.cooldown = 0;
    target.hp = target.maxHp = 1000;
    target.x = troop.x + attackDistance(troop, target);
    target.cooldown = 100;
    updateCombat(w, 0.001);
    if (kind !== "clubman") {
      assert.equal(target.hp, 1000, "projectiles must still travel");
      // Range is measured to the body edge, so wait for the actual flight time.
      updateCombat(w, Math.max(...w.projectiles.map((p) => p.duration)) + 0.001);
    }
    const multiplier = kind === "clubman" ? 1.3 : 0.7;
    assert.ok(
      Math.abs(target.hp - (1000 - UNITS[kind].damage * multiplier)) < 1e-8,
      kind,
    );
    assert.ok(w.effects.every((effect) => effect.damage > 0));
  }
});

test("counter traits cannot be applied to player troops, the wrong enemy, or bosses", () => {
  const w = createWorld(levels, ["rock"], ["rock", null, null], 5);
  w.food = 100;
  const remaining = w.remainingEnemies;
  assert.equal(spawn(w, "player", "rock", "frail"), false);
  assert.equal(spawn(w, "enemy", "slimeArm", "frail"), false);
  assert.equal(spawn(w, "enemy", "slimeThrower", "armored"), false);
  assert.equal(w.food, 100);
  assert.equal(w.remainingEnemies, remaining);
  assert.equal(w.units.length, 0);
  const boss = createWorld(levels, undefined, undefined, 20);
  assert.equal(spawn(boss, "enemy", "dreadmaw", "armored"), false);
  assert.equal(boss.remainingEnemies, 1);
});

test("orange lobbers visibly launch their higher-damage projectile without instant damage", () => {
  const w = createWorld(levels, undefined, undefined, 5);
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "clubman"));
  assert.ok(spawn(w, "enemy", "slimeThrower", "frail"));
  const [target, lobber] = w.units;
  target.x = 400;
  target.hp = target.maxHp = 10000;
  target.cooldown = 100;
  lobber.x = 560;
  lobber.cooldown = 0;
  updateCombat(w, 0.001);
  assert.equal(w.projectiles.length, 1);
  assert.equal(w.projectiles[0].empowered, true);
  assert.equal(
    w.projectiles[0].damage,
    enemyStats("slimeThrower", 5).damage * 2,
  );
  assert.equal(target.hp, 10000);
  updateCombat(w, 0.6);
  assert.equal(target.hp, 10000 - lobber.damage);
});

test("burst intervals create breathing room while retaining the original average spawn cadence", () => {
  for (const wave of [1, 2, 5, 101]) {
    const w = createWorld(levels, undefined, undefined, wave);
    const burst = waveBurst(wave);
    const times: number[] = [];
    for (let i = 0; i <= burst.size; i++) {
      const scheduled = w.nextAI;
      w.time = scheduled - 0.001;
      updateAI(w, () => 0.5);
      assert.equal(w.units.length, 0, "group must not arrive early");
      w.time = scheduled;
      updateAI(w, () => 0.5);
      assert.equal(w.units.length, 1);
      times.push(w.time);
      w.units = [];
    }
    assert.equal(times[0], AI.firstSpawnDelay);
    for (let i = 1; i < burst.size; i++)
      assert.ok(Math.abs(times[i] - times[i - 1] - burst.interval) < 1e-9);
    assert.ok(burst.rest >= 3 && burst.rest > burst.interval * 2);
    assert.ok(
      Math.abs(
        times[burst.size] - times[0] - AI.decisionInterval * burst.size,
      ) < 1e-9,
    );
  }
});

test("blocked burst members retain their variant, count, and planned enemy until space opens", () => {
  for (const blockedBy of ["entry", "cap"] as const) {
    const w = createWorld(levels, undefined, undefined, 5);
    for (let i = 0; i < 3; i++) {
      w.time = w.nextAI;
      updateAI(w, () => 0);
      for (const unit of w.units) unit.x = 700;
    }
    assert.equal(w.burstSpawned, 3);
    const baseline = w.units.length;
    const blockers = blockedBy === "cap" ? BATTLE.maxEnemyUnits - baseline : 3;
    for (let i = 0; i < blockers; i++)
      w.units.push({
        ...w.units[0],
        id: w.nextId++,
        lane: i % 3,
        x: blockedBy === "cap" ? 800 : BATTLE.enemySpawnX,
      });
    const pending = w.remainingEnemies;
    w.time = w.nextAI;
    updateAI(w, () => 0.99);
    assert.equal(w.aiPlan, "slimeThrower");
    assert.equal(w.burstSpawned, 3);
    assert.equal(w.remainingEnemies, pending);
    w.units = w.units.slice(0, baseline);
    w.time = w.nextAI;
    updateAI(w, () => 0);
    assert.equal(w.units.at(-1)!.kind, "slimeThrower");
    assert.equal(w.units.at(-1)!.enemyTrait, "frail");
    assert.equal(w.burstSpawned, 0);
    assert.equal(w.remainingEnemies, pending - 1);
    assert.ok(Math.abs(w.nextAI - w.time - waveBurst(5).rest) < 1e-9);
  }
});

test("burst waves and counter variants preserve exact enemy counts and total gold through endless play", () => {
  const rolls = [0, 0, 0, 0.99, 0, 0, 0.99]; // Existing five-to-two mix.
  for (const wave of [1, 2, 3, 5, 19, 20, 21, 80, 100, 101, 120, 999]) {
    const w = createWorld(levels, undefined, undefined, wave);
    const count = waveEnemyCount(wave);
    const traits = new Set<string>();
    for (let i = 0; i < count; i++) {
      w.time = w.nextAI;
      updateAI(w, () => rolls[i % rolls.length]);
      assert.equal(w.units.length, 1);
      const enemy = w.units[0];
      assert.equal(w.remainingEnemies, count - i - 1);
      if (enemy.enemyTrait) traits.add(enemy.enemyTrait);
      if (isBossWave(wave)) {
        assert.equal(enemy.kind, bossForWave(wave));
        assert.equal(enemy.enemyTrait, undefined);
        assert.equal(w.burstSpawned, 0);
      }
      const gold = w.coinsEarned;
      damage(w, enemy, enemy.hp, enemy.lane);
      const earned = w.coinsEarned;
      assert.ok(earned > gold);
      damage(w, enemy, 999999, enemy.lane);
      assert.equal(w.coinsEarned, earned, "dead enemies cannot pay twice");
      w.units = [];
    }
    if (wave >= 5 && !isBossWave(wave)) {
      assert.ok(traits.has("armored"));
      assert.ok(traits.has("frail"));
    }
    assert.equal(
      w.coinsEarned,
      (10 + Math.floor((wave - 1) / 5)) * waveDifficulty(wave).enemyCount,
    );
    assert.equal(w.kills, count);
    w.time = w.nextAI;
    updateAI(w, () => 0.5);
    assert.equal(w.units.length, 0);
    updateCombat(w, BATTLE.fixedStep);
    assert.equal(w.result, "player");
  }
});
