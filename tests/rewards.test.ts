import assert from "node:assert/strict";
import test from "node:test";
import { damage, updateCombat } from "../src/game/combat";
import { createWorld } from "../src/game/engine";
import { enemyKillCoins } from "../src/game/rewards";
import { spawn } from "../src/game/units";
import { waveDifficulty } from "../src/game/waves";
import {
  collectKillCoins,
  decodeProgress,
  initialProgress,
  rewardBattle,
} from "../src/progress";

test("normal kill rewards rise slowly every five waves; bosses carry the army reward", () => {
  for (const [wave, expected] of [
    [1, 10],
    [5, 10],
    [6, 11],
    [10, 11],
    [11, 12],
    [51, 20],
  ]) {
    assert.equal(enemyKillCoins("slimeArm", wave), expected);
    assert.equal(enemyKillCoins("slimeThrower", wave), expected);
    assert.equal(enemyKillCoins("clubman", wave), 0);
  }
  assert.equal(
    enemyKillCoins("dreadmaw", 20),
    13 * waveDifficulty(20).enemyCount,
  );
  assert.throws(() => enemyKillCoins("slimeArm", 0));
});

test("only lethal enemy damage earns coins, once per enemy across repeated hits", () => {
  const w = createWorld(initialProgress().levels, undefined, undefined, 6);
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const target = w.units[0];
  damage(w, target, target.hp - 1, target.lane);
  assert.equal(w.coinsEarned, 0);
  damage(w, target, 1, target.lane);
  damage(w, target, 1000, target.lane);
  assert.equal(w.coinsEarned, 11);
  assert.equal(w.kills, 1);
  assert.ok(spawn(w, "enemy", "slimeThrower"));
  damage(w, w.units[1], 1e9, 0, true);
  assert.equal(w.coinsEarned, 22);
  assert.equal(w.kills, 2);
  w.food = 20;
  assert.ok(spawn(w, "player", "clubman"));
  damage(w, w.units[2], 1e9, 0);
  damage(w, "player", 1e9, 0);
  assert.equal(w.coinsEarned, 22);
});

test("melee kills and ranged projectile kills both award their enemy bounty", () => {
  for (const kind of ["clubman", "rock"] as const) {
    const w = createWorld(
      initialProgress().levels,
      ["clubman", "rock"],
      [kind, null, null],
    );
    w.food = 20;
    assert.ok(spawn(w, "player", kind));
    assert.ok(spawn(w, "enemy", "slimeArm"));
    const [player, enemy] = w.units;
    player.x = 500;
    player.cooldown = 0;
    enemy.x = 530;
    enemy.hp = 1;
    enemy.cooldown = 999;
    w.remainingEnemies = 0;
    for (let i = 0; i < 120 && !w.result; i++) updateCombat(w, 1 / 60);
    assert.equal(w.kills, 1, kind);
    assert.equal(w.coinsEarned, 10, kind);
    assert.equal(w.result, "player");
  }
});

test("boss death pays once even when several hits land together", () => {
  const w = createWorld(initialProgress().levels, undefined, undefined, 20);
  assert.ok(spawn(w, "enemy", "dreadmaw"));
  const boss = w.units[0];
  damage(w, boss, boss.hp, 1);
  damage(w, boss, boss.maxHp, 1);
  assert.equal(w.kills, 1);
  assert.equal(w.coinsEarned, enemyKillCoins("dreadmaw", 20));
});

test("finished waves pay at least 50 coins on victory or defeat, retaining higher kill rewards", () => {
  const start = { ...initialProgress(), coins: 62 };
  for (const won of [true, false]) {
    for (const earned of [0, 10, 33, 49, 50, 51, 120]) {
      const result = rewardBattle(start, won, earned);
      assert.equal(result.coins, 62 + Math.max(50, earned));
      assert.equal(result.waveNumber, won ? 2 : 1);
      assert.equal(result.battles, 1);
    }
    assert.equal(rewardBattle(start, won).coins, 112);
  }
});

test("cumulative saves, retries and final summaries never double credit kills", () => {
  const start = { ...initialProgress(), coins: 62 };
  const firstKill = collectKillCoins(start, 11);
  assert.equal(firstKill.coins, 73);
  const leave = collectKillCoins(start, 33);
  assert.equal(leave.coins, 95);
  assert.equal(leave.battles, 0);
  assert.equal(leave.waveNumber, 1);
  assert.deepEqual(collectKillCoins(start, 33), leave);
  assert.deepEqual(decodeProgress(JSON.stringify(leave)), leave);
  const final = rewardBattle(start, false, 33);
  assert.equal(final.coins, 112);
  assert.deepEqual(rewardBattle(start, false, 33), final);
  for (const invalid of [-1, NaN, Infinity, 1.5])
    assert.throws(() => collectKillCoins(start, invalid));
  for (const invalid of [-1, NaN, Infinity, 1.5])
    assert.throws(() => rewardBattle(start, false, invalid));
  assert.equal(
    rewardBattle({ ...start, coins: Number.MAX_SAFE_INTEGER - 10 }, false).coins,
    Number.MAX_SAFE_INTEGER,
  );
});

