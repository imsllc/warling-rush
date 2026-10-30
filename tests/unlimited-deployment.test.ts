import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, UNITS } from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { spawn } from "../src/game/units";

test("melee and ranged troops can deploy repeatedly into a crowded base beyond 36 units", () => {
  for (const kind of ["clubman", "rock"] as const) {
    const w = createWorld(
      { food: 0, health: 0, damage: 0 },
      [kind],
      [kind, null, null],
    );
    const cost = UNITS[kind].cost;
    w.food = cost * 120;
    for (let i = 0; i < 120; i++) {
      assert.ok(
        spawn(w, "player", kind),
        `${kind}: deployment ${i + 1} blocked`,
      );
      assert.equal(w.food, cost * (119 - i));
      assert.equal(w.units.length, i + 1);
    }
    assert.ok(w.units.every((unit) => unit.x === BATTLE.playerBaseX + 25));
    assert.deepEqual(
      [0, 1, 2].map(
        (lane) => w.units.filter((unit) => unit.lane === lane).length,
      ),
      [40, 40, 40],
    );
    assert.equal(new Set(w.units.map((unit) => unit.id)).size, 120);
    assert.equal(spawn(w, "player", kind), false, "food is still required");
    assert.equal(w.units.length, 120);
    w.food = cost;
    assert.ok(spawn(w, "player", kind));
    assert.equal(w.units.length, 121);
    w.result = "enemy";
    w.food = cost;
    assert.equal(
      spawn(w, "player", kind),
      false,
      "finished battles stay closed",
    );
  }
});
