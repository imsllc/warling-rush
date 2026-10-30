import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, UNITS, UnitKind, isRanged } from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { updateCombat } from "../src/game/combat";
import {
  attackDistance,
  bodyFront,
  CONTACT_OVERLAP,
  meleeReach,
} from "../src/game/geometry";

test("every ranged player unit fires at 120% range from the visible enemy edge but not beyond", () => {
  for (const kind of Object.keys(UNITS) as UnitKind[]) {
    if (!isRanged(kind)) continue;
    const w = createWorld(
      { food: 0, health: 0, damage: 0 },
      [kind],
      [kind, null, null],
    );
    w.nextAI = Infinity;
    w.food = BATTLE.maxUnitFoodCost;
    assert.ok(spawn(w, "player", kind));
    assert.ok(spawn(w, "enemy", "slimeArm"));
    const [attacker, target] = w.units;
    attacker.x = 400;
    attacker.cooldown = 0;
    target.cooldown = 100;
    const range = UNITS[kind].range * 1.2 + bodyFront(target.kind);
    assert.equal(attackDistance(attacker, target), range, kind);
    target.x = attacker.x + range + 1;
    updateCombat(w, 0.001);
    assert.equal(w.projectiles.length, 0, `${kind}: fired outside new range`);
    target.x = attacker.x + range;
    updateCombat(w, 0.001);
    assert.ok(w.projectiles.length > 0, `${kind}: did not use extended range`);
    assert.ok(attacker.attack > 0);
    const boss = { ...target, kind: "dreadmaw" as const };
    assert.equal(
      attackDistance(attacker, boss),
      UNITS[kind].range * 1.2 + bodyFront(boss.kind),
    );
    attacker.side = "enemy";
    assert.equal(attackDistance(attacker, target), UNITS[kind].range);
  }
});

test("the screenshot's raccoon and swordsmen settle into separate firing and melee lines against the pyramid", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["raccoon", "gundam", "barbarian"],
    ["raccoon", "gundam", "barbarian"],
    100,
  );
  w.nextAI = Infinity;
  w.food = 100;
  for (const kind of ["raccoon", "gundam", "barbarian"] as const)
    assert.ok(spawn(w, "player", kind));
  assert.ok(spawn(w, "enemy", "pyramid"));
  const [raccoon, robot, barbarian, boss] = w.units;
  for (const troop of [raccoon, robot, barbarian]) {
    troop.x = 400;
    troop.hp = troop.maxHp = 1e9;
  }
  boss.x = 900;
  boss.hp = boss.maxHp = 1e9;
  boss.damage = 0;
  for (let tick = 0; tick < 900; tick++) updateCombat(w, BATTLE.fixedStep);
  assert.ok(
    robot.x - raccoon.x > 100,
    `raccoon stacked with robot: gap ${robot.x - raccoon.x}`,
  );
  assert.ok(
    barbarian.x - raccoon.x > 140,
    `raccoon stacked with barbarian: gap ${barbarian.x - raccoon.x}`,
  );
  assert.ok(boss.x - raccoon.x <= attackDistance(raccoon, boss) + 1e-7);
  assert.ok(boss.hp < 1e9, "separated units must keep attacking");
});

test("ranged support pulls back when its melee screen is engaged, but never retreats through the bunker", () => {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["raccoon", "gundam"],
    ["raccoon", "gundam", null],
    100,
  );
  w.food = 100;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", "raccoon"));
  assert.ok(spawn(w, "player", "gundam"));
  assert.ok(spawn(w, "enemy", "pyramid"));
  const [raccoon, robot, boss] = w.units;
  raccoon.x = 400;
  robot.x = 420;
  boss.x = 740;
  boss.cooldown = 100;
  updateCombat(w, 0.1);
  assert.ok(raccoon.x < 400, "support should leave the melee line");
  raccoon.x = BATTLE.playerBaseX + 25;
  robot.x = 200;
  boss.x = 500;
  updateCombat(w, 0.1);
  assert.equal(raccoon.x, BATTLE.playerBaseX + 25);
  // Without a surviving melee screen, a ranged unit stands its ground.
  robot.hp = 0;
  raccoon.x = 400;
  boss.x = 740;
  updateCombat(w, 0.1);
  assert.equal(raccoon.x, 400);
});

test("enemy ranged reach and melee contact stay at their original distances", () => {
  const w = createWorld({ food: 0, health: 0, damage: 0 });
  assert.ok(spawn(w, "player", "clubman"));
  assert.ok(spawn(w, "enemy", "slimeThrower"));
  const [troop, enemy] = w.units;
  assert.equal(attackDistance(enemy, troop), 185);
  assert.equal(
    attackDistance(troop, enemy),
    meleeReach(troop.kind) + bodyFront(enemy.kind) - CONTACT_OVERLAP,
  );
});
