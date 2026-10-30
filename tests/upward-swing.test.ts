import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, step } from "../src/game/engine";
import { damage, updateCombat } from "../src/game/combat";
import { attackDistance } from "../src/game/geometry";
import { UPSWING } from "../src/game/meleeTiming";
import { spawn } from "../src/game/units";
import { meleeWeaponPose, swingPoint } from "../src/rendering/meleePose";

const kinds = ["stormblade", "barbarian"] as const;
function duel(kind: (typeof kinds)[number], reverse = false) {
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    [kind],
    [kind, null, null],
  );
  w.nextAI = Infinity;
  w.food = 20;
  assert.ok(spawn(w, "player", kind));
  assert.ok(spawn(w, "enemy", "slimeArm"));
  const [troop, target] = w.units;
  if (reverse) {
    troop.side = "enemy";
    target.side = "player";
  }
  troop.x = reverse ? 700 : 400;
  target.x = troop.x + (reverse ? -1 : 1) * attackDistance(troop, target);
  troop.cooldown = 0;
  target.cooldown = 1000;
  troop.hp = target.hp = 10000;
  return { w, troop, target };
}

test("raised sword and axe sweep through contact into a downward follow-through", () => {
  for (const kind of kinds) {
    const tip =
      kind === "stormblade" ? ([78, 0] as const) : ([70, 10] as const);
    const idle = meleeWeaponPose(kind, 0);
    const start = meleeWeaponPose(kind, UPSWING.duration);
    const contact = meleeWeaponPose(kind, UPSWING.contactRemaining);
    const follow = meleeWeaponPose(kind, 0.095);
    assert.deepEqual(start, idle);
    assert.ok(idle.angle < -50);
    assert.ok(contact.angle <= 0);
    assert.ok(follow.angle > contact.angle);
    assert.ok(swingPoint(idle, tip)[1] < swingPoint(contact, tip)[1]);
    assert.ok(swingPoint(contact, tip)[1] < swingPoint(follow, tip)[1]);
  }
});

test("upswings plant the feet and damage one target once at visible contact in either direction", () => {
  for (const kind of kinds)
    for (const reverse of [false, true]) {
      const { w, troop, target } = duel(kind, reverse);
      const x = troop.x;
      updateCombat(w, 0.001);
      assert.equal(target.hp, 10000);
      assert.equal(troop.pendingMeleeTarget, target.id);
      updateCombat(w, UPSWING.windup / 2);
      assert.equal(
        target.hp,
        10000,
        "cannot damage while the blade is still lowered",
      );
      updateCombat(w, UPSWING.windup / 2);
      assert.equal(target.hp, 10000 - troop.damage);
      assert.equal(meleeWeaponPose(kind, troop.attack).extension, 1);
      assert.equal(troop.pendingMeleeTarget, undefined);
      assert.equal(troop.x, x);
      updateCombat(w, 0.1);
      assert.equal(
        target.hp,
        10000 - troop.damage,
        "follow-through cannot hit twice",
      );
      assert.equal(troop.x, x);
      assert.equal(w.projectiles.length, 0);
    }
});

test("a target leaving weapon reach during the upswing is not hit later", () => {
  for (const kind of kinds) {
    const { w, troop, target } = duel(kind);
    updateCombat(w, 0.001);
    target.x += 500;
    updateCombat(w, UPSWING.windup);
    assert.equal(target.hp, 10000);
    assert.equal(troop.pendingMeleeTarget, undefined);
    target.x = troop.x + attackDistance(troop, target);
    updateCombat(w, 0.1);
    assert.equal(target.hp, 10000);
  }
});

test("dead attackers, dead targets, and completed battles cancel pending upswing damage", () => {
  for (const kind of kinds) {
    for (const outcome of ["attacker", "target", "finished"] as const) {
      const { w, troop, target } = duel(kind);
      updateCombat(w, 0.001);
      if (outcome === "attacker") damage(w, troop, troop.hp, troop.lane);
      else if (outcome === "target") damage(w, target, target.hp, target.lane);
      else w.result = "player";
      const hp = target.hp;
      const coins = w.coinsEarned;
      step(w, UPSWING.windup);
      assert.equal(target.hp, hp);
      assert.equal(w.coinsEarned, coins);
    }
  }
});
