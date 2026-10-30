import { AI, ENEMY_UNITS, SlimeKind } from "./config";
import {
  bossForWave,
  enemyTraitForSpawn,
  isBossWave,
  waveBurst,
} from "./waves";
import { World } from "./types";
import { spawn } from "./units";
export function updateAI(world: World, random: () => number) {
  if (world.result || world.remainingEnemies <= 0 || world.time < world.nextAI)
    return;
  world.nextAI = world.time + AI.decisionInterval;
  if (!world.aiPlan)
    world.aiPlan = bossForWave(world.battleNumber) ?? undefined;
  if (!world.aiPlan) {
    const choices = (Object.keys(ENEMY_UNITS) as SlimeKind[]).filter(
      // Teach melee on the starter wave; lobbers join from wave two onward.
      (kind) => kind === "slimeArm" || world.battleNumber >= 2,
    );
    let choice = random() * choices.reduce((n, k) => n + AI.weights[k], 0);
    for (const kind of choices) {
      choice -= AI.weights[kind];
      if (choice < 0) {
        world.aiPlan = kind;
        break;
      }
    }
  }
  // Blocked attempts retain both their plan and burst position without spending
  // the wave budget or skipping a group member.
  if (
    world.aiPlan &&
    spawn(
      world,
      "enemy",
      world.aiPlan,
      enemyTraitForSpawn(world.aiPlan, world.battleNumber, world.burstSpawned),
    )
  ) {
    world.aiPlan = undefined;
    if (!isBossWave(world.battleNumber)) {
      const burst = waveBurst(world.battleNumber);
      world.burstSpawned++;
      if (world.burstSpawned === burst.size) {
        world.burstSpawned = 0;
        world.nextAI = world.time + burst.rest;
      } else world.nextAI = world.time + burst.interval;
    }
  }
}
