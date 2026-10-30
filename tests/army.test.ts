import { test } from "node:test";
import assert from "node:assert/strict";
import { addToArmy, ArmySlots } from "../src/army";
import {
  decodeProgress,
  equipUnit,
  initialProgress,
  removeFromArmy,
  unlockUnit,
} from "../src/progress";
import {
  UNITS,
  UnitKind,
  foodRateLabel,
  upgradeCost,
} from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("phone games start on wave one with only the first three units equipped and base upgrades", () => {
  const p = initialProgress();
  assert.deepEqual(p.unlockedUnits, ["clubman", "spearman", "rock"]);
  assert.deepEqual(p.army, p.unlockedUnits);
  assert.deepEqual(p.levels, { food: 0, health: 0, damage: 0 });
  assert.equal(p.waveNumber, 1);
  assert.equal(p.coins, 0);
  assert.equal(p.battles, 0);
  assert.equal(p.wins, 0);
  assert.equal(foodRateLabel(p.levels.food), "0.50/s");
  assert.equal(upgradeCost("food", p.levels.food), 60);
  assert.deepEqual(decodeProgress(JSON.stringify(p)), p);
  const w = createWorld(p.levels, p.unlockedUnits, p.army, p.waveNumber);
  w.food = 100;
  for (const kind of p.unlockedUnits) assert.ok(spawn(w, "player", kind));
  assert.equal(spawn(w, "player", "stormblade"), false);
});

test("army fills the first empty slot and replaces the far left when full", () => {
  const army: ArmySlots<string> = ["first", "second", "third"];
  assert.deepEqual(addToArmy(army, "fourth"), ["second", "third", "fourth"]);
  assert.deepEqual(army, ["first", "second", "third"]);
  assert.deepEqual(addToArmy(["first", null, "third"], "fourth"), [
    "first",
    "fourth",
    "third",
  ]);
  assert.deepEqual(addToArmy([null, "second", null], "fourth"), [
    "fourth",
    "second",
    null,
  ]);
  assert.deepEqual(addToArmy(army, "second"), army);
});

test("unlocking and equipping are separate; removed units remain owned", () => {
  const start = {
    ...initialProgress(),
    unlockedUnits: ["clubman"] as UnitKind[],
    army: ["clubman", null, null] as ArmySlots,
  };
  assert.deepEqual(start.army, ["clubman", null, null]);
  assert.equal(equipUnit(start, "rock"), null);
  const unlocked = unlockUnit({ ...start, coins: 500 }, "spearman")!;
  assert.deepEqual(unlocked.army, start.army);
  const equipped = equipUnit(unlocked, "spearman")!;
  assert.deepEqual(equipped.army, ["clubman", "spearman", null]);
  assert.equal(equipped.coins, unlocked.coins);
  assert.equal(equipUnit(equipped, "spearman"), null);
  const removed = removeFromArmy(equipped, 0)!;
  assert.deepEqual(removed.army, [null, "spearman", null]);
  assert.deepEqual(removed.unlockedUnits, equipped.unlockedUnits);
  assert.deepEqual(equipUnit(removed, "clubman")!.army, equipped.army);
  assert.equal(removeFromArmy(removed, 0), null);
  assert.equal(removeFromArmy(removed, -1), null);
  assert.equal(removeFromArmy(removed, 3), null);
  assert.equal(removeFromArmy(removed, 0.5), null);
});

test("army gaps, order and empty armies survive saving", () => {
  const p = {
    ...initialProgress(),
    army: [null, "clubman", null] as ArmySlots,
  };
  assert.deepEqual(decodeProgress(JSON.stringify(p)), p);
  const empty = removeFromArmy(p, 1)!;
  assert.deepEqual(decodeProgress(JSON.stringify(empty)).army, [
    null,
    null,
    null,
  ]);
});

test("old saves equip their owned units and preserve coins and bonuses", () => {
  const { army, ...legacy } = initialProgress();
  const saved = {
    ...legacy,
    coins: 321,
    levels: { food: 2, damage: 3, health: 4 },
    unlockedUnits: ["clubman", "rock", "spearman"],
  };
  const migrated = decodeProgress(JSON.stringify(saved));
  assert.deepEqual(migrated.army, ["clubman", "rock", "spearman"]);
  assert.deepEqual(migrated.levels, saved.levels);
  assert.equal(migrated.coins, 321);
});

test("saved armies reject duplicates, locked units and invalid slots", () => {
  for (const army of [
    ["clubman", "clubman", null],
    ["mech", null, null],
    ["clubman"],
    [null, null, null, null],
    ["unknown", null, null],
    "clubman",
  ]) {
    assert.throws(() =>
      decodeProgress(JSON.stringify({ ...initialProgress(), army })),
    );
  }
});

test("battle deployment requires both ownership and an equipped slot", () => {
  const p = initialProgress();
  const army: ArmySlots = [null, "spearman", null];
  const w = createWorld(p.levels, ["clubman", "spearman", "rock"], army);
  w.food = 15;
  assert.equal(spawn(w, "player", "clubman"), false);
  assert.equal(spawn(w, "player", "rock"), false);
  assert.equal(spawn(w, "player", "spearman"), true);
  assert.equal(w.food, 13);
  assert.deepEqual(w.army, army);
  w.army[1] = null;
  assert.deepEqual(army, [null, "spearman", null]);
  const locked = createWorld(p.levels, ["clubman"], ["rock", null, null]);
  locked.food = 15;
  assert.equal(spawn(locked, "player", "rock"), false);
  locked.remainingEnemies = 0;
  assert.equal(spawn(locked, "enemy", "slimeThrower"), false);
  locked.remainingEnemies = 15;
  assert.equal(spawn(locked, "enemy", "slimeThrower"), true);
});
