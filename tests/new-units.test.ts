import { test } from "node:test";
import assert from "node:assert/strict";
import { UNITS, UnitKind, BATTLE } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { updateAI } from "../src/game/ai";
import {
  initialProgress,
  unlockUnit,
  equipUnit,
  decodeProgress,
  removeFromArmy,
} from "../src/progress";
import { ArmySlots } from "../src/army";

const newUnits: UnitKind[] = [
  "stormblade",
  "mech",
  "machineGunner",
  "basketballPlayer",
  "cannon",
  "shark",
  "tiger",
  "cyborgWalrus",
  "mafia",
  "rapper",
  "barbarian",
  "spaceMarine",
  "duck",
  "mig17",
  "gundam",
  "skeletonKing",
  "darkMage",
  "raccoon",
];
const allUnits = Object.keys(UNITS) as UnitKind[];
const advance = (w: ReturnType<typeof createWorld>, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) step(w, 1 / 60, () => 0.1);
};

test("advanced additions start locked with increasing unlock prices and food budgets", () => {
  const p = initialProgress();
  let previous = { cost: UNITS.rock.cost, unlockCost: UNITS.rock.unlockCost };
  for (const kind of newUnits) {
    const stats = UNITS[kind];
    assert.ok(!p.unlockedUnits.includes(kind));
    assert.equal(unlockUnit(p, kind), null);
    for (const key of ["cost", "unlockCost"] as const)
      assert.ok(stats[key] > previous[key], `${kind} ${key}`);
    assert.ok(stats.cost <= BATTLE.maxUnitFoodCost);
    previous = stats;
    const w = createWorld(p.levels, p.unlockedUnits);
    w.food = BATTLE.maxUnitFoodCost;
    assert.equal(spawn(w, "player", kind), false);
    assert.equal(w.food, BATTLE.maxUnitFoodCost);
  }
});

test("new units purchase, equip, deploy with their stats, and survive saving", () => {
  for (const kind of newUnits) {
    const start = { ...initialProgress(), coins: UNITS[kind].unlockCost + 100 };
    const bought = unlockUnit(start, kind)!;
    assert.equal(bought.coins, 100);
    assert.equal(unlockUnit(bought, kind), null);
    const saved = decodeProgress(JSON.stringify(equipUnit(bought, kind)!));
    const w = createWorld(saved.levels, saved.unlockedUnits, saved.army);
    w.food = UNITS[kind].cost - 1;
    assert.equal(spawn(w, "player", kind), false);
    w.food++;
    assert.equal(spawn(w, "player", kind), true);
    assert.equal(w.food, 0);
    assert.equal(w.units[0].hp, UNITS[kind].hp);
    assert.equal(w.units[0].damage, UNITS[kind].damage);
  }
});

test("melee troops can pass ranged support at the cave exit", () => {
  for (const kind of [
    "rock",
    "mech",
    "machineGunner",
    "basketballPlayer",
    "cannon",
    "tiger",
    "mafia",
    "rapper",
    "spaceMarine",
  ] as const) {
    const w = createWorld(initialProgress().levels, allUnits, [
      kind,
      "barbarian",
      null,
    ]);
    w.food = BATTLE.maxUnitFoodCost;
    for (let i = 0; i < 3; i++) {
      w.food = BATTLE.maxUnitFoodCost;
      assert.ok(spawn(w, "player", kind));
    }
    w.food = BATTLE.maxUnitFoodCost;
    assert.ok(spawn(w, "player", "barbarian"));
    assert.equal(w.units.length, 4);
  }
});

test("wave slime types are independent of player unlocks", () => {
  const p = initialProgress();
  for (const [owned, expected] of [
    [p.unlockedUnits, "slimeThrower"],
    [allUnits, "slimeThrower"],
  ] as const) {
    const w = createWorld(p.levels, [...owned], undefined, 3);
    w.time = 6;
    w.remainingEnemies = 15;
    updateAI(w, () => 0.9999);
    assert.equal(w.units[0].kind, expected);
  }
});

test("mech fires from both pods and applies exactly one attack budget on impact", () => {
  for (const side of ["player"] as const) {
    const w = createWorld(initialProgress().levels, allUnits, [
      "mech",
      "clubman",
      null,
    ]);
    w.food = w.remainingEnemies = 15;
    w.nextAI = Infinity;
    assert.ok(spawn(w, side, "mech"));
    const unit = w.units[0];
    unit.x = side === "player" ? 700 : 300;
    unit.lane = 2;
    const targetSide = side === "player" ? "enemy" : "player";
    w.food = w.remainingEnemies = 15;
    assert.ok(spawn(w, targetSide, "slimeArm"));
    const target = w.units[1];
    target.x = side === "player" ? 850 : 150;
    target.hp = target.maxHp = 1000;
    advance(w, 0.2);
    assert.equal(w.projectiles.length, 2);
    assert.ok(
      w.projectiles.every(
        (p) =>
          p.kind === "missile" && p.launchLane === 2 && p.target === target.id,
      ),
    );
    assert.deepEqual(
      w.projectiles.map((p) => p.startX).sort((a, b) => a - b),
      [unit.x - 17, unit.x + 17],
    );
    assert.equal(target.hp, 1000);
    assert.equal(
      w.projectiles.reduce((sum, p) => sum + p.damage, 0),
      unit.damage,
    );
    advance(w, 0.8);
    assert.equal(target.hp, 1000 - unit.damage);
    assert.equal(w.projectiles.length, 0);
  }
});

test("equipping a newly owned fourth unit replaces the far left and fills gaps first", () => {
  const p = {
    ...initialProgress(),
    unlockedUnits: allUnits,
    army: ["clubman", "spearman", "rock"] as ArmySlots,
  };
  const replaced = equipUnit(p, "gundam")!;
  assert.deepEqual(replaced.army, ["spearman", "rock", "gundam"]);
  assert.ok(replaced.unlockedUnits.includes("clubman"));
  const gap = removeFromArmy(replaced, 1)!;
  const filled = equipUnit(gap, "barbarian")!;
  assert.deepEqual(filled.army, ["spearman", "barbarian", "gundam"]);
  assert.deepEqual(decodeProgress(JSON.stringify(filled)).army, filled.army);
});
