import { AI, BATTLE, foodRate, UnitKind } from "./config";
import { AttackSound, Levels, World } from "./types";
import { updateAI } from "./ai";
import { updateCombat } from "./combat";
import { ArmySlots } from "../army";
import { waveEnemyCount } from "./waves";
export function createWorld(
  levels: Levels,
  unlockedUnits: UnitKind[] = ["clubman"],
  army: ArmySlots = [
    unlockedUnits[0] ?? null,
    unlockedUnits[1] ?? null,
    unlockedUnits[2] ?? null,
  ],
  battleNumber = 1,
): World {
  return {
    battleNumber,
    time: 0,
    food: BATTLE.startingFood,
    // Total slimes still to spawn, separate from the simultaneous unit cap.
    remainingEnemies: waveEnemyCount(battleNumber),
    kills: 0,
    coinsEarned: 0,
    bases: { player: BATTLE.baseHp },
    units: [],
    projectiles: [],
    beams: [],
    effects: [],
    nextId: 1,
    nextAI: AI.firstSpawnDelay,
    burstSpawned: 0,
    result: null,
    levels: { ...levels },
    unlockedUnits: [...unlockedUnits],
    army: [...army],
  };
}
export function step(
  world: World,
  dt: number,
  random = Math.random,
  onAttack?: (sound: AttackSound) => void,
) {
  if (world.result) return;
  const previousTime = world.time;
  world.time += dt;
  // Pay out whole food when a production interval completes.
  const earned = (rate: number) =>
    Math.floor(world.time * rate + 1e-9) -
    Math.floor(previousTime * rate + 1e-9);
  world.food += earned(foodRate(world.levels.food));
  updateAI(world, random);
  updateCombat(world, dt, onAttack);
}
