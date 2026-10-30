import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, COMBAT_UNITS, UNITS, UnitKind } from "../src/game/config";
import { hasUpswing, UPSWING } from "../src/game/meleeTiming";
import { createWorld } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { updateCombat } from "../src/game/combat";
import { bodyFront, meleeReach, CONTACT_OVERLAP } from "../src/game/geometry";

const kinds = [
  "clubman",
  "spearman",
  "shark",
  "cyborgWalrus",
  "barbarian",
  "duck",
  "gundam",
  "skeletonKing",
  "stormblade",
] as const;
function duel(kind: UnitKind, reverse = false, boss = false) {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    Object.keys(UNITS) as UnitKind[],
    [kind, null, null],
    boss ? 20 : 1,
  );
  w.food = BATTLE.maxUnitFoodCost;
  w.nextAI = Infinity;
  assert.ok(spawn(w, "player", kind));
  assert.ok(spawn(w, "enemy", boss ? "dreadmaw" : "slimeArm"));
  const [troop, enemy] = w.units;
  troop.x = reverse ? 800 : 200;
  enemy.x = reverse ? 200 : 800;
  troop.side = reverse ? "enemy" : "player";
  enemy.side = reverse ? "player" : "enemy";
  troop.lane = 0;
  enemy.lane = 2;
  troop.hp = troop.maxHp = enemy.hp = enemy.maxHp = 100000;
  enemy.cooldown = 1000;
  return { w, troop, enemy };
}

test("every melee troop first hits with its weapon at the body edge in either direction", () => {
  for (const kind of kinds)
    for (const reverse of [false, true]) {
      const { w, troop, enemy } = duel(kind, reverse);
      for (let tick = 0; tick < 1200 && enemy.hp === 100000; tick++) {
        updateCombat(w, BATTLE.fixedStep);
        const gap =
          Math.abs(enemy.x - troop.x) -
          bodyFront(troop.kind) -
          bodyFront(enemy.kind);
        assert.ok(gap >= -CONTACT_OVERLAP - 1e-7, `${kind}: bodies overlapped`);
      }
      assert.equal(enemy.hp, 100000 - troop.damage, `${kind}: never attacked`);
      const weaponOverlap =
        meleeReach(troop.kind) +
        bodyFront(enemy.kind) -
        Math.abs(enemy.x - troop.x);
      // A target can close a little farther while a lowered weapon rises.
      const closingDuringWindup = hasUpswing(kind)
        ? COMBAT_UNITS[enemy.kind].speed * (UPSWING.windup + BATTLE.fixedStep)
        : 0;
      assert.ok(
        weaponOverlap >= 0 &&
          weaponOverlap <= CONTACT_OVERLAP + closingDuringWindup + 2,
        `${kind}: contact overlap ${weaponOverlap}`,
      );
      assert.equal(w.projectiles.length, 0);
    }
});

test("short and long melee weapons have different contact distances without center overlap", () => {
  for (const [kind, expectedHit] of [
    ["clubman", false],
    ["spearman", true],
    ["barbarian", true],
  ] as const) {
    const { w, troop, enemy } = duel(kind);
    troop.x = 400;
    enemy.x = 510; // Spear/large axe reaches the slime; the short club cannot.
    troop.cooldown = 0;
    updateCombat(w, 0.001);
    if (kind === "barbarian") updateCombat(w, 0.09);
    assert.equal(enemy.hp < 100000, expectedHit, kind);
  }
});

test("a weapon cannot hit beyond the visual contact boundary", () => {
  const { w, troop, enemy } = duel("duck");
  troop.x = 400;
  // Duck's animated bill reaches 65 model units, slime body front reaches 32.
  enemy.x = 400 + (65 + 32 - 3) * 1.4 + 1;
  troop.cooldown = 0;
  updateCombat(w, 0.001);
  assert.equal(enemy.hp, 100000);
  enemy.x = troop.x + (65 + 32 - 3) * 1.4;
  updateCombat(w, 0.001);
  assert.equal(enemy.hp, 100000 - troop.damage);
});

test("opposing bodies remain separate with long cooldowns and large movement steps", () => {
  for (const reverse of [false, true]) {
    const { w, troop, enemy } = duel("duck", reverse);
    troop.cooldown = 1000;
    for (let tick = 0; tick < 100; tick++) {
      updateCombat(w, 0.25);
      assert.ok(
        Math.abs(enemy.x - troop.x) >=
          bodyFront(troop.kind) +
            bodyFront(enemy.kind) -
            CONTACT_OVERLAP -
            1e-7,
      );
    }
  }
});

test("melee contact reaches Dreadmaw's lower body beside its hands", () => {
  const { w, troop, enemy } = duel("clubman", false, true);
  for (let tick = 0; tick < 1200 && enemy.hp === 100000; tick++)
    updateCombat(w, BATTLE.fixedStep);
  assert.equal(enemy.hp, 100000 - troop.damage);
  assert.ok(Math.abs(enemy.x - troop.x) < 165);
  assert.ok(
    Math.abs(enemy.x - troop.x) >=
      bodyFront(troop.kind) + bodyFront(enemy.kind) - CONTACT_OVERLAP,
  );
});

test("Dreadmaw and melee troops cannot hit across the old empty gap", () => {
  for (const reverse of [false, true]) {
    for (const bossAttacks of [false, true]) {
      const { w, troop, enemy: boss } = duel("clubman", reverse, true);
      const attacker = bossAttacks ? boss : troop;
      const target = bossAttacks ? troop : boss;
      troop.cooldown = boss.cooldown = 1000;
      attacker.cooldown = 0;
      const dir = attacker.side === "player" ? 1 : -1;
      attacker.x = 500;
      // Current art: lower-body front 28, animated hand edge 34, at 3x scale.
      const contact = bossAttacks
        ? 34 * 3 * 1.4 + 19 * 1.4 - CONTACT_OVERLAP
        : 35 * 1.4 + 28 * 3 * 1.4 - CONTACT_OVERLAP;
      target.x = attacker.x + dir * (contact + 1);
      updateCombat(w, 0.001);
      assert.equal(target.hp, 100000, "hit before hand/weapon contact");
      target.x = attacker.x + dir * contact;
      updateCombat(w, 0.001);
      assert.equal(target.hp, 100000 - attacker.damage);
    }
  }
});

test("a large body intercepts melee before a smaller enemy behind its edge", () => {
  const { w, troop, enemy: boss } = duel("clubman", false, true);
  troop.x = 400;
  boss.x = 700;
  const slime = { ...boss, id: w.nextId++, kind: "slimeArm" as const, x: 640 };
  w.units.push(slime);
  for (let tick = 0; tick < 1200 && boss.hp === 100000; tick++)
    updateCombat(w, BATTLE.fixedStep);
  assert.equal(boss.hp, 100000 - troop.damage);
  assert.equal(slime.hp, 100000);
});
