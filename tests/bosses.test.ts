import { test } from "node:test";
import assert from "node:assert/strict";
import { AI, BATTLE, BOSS, PYRAMID, UNITS, UnitKind } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { updateAI } from "../src/game/ai";
import { damage, updateCombat } from "../src/game/combat";
import { spawn } from "../src/game/units";
import {
  enemyStats,
  bossForWave,
  isBossWave,
  waveDifficulty,
  waveEnemyCount,
} from "../src/game/waves";
import {
  initialProgress,
  decodeProgress,
  unlockUnit,
  rewardBattle,
} from "../src/progress";

const levels = { food: 0, health: 0, damage: 0 };

test("wave 60 robot is enemy-only, punches with scaled damage, and unlocks wave 61 on victory", () => {
  const w = createWorld(levels, undefined, undefined, 60);
  w.nextAI = Infinity;
  assert.equal(bossForWave(60), "titan");
  assert.equal(bossForWave(160), "titan");
  assert.equal(Object.hasOwn(UNITS, "titan"), false);
  assert.equal(spawn(w, "player", "titan"), false);
  const p = { ...initialProgress(), waveNumber: 60, coins: 100000 };
  assert.equal(unlockUnit(p, "titan" as UnitKind), null);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "titan"] }),
    ),
  );
  assert.ok(spawn(w, "enemy", "titan"));
  assert.equal(w.remainingEnemies, 0);
  const robot = w.units[0];
  assert.equal(robot.maxHp, enemyStats("titan", 60).hp);
  assert.equal(robot.damage, enemyStats("titan", 60).damage);
  robot.x = 500;
  robot.cooldown = 0;
  for (let i = 0; i < 3; i++) {
    w.food = 15;
    spawn(w, "player", "clubman");
    const troop = w.units.at(-1)!;
    troop.x = 415;
    troop.hp = troop.maxHp = 1000;
    troop.cooldown = 10;
  }
  updateCombat(w, 0.01);
  assert.ok(w.units.slice(1).every((u) => u.hp === 1000 - robot.damage));
  assert.equal(w.projectiles.length, 0);
  assert.ok(robot.attack > 0);
  damage(w, robot, robot.hp, 1);
  step(w, BATTLE.fixedStep);
  assert.equal(w.result, "player");
  assert.equal(
    decodeProgress(JSON.stringify(rewardBattle(p, true))).waveNumber,
    61,
  );
  assert.equal(rewardBattle(p, false).waveNumber, 60);
});

test("wave 40 gorilla is enemy-only, punches nearby troops, and advances to wave 41", () => {
  const w = createWorld(levels, undefined, undefined, 40);
  w.nextAI = Infinity;
  assert.equal(spawn(w, "player", "ironback"), false);
  assert.equal(Object.hasOwn(UNITS, "ironback"), false);
  const p = { ...initialProgress(), waveNumber: 40, coins: 100000 };
  assert.equal(unlockUnit(p, "ironback" as UnitKind), null);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "ironback"] }),
    ),
  );
  assert.ok(spawn(w, "enemy", "ironback"));
  const gorilla = w.units[0];
  gorilla.x = 500;
  gorilla.cooldown = 0;
  for (let i = 0; i < 3; i++) {
    w.food = 15;
    spawn(w, "player", "clubman");
    const troop = w.units.at(-1)!;
    troop.x = 415;
    troop.hp = troop.maxHp = 1000;
    troop.cooldown = 10;
  }
  updateCombat(w, 0.01);
  assert.ok(w.units.slice(1).every((u) => u.hp === 1000 - gorilla.damage));
  assert.equal(w.projectiles.length, 0);
  assert.ok(gorilla.attack > 0);
  damage(w, gorilla, gorilla.hp, 1);
  step(w, BATTLE.fixedStep);
  assert.equal(w.result, "player");
  const saved = decodeProgress(JSON.stringify(rewardBattle(p, true)));
  assert.equal(saved.waveNumber, 41);
  assert.equal(bossForWave(saved.waveNumber), null);
  assert.ok(enemyStats("ironback", 80).hp > enemyStats("ironback", 40).hp);
});

test("wave 20 is beatable by an upgraded mixed army and ignoring the boss loses", () => {
  const army: [UnitKind, UnitKind, UnitKind] = ["clubman", "spearman", "rock"];
  for (const deploy of [false, true]) {
    const w = createWorld({ food: 10, health: 10, damage: 10 }, army, army, 20);
    let next = 0;
    for (let tick = 0; tick < 180 * 60 && !w.result; tick++) {
      if (
        deploy &&
        tick % 30 === 0 &&
        spawn(w, "player", army[next % army.length])
      )
        next++;
      step(w, BATTLE.fixedStep, () => 0.5);
    }
    assert.equal(w.result, deploy ? "player" : "enemy");
    assert.ok(w.time < 180);
  }
});

test("every twentieth wave cycles all five boss encounters", () => {
  for (let wave = 1; wave <= 300; wave++) {
    assert.equal(isBossWave(wave), wave % 20 === 0);
    const w = createWorld(levels, undefined, undefined, wave);
    assert.equal(w.remainingEnemies, waveEnemyCount(wave));
    if (!isBossWave(wave)) {
      assert.equal(spawn(w, "enemy", "dreadmaw"), false);
      continue;
    }
    assert.equal(w.remainingEnemies, 1);
    const kind = (
      ["dreadmaw", "ironback", "titan", "scientist", "pyramid"] as const
    )[(wave / 20 - 1) % 5];
    assert.equal(bossForWave(wave), kind);
    assert.equal(
      spawn(w, "enemy", kind === "ironback" ? "dreadmaw" : "ironback"),
      false,
    );
    assert.equal(spawn(w, "enemy", "slimeArm"), false);
    assert.equal(spawn(w, "enemy", "slimeThrower"), false);
    w.time = w.nextAI - 0.01;
    updateAI(w, () => 0.99);
    assert.equal(w.units.length, 0);
    w.time = w.nextAI;
    updateAI(w, () => 0.99);
    assert.equal(w.units.length, 1);
    assert.equal(w.units[0].kind, kind);
    assert.equal(w.units[0].lane, 1);
    assert.ok(w.units[0].x > BATTLE.width + 200);
    assert.equal(w.remainingEnemies, 0);
    w.time += 100;
    updateAI(w, () => 0);
    assert.equal(w.units.length, 1);
    updateCombat(w, 0.01);
    assert.equal(w.result, null);
    damage(w, w.units[0], w.units[0].maxHp, 1);
    step(w, BATTLE.fixedStep);
    assert.equal(w.result, "player");
  }
});

test("boss size and stats follow its wave's army budget and continue increasing", () => {
  assert.equal(BOSS.scale, 3);
  let lastHp = 0,
    lastDamage = 0;
  for (const wave of [20, 40, 60, 100, 200]) {
    const bruiser = enemyStats("slimeArm", wave);
    const lobber = enemyStats("slimeThrower", wave);
    const armyHp =
      ((bruiser.hp * AI.weights.slimeArm +
        lobber.hp * AI.weights.slimeThrower) /
        (AI.weights.slimeArm + AI.weights.slimeThrower)) *
      waveDifficulty(wave).enemyCount;
    const kind = bossForWave(wave)!;
    const boss = enemyStats(kind, wave);
    assert.equal(
      boss.hp,
      Math.round(
        armyHp *
          BOSS.healthPerWaveArmy *
          (kind === "pyramid" ? PYRAMID.healthMultiplier : 1),
      ),
    );
    assert.ok(boss.hp > armyHp * 1.5);
    assert.ok(boss.damage > Math.max(bruiser.damage, lobber.damage));
    assert.equal(
      boss.damage,
      bruiser.damage *
        BOSS.attackMultiplier *
        (kind === "pyramid" ? PYRAMID.damageMultiplier : 1),
    );
    assert.ok(boss.hp > lastHp && boss.damage > lastDamage);
    const w = createWorld(
      { food: 100, health: 100, damage: 100 },
      undefined,
      undefined,
      wave,
    );
    spawn(w, "enemy", kind);
    assert.equal(w.units[0].maxHp, boss.hp);
    assert.equal(w.units[0].damage, boss.damage);
    lastHp = boss.hp;
    lastDamage = boss.damage;
  }
});

test("boss is enemy-only and victory advances to a normal wave with progress preserved", () => {
  const p = { ...initialProgress(), coins: 100000, waveNumber: 20 };
  assert.equal(Object.hasOwn(UNITS, "dreadmaw"), false);
  assert.equal(unlockUnit(p, "dreadmaw" as UnitKind), null);
  const w = createWorld(levels, undefined, undefined, 20);
  assert.equal(spawn(w, "player", "dreadmaw"), false);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "dreadmaw"] }),
    ),
  );
  const saved = decodeProgress(JSON.stringify(rewardBattle(p, true)));
  assert.equal(saved.waveNumber, 21);
  assert.equal(isBossWave(saved.waveNumber), false);
  assert.equal(rewardBattle(p, false).waveNumber, 20);
});

test("Dreadmaw claws hit only one nearby troop across all lanes", () => {
  const w = createWorld(levels, undefined, undefined, 20);
  w.nextAI = Infinity;
  spawn(w, "enemy", "dreadmaw");
  const boss = w.units[0];
  boss.x = 500;
  boss.cooldown = 0;
  for (let i = 0; i < 4; i++) {
    w.food = 15;
    assert.ok(spawn(w, "player", "clubman"));
    const troop = w.units.at(-1)!;
    troop.x = 415 - i * 2;
    troop.lane = i % 3;
    troop.hp = troop.maxHp = 1000;
    troop.cooldown = 10;
  }
  updateCombat(w, 0.01);
  assert.equal(
    w.units.filter((u) => u.side === "player" && u.hp < 1000).length,
    1,
  );
  assert.equal(w.projectiles.length, 0);
  boss.cooldown = 10;
  w.units[1].cooldown = 0;
  const hp = boss.hp;
  updateCombat(w, 0.01);
  assert.equal(boss.hp, hp - UNITS.clubman.damage);
});
