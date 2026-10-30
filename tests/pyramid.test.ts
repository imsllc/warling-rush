import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, PYRAMID, UNITS, UnitKind } from "../src/game/config";
import { createWorld } from "../src/game/engine";
import { updateAI } from "../src/game/ai";
import { damage, updateCombat } from "../src/game/combat";
import { spawn } from "../src/game/units";
import { bossForWave, enemyStats } from "../src/game/waves";
import {
  initialProgress,
  decodeProgress,
  unlockUnit,
  rewardBattle,
} from "../src/progress";

const levels = { food: 0, health: 0, damage: 0 };
const encounter = () => {
  const w = createWorld(levels, undefined, undefined, 100);
  w.nextAI = Infinity;
  spawn(w, "enemy", "pyramid");
  w.units[0].x = 700;
  w.units[0].cooldown = 0;
  return w;
};

test("wave 100 schedules one enemy-only pyramid with a major bonus over same-wave bosses", () => {
  assert.equal(bossForWave(100), "pyramid");
  assert.equal(bossForWave(200), "pyramid");
  assert.equal(bossForWave(120), "dreadmaw");
  const normal = enemyStats("dreadmaw", 100);
  const pyramid = enemyStats("pyramid", 100);
  assert.ok(Math.abs(pyramid.hp - normal.hp * PYRAMID.healthMultiplier) <= 2);
  assert.equal(pyramid.damage, normal.damage * PYRAMID.damageMultiplier);
  assert.ok(pyramid.hp > normal.hp * 2.4);
  assert.ok(pyramid.damage >= normal.damage * 2);
  const w = createWorld(levels, undefined, undefined, 100);
  assert.equal(Object.hasOwn(UNITS, "pyramid"), false);
  assert.equal(spawn(w, "player", "pyramid"), false);
  const p = { ...initialProgress(), waveNumber: 100, coins: 100000 };
  assert.equal(unlockUnit(p, "pyramid" as UnitKind), null);
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...p, unlockedUnits: ["clubman", "pyramid"] }),
    ),
  );
  w.time = w.nextAI;
  updateAI(w, () => 0.5);
  assert.equal(w.units[0].kind, "pyramid");
  assert.equal(w.remainingEnemies, 0);
  assert.equal(w.units[0].maxHp, pyramid.hp);
  assert.equal(w.units[0].damage, pyramid.damage);
  assert.equal(
    decodeProgress(JSON.stringify(rewardBattle(p, true))).waveNumber,
    101,
  );
});

test("eye beam telegraphs, holds position, pierces up to five targets once, and expires", () => {
  const w = encounter();
  const pyramid = w.units[0];
  for (const x of [550, 530, 510, 490, 470, 450, 200]) {
    w.food = 15;
    assert.ok(spawn(w, "player", "clubman"));
    const troop = w.units.at(-1)!;
    troop.x = x;
    troop.hp = troop.maxHp = 10000;
    troop.cooldown = 100;
  }
  updateCombat(w, 0.01);
  assert.equal(w.beams.length, 1);
  assert.equal(w.beams[0].fired, false);
  assert.equal(w.projectiles.length, 0);
  updateCombat(w, PYRAMID.chargeTime - 0.02);
  assert.ok(w.units.slice(1).every((u) => u.hp === 10000));
  assert.equal(pyramid.x, 700);
  updateCombat(w, 0.02);
  assert.equal(w.beams[0].fired, true);
  assert.equal(
    w.units.filter((u) => u.side === "player" && u.hp < 10000).length,
    5,
  );
  assert.equal(w.units[1].hp, 10000 - pyramid.damage);
  assert.equal(w.units.at(-1)!.hp, 10000);
  const health = w.units.map((u) => u.hp);
  updateCombat(w, 0.1);
  assert.deepEqual(
    w.units.map((u) => u.hp),
    health,
  );
  updateCombat(w, 0.4);
  assert.equal(w.beams.length, 0);
});

test("beam can damage the bunker after charging, and killing its source cancels it", () => {
  for (const kill of [false, true]) {
    const w = encounter();
    const pyramid = w.units[0];
    pyramid.x = 300;
    updateCombat(w, 0.01);
    assert.equal(w.beams[0].targetBase, true);
    assert.equal(w.bases.player, BATTLE.baseHp);
    if (kill) damage(w, pyramid, pyramid.hp, 1);
    updateCombat(w, PYRAMID.chargeTime);
    assert.equal(
      w.bases.player,
      kill ? BATTLE.baseHp : Math.max(0, BATTLE.baseHp - pyramid.damage),
    );
    if (kill) {
      assert.equal(w.beams.length, 0);
      assert.equal(w.result, "player");
    }
  }
});
