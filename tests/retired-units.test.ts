import test from "node:test";
import assert from "node:assert/strict";
import { UNITS, UnitKind } from "../src/game/config";
import { decodeProgress, initialProgress, unlockUnit } from "../src/progress";
import { MAX_UNIT_FOOD } from "../src/game/balance";

test("active units fill consecutive food tiers after the retired-unit gap", () => {
  const units = Object.values(UNITS);
  assert.deepEqual(
    units.map((unit) => unit.cost),
    Array.from({ length: units.length }, (_, index) => index + 1),
  );
  assert.equal(UNITS.stormblade.cost, 4);
  assert.equal(UNITS.mech.cost, 5);
  assert.equal(UNITS.darkMage.cost, 20);
  assert.equal(MAX_UNIT_FOOD, units.length);
});

const retired = [
  "axeman",
  "axeThrower",
  "spearThrower",
  "puncher",
  "swordsman",
];
test("the five pictured units are absent from the roster and starter unlocks", () => {
  const p = { ...initialProgress(), coins: 99999 };
  for (const kind of retired) {
    assert.equal(Object.hasOwn(UNITS, kind), false);
    assert.equal(p.unlockedUnits.includes(kind as UnitKind), false);
    assert.equal(unlockUnit(p, kind as UnitKind), null);
  }
  for (const kind of ["spearman", "barbarian", "gundam"] as const)
    assert.ok(Object.hasOwn(UNITS, kind));
});

test("legacy saves discard only retired unlocks and army slots, preserving all other progress", () => {
  const legacy = {
    ...initialProgress(),
    coins: 1234,
    waveNumber: 31,
    battles: 45,
    wins: 30,
    levels: { food: 3, health: 2, damage: 4 },
    unlockedUnits: ["clubman", ...retired, "spearman", "barbarian", "gundam"],
    army: ["swordsman", "barbarian", "puncher"],
  };
  const migrated = decodeProgress(JSON.stringify(legacy));
  assert.deepEqual(migrated, {
    ...legacy,
    unlockedUnits: ["clubman", "spearman", "barbarian", "gundam"],
    army: [null, "barbarian", null],
  });
  assert.deepEqual(decodeProgress(JSON.stringify(migrated)), migrated);
});

test("a retired-only equipped army falls back to Clubman, but intentional empty armies stay empty", () => {
  const legacy = {
    ...initialProgress(),
    unlockedUnits: ["clubman", ...retired],
    army: ["axeman", "axeThrower", "spearThrower"],
  };
  assert.deepEqual(decodeProgress(JSON.stringify(legacy)).army, [
    "clubman",
    null,
    null,
  ]);
  assert.deepEqual(
    decodeProgress(JSON.stringify({ ...legacy, army: [null, null, null] }))
      .army,
    [null, null, null],
  );
});

test("retirement migration still rejects unknown, duplicate and unowned save entries", () => {
  const base = { ...initialProgress(), unlockedUnits: ["clubman", ...retired] };
  for (const invalid of [
    { ...base, unlockedUnits: [...base.unlockedUnits, "fake-unit"] },
    { ...base, unlockedUnits: [...base.unlockedUnits, "axeman"] },
    { ...base, army: ["puncher", "puncher", null] },
    { ...base, army: ["gundam", null, null] },
  ])
    assert.throws(() => decodeProgress(JSON.stringify(invalid)));
});
