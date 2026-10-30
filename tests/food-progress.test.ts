import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, foodRate, UNITS } from "../src/game/config";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import {
  availableFoodProgress,
  foodFillFraction,
  foodProductionProgress,
} from "../src/ui/foodProgress";

test("the meat icon fills over exactly one food interval and resets on payout", () => {
  for (const level of [0, 1, 25, 100]) {
    const w = createWorld({ food: level, health: 0, damage: 0 });
    w.nextAI = Infinity;
    w.food = 0;
    const interval = 1 / foodRate(level);
    assert.equal(foodProductionProgress(w), 0);
    step(w, interval / 2);
    assert.equal(w.food, 0);
    assert.ok(Math.abs(foodProductionProgress(w) - 0.5) < 1e-9);
    step(w, interval / 2);
    assert.equal(w.food, 1);
    assert.ok(foodProductionProgress(w) < 1e-9);
  }
});

test("the visual food budget stays continuous across fixed-step food payouts", () => {
  for (const level of [0, 1, 25, 99]) {
    const w = createWorld({ food: level, health: 0, damage: 0 });
    w.nextAI = Infinity;
    for (let frame = 0; frame < 600; frame++) {
      const before = availableFoodProgress(w);
      step(w, BATTLE.fixedStep);
      const fraction = foodProductionProgress(w);
      assert.ok(fraction >= 0 && fraction < 1);
      assert.ok(
        Math.abs(
          availableFoodProgress(w) -
            before -
            foodRate(level) * BATTLE.fixedStep,
        ) < 1e-8,
      );
    }
  }
});

test("deployment fill uses each unit's cost and clamps when affordable", () => {
  for (const unit of Object.values(UNITS)) {
    assert.equal(foodFillFraction(0, unit.cost), 0);
    assert.equal(foodFillFraction(unit.cost / 2, unit.cost), 0.5);
    assert.equal(foodFillFraction(unit.cost, unit.cost), 1);
    assert.equal(foodFillFraction(unit.cost + 100, unit.cost), 1);
  }
  assert.equal(foodFillFraction(-1, 4), 0);
  assert.equal(foodFillFraction(2.5, 4), 0.625);
  assert.equal(foodFillFraction(2.5, 10), 0.25);
});

test("spending food lowers card fills without resetting food production or unlocking early", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["stormblade"],
    ["stormblade", null, null],
  );
  w.nextAI = Infinity;
  w.food = 3;
  w.time = 1.99;
  assert.ok(foodFillFraction(availableFoodProgress(w), 4) < 1);
  assert.equal(spawn(w, "player", "stormblade"), false);
  step(w, 0.01);
  assert.equal(foodFillFraction(availableFoodProgress(w), 4), 1);
  assert.ok(spawn(w, "player", "stormblade"));
  assert.equal(foodFillFraction(availableFoodProgress(w), 4), 0);
  w.food = 10;
  w.time = 2.5;
  w.units[0].x = 600;
  const phase = foodProductionProgress(w);
  const available = availableFoodProgress(w);
  assert.ok(spawn(w, "player", "stormblade"));
  assert.equal(foodProductionProgress(w), phase);
  assert.equal(availableFoodProgress(w), available - 4);
});
