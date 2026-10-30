import { foodRate } from "../game/config";
import type { World } from "../game/types";

export function foodProductionProgress(world: Pick<World, "time" | "levels">) {
  const produced = world.time * foodRate(world.levels.food);
  // Match the engine's whole-food payout boundary, including float tolerance.
  return Math.max(0, produced - Math.floor(produced + 1e-9));
}

export function availableFoodProgress(
  world: Pick<World, "time" | "levels" | "food">,
) {
  return world.food + foodProductionProgress(world);
}

export function foodFillFraction(amount: number, target: number) {
  "worklet";
  return Math.max(0, Math.min(1, amount / target));
}
