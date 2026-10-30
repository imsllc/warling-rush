import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE, CombatKind, UNITS, UnitKind } from "../src/game/config";
import { AttackSound } from "../src/game/types";
import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { attackDistance } from "../src/game/geometry";

function fight(kind: CombatKind, wave = 1) {
  const playerUnit = Object.hasOwn(UNITS, kind);
  const w = createWorld(
    { food: 0, health: 0, damage: 0 },
    Object.keys(UNITS) as UnitKind[],
    [playerUnit ? (kind as UnitKind) : "clubman", null, null],
    wave,
  );
  w.nextAI = Infinity;
  w.food = 100;
  assert.ok(spawn(w, "player", playerUnit ? kind : "clubman"));
  assert.ok(spawn(w, "enemy", wave === 1 ? "slimeArm" : kind));
  const attacker = w.units[playerUnit ? 0 : 1];
  const target = w.units[playerUnit ? 1 : 0];
  attacker.kind = kind;
  attacker.x = 500;
  attacker.cooldown = 0;
  target.x = 500 + (playerUnit ? 1 : -1) * attackDistance(attacker, target);
  target.cooldown = 100;
  attacker.hp = target.hp = 100000;
  return { w, attacker, target };
}

test("each attack emits one matching sound for troops and bosses, including multi-shot volleys", () => {
  for (const [kind, wave, expected] of [
    ["clubman", 1, "sword"],
    ["spearman", 1, "sword"],
    ["gundam", 1, "sword"],
    ["rock", 1, "throw"],
    ["machineGunner", 1, "throw"],
    ["mech", 1, "throw"],
    ["tiger", 1, "throw"],
    ["slimeArm", 1, "sword"],
    ["slimeThrower", 1, "throw"],
    ["dreadmaw", 20, "sword"],
    ["scientist", 80, "throw"],
    ["pyramid", 100, "throw"],
  ] as const) {
    const { w } = fight(kind, wave);
    const heard: AttackSound[] = [];
    step(
      w,
      BATTLE.fixedStep,
      () => 0.5,
      (sound) => heard.push(sound),
    );
    assert.deepEqual(heard, [expected], kind);
    step(
      w,
      BATTLE.fixedStep,
      () => 0.5,
      (sound) => heard.push(sound),
    );
    assert.deepEqual(heard, [expected], `${kind}: cooldown must stay silent`);
  }
});

test("closing distance, dead units, and completed battles do not emit attack sounds", () => {
  const { w, attacker, target } = fight("rock");
  const heard: AttackSound[] = [];
  const onAttack = (sound: AttackSound) => heard.push(sound);
  target.x = 1000;
  step(w, BATTLE.fixedStep, () => 0.5, onAttack);
  assert.deepEqual(heard, []);
  target.x = attacker.x + 50;
  attacker.hp = 0;
  step(w, BATTLE.fixedStep, () => 0.5, onAttack);
  assert.deepEqual(heard, []);
  attacker.hp = 1000;
  w.result = "player";
  step(w, BATTLE.fixedStep, () => 0.5, onAttack);
  assert.deepEqual(heard, []);
});

test("ranged impact is silent and the next attack replays its sound", () => {
  const { w } = fight("rock");
  const heard: AttackSound[] = [];
  for (let tick = 0; tick < 120; tick++)
    step(
      w,
      BATTLE.fixedStep,
      () => 0.5,
      (sound) => heard.push(sound),
    );
  assert.deepEqual(heard, ["throw", "throw"]);
});
