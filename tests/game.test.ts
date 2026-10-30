import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import {
  AI,
  BATTLE,
  UNITS,
  COMBAT_UNITS,
  UPGRADES,
  foodRate,
  foodRateLabel,
  UnitKind,
  upgradeCost,
} from "../src/game/config";
import { damage } from "../src/game/combat";
import { waveDifficulty } from "../src/game/waves";
import {
  decodeProgress,
  initialProgress,
  purchase,
  rewardBattle,
  unlockUnit,
} from "../src/progress";
const fresh = () =>
  createWorld({ food: 0, health: 0, damage: 0 }, [
    "clubman",
    "spearman",
    "rock",
  ]);
const advance = (world: ReturnType<typeof fresh>, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 60); i++)
    step(world, 1 / 60, () => 0.25);
};
test("food, affordability, spawning, and permanent stat bonuses", () => {
  const w = fresh();
  assert.equal(spawn(w, "player", "rock"), false);
  assert.equal(spawn(w, "player", "clubman"), true);
  assert.equal(w.food, 1);
  advance(w, 1);
  assert.equal(w.food, 1);
  advance(w, 1);
  assert.equal(w.food, 2);
  w.food = BATTLE.maxUnitFoodCost;
  w.levels = { food: 2, health: 2, damage: 3 };
  assert.ok(spawn(w, "player", "spearman"));
  assert.equal(w.units[1].hp, UNITS.spearman.hp * 1.2);
  assert.equal(w.units[1].damage, UNITS.spearman.damage * 1.3);
});
test("wave enemies wait, spend the finite budget, and use the same stats", () => {
  const w = fresh();
  advance(w, 4);
  assert.equal(w.units.length, 0);
  advance(w, 2);
  const enemy = w.units.find((u) => u.side === "enemy")!;
  assert.ok(enemy);
  assert.equal(enemy.maxHp, COMBAT_UNITS[enemy.kind].hp);
  assert.equal(w.remainingEnemies, waveDifficulty(1).enemyCount - 1);
});
test("melee can deploy past ranged troops holding the base exit", () => {
  const w = fresh();
  w.food = BATTLE.maxUnitFoodCost;
  for (let i = 0; i < 3; i++) assert.ok(spawn(w, "player", "rock"));
  for (let i = 0; i < 3; i++) assert.ok(spawn(w, "player", "clubman"));
  assert.equal(w.food, BATTLE.maxUnitFoodCost - 12);
  assert.equal(w.units.length, 6);
});
test("wave choices include melee and ranged enemies", () => {
  for (const [roll, kind] of [
    [0.1, "slimeArm"],
    [0.95, "slimeThrower"],
  ] as const) {
    const w = fresh();
    w.battleNumber = 2;
    for (let i = 0; i < 8 * 60; i++) step(w, 1 / 60, () => roll);
    assert.ok(w.units.some((u) => u.side === "enemy" && u.kind === kind));
    assert.ok(w.remainingEnemies >= 0);
  }
});
test("melee attacks the nearest blocking enemy", () => {
  const w = fresh();
  w.food = w.remainingEnemies = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  spawn(w, "player", "clubman");
  spawn(w, "enemy", "slimeArm");
  spawn(w, "enemy", "slimeArm");
  w.units[0].x = 400;
  w.units[1].x = 450;
  w.units[2].x = 425;
  advance(w, 0.2);
  assert.equal(w.units[1].hp, 100);
  assert.equal(w.units[2].hp, COMBAT_UNITS.slimeArm.hp - UNITS.clubman.damage);
});
test("melee cooldowns, damage effects, and death cleanup", () => {
  const w = fresh();
  w.food = w.remainingEnemies = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  spawn(w, "player", "clubman");
  spawn(w, "enemy", "slimeArm");
  w.units[0].x = 490;
  w.units[1].x = 510;
  advance(w, 0.2);
  assert.equal(w.units[1].hp, 85);
  assert.ok(w.effects.length);
  advance(w, 0.3);
  assert.equal(w.units[1].hp, 85);
  damage(w, w.units[1], 1000, 0);
  advance(w, 0.5);
  assert.equal(w.units.filter((u) => u.side === "enemy").length, 0);
});
test("ranged attacks travel before dealing damage; formations maintain spacing", () => {
  const w = fresh();
  w.food = w.remainingEnemies = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  spawn(w, "player", "rock");
  spawn(w, "enemy", "slimeArm");
  w.units[0].x = 400;
  w.units[1].x = 570;
  advance(w, 0.2);
  assert.ok(w.projectiles.length);
  assert.equal(w.units[1].hp, 100);
  advance(w, 0.5);
  assert.ok(w.units[1].hp < 100);
  const troop = { ...w.units[0], id: 999, x: w.units[0].x - 25 };
  w.units.push(troop);
  advance(w, 2);
  assert.ok(w.units[0].x - troop.x >= BATTLE.spacing - 0.01);
});
test("defeat ends the simulation; doing nothing loses", () => {
  const w = fresh();
  advance(w, 300);
  assert.equal(w.result, "enemy");
  assert.equal(w.bases.player, 0);
  const time = w.time;
  advance(w, 1);
  assert.equal(w.time, time);
});
test("mixed starter army clears the first finite wave within three minutes", () => {
  for (let seed = 1; seed <= 6; seed++) {
    const w = fresh();
    let next = 0,
      state = seed;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const order: UnitKind[] = ["clubman", "spearman", "rock"];
    for (let i = 0; i < 60 * 240 && !w.result; i++) {
      if (i % 30 === 0 && spawn(w, "player", order[next % order.length]))
        next++;
      step(w, 1 / 60, random);
    }
    assert.equal(w.result, "player", `Seed ${seed}`);
    assert.ok(
      w.time >= AI.firstSpawnDelay && w.time <= 180,
      `Wave lasted ${w.time}s`,
    );
    assert.equal(w.remainingEnemies, 0);
    assert.ok(!w.units.some((u) => u.side === "enemy" && u.hp > 0));
  }
});
test("victory and defeat retain kill coins and record results", () => {
  const victory = rewardBattle(initialProgress(), true, 120);
  assert.equal(victory.coins, 120);
  assert.equal(victory.wins, 1);
  assert.equal(victory.battles, 1);
  const defeat = rewardBattle(victory, false, 30);
  assert.equal(defeat.coins, 170);
  assert.equal(defeat.wins, 1);
  assert.equal(defeat.battles, 2);
  assert.deepEqual(decodeProgress(JSON.stringify(defeat)), defeat);
});
test("coin purchases scale prices and progress survives serialization", () => {
  const p = { ...initialProgress(), coins: 250 };
  const next = purchase(p, "food")!;
  assert.equal(next.coins, 190);
  assert.equal(next.levels.food, 1);
  assert.ok(upgradeCost("food", 1) > upgradeCost("food", 0));
  assert.deepEqual(decodeProgress(JSON.stringify(next)), next);
  assert.equal(purchase(initialProgress(), "damage"), null);
  assert.throws(() => decodeProgress("{bad json"));
  assert.throws(() => decodeProgress(JSON.stringify({ ...p, coins: -1 })));
  assert.deepEqual(decodeProgress(null), initialProgress());
});

test("whole food keeps accumulating without a cap for cheap, expensive and empty armies", () => {
  for (const army of [
    ["clubman", null, null],
    ["darkMage", null, null],
    [null, null, null],
  ] as const) {
    const w = createWorld(
      { food: 1, health: 0, damage: 0 },
      ["clubman", "darkMage"],
      [...army],
    );
    w.nextAI = Infinity;
    for (let i = 0; i < 20 * 60; i++) {
      step(w, 1 / 60, () => 0.25);
      assert.ok(Number.isInteger(w.food));
    }
    assert.equal(w.food, 12);
    advance(w, 10);
    assert.equal(w.food, 17);
    w.food = 10000;
    advance(w, 2);
    assert.equal(w.food, 10001);
    if (army[0]) {
      assert.ok(spawn(w, "player", army[0]));
      assert.equal(w.food, 10001 - UNITS[army[0]].cost);
    }
  }
  assert.equal(foodRateLabel(0), "0.50/s");
  assert.equal(foodRateLabel(1), "0.52/s");
  assert.equal(foodRateLabel(25), "1.00/s");
  assert.equal(UPGRADES.food.bonus, 0.02);
});

test("food purchases add exactly 0.02/s, persist, and increase actual battle income", () => {
  let p = { ...initialProgress(), coins: 100000 };
  for (let level = 0; level < 10; level++) {
    const cost = upgradeCost("food", level);
    const next = purchase(p, "food")!;
    assert.equal(next.coins, p.coins - cost);
    assert.equal(
      Math.round((foodRate(next.levels.food) - foodRate(p.levels.food)) * 100),
      2,
    );
    p = decodeProgress(JSON.stringify(next));
    const w = createWorld(p.levels, p.unlockedUnits, p.army);
    w.nextAI = Infinity;
    w.food = 0;
    let earned = 0;
    for (let second = 0; second < 50; second++) {
      advance(w, 1);
      earned += w.food;
      w.food = 0;
    }
    assert.equal(earned, 25 + level + 1);
  }
  assert.equal(
    purchase({ ...p, coins: upgradeCost("food", p.levels.food) - 1 }, "food"),
    null,
  );
  assert.equal(
    purchase({ ...p, levels: { ...p.levels, food: 100 } }, "food"),
    null,
  );
});

test("food prices grow with a power curve rather than linear or exponential growth", () => {
  for (let level = 1; level < 100; level++) {
    assert.ok(upgradeCost("food", level) > upgradeCost("food", level - 1));
  }
  const earlyIncrease = upgradeCost("food", 10) - upgradeCost("food", 0);
  const lateIncrease = upgradeCost("food", 20) - upgradeCost("food", 10);
  assert.ok(lateIncrease > earlyIncrease);
  const earlyRatio = upgradeCost("food", 10) / upgradeCost("food", 0);
  const lateRatio = upgradeCost("food", 20) / upgradeCost("food", 10);
  assert.ok(lateRatio < earlyRatio);
  assert.equal(upgradeCost("food", 99), Math.ceil(60 * 100 ** 1.35));
});

test("legacy single-unit saves can still purchase and deploy another unit", () => {
  const p = {
    ...initialProgress(),
    unlockedUnits: ["clubman"] as UnitKind[],
    army: ["clubman", null, null] as [UnitKind, null, null],
  };
  const w = createWorld(p.levels, p.unlockedUnits);
  w.food = BATTLE.maxUnitFoodCost;
  assert.deepEqual(p.unlockedUnits, ["clubman"]);
  assert.equal(spawn(w, "player", "spearman"), false);
  assert.equal(w.food, BATTLE.maxUnitFoodCost);
  assert.equal(unlockUnit(p, "spearman"), null);
  const purchased = unlockUnit({ ...p, coins: 300 }, "spearman")!;
  assert.equal(purchased.coins, 200);
  assert.equal(unlockUnit(purchased, "spearman"), null);
  const saved = decodeProgress(JSON.stringify(purchased));
  assert.deepEqual(saved.unlockedUnits, ["clubman", "spearman"]);
  assert.equal(
    spawn(createWorld(saved.levels, saved.unlockedUnits), "player", "spearman"),
    true,
  );
  const { unlockedUnits, ...legacy } = p;
  assert.deepEqual(decodeProgress(JSON.stringify(legacy)).unlockedUnits, [
    "clubman",
  ]);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "unknown"] }),
    ),
  );
});
