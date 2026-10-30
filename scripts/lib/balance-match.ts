import { BATTLE, UNITS, UnitKind } from "../../src/game/config";
import { createWorld, step } from "../../src/game/engine";
import { spawn } from "../../src/game/units";

export function simulateMatch(
  player: UnitKind[],
  enemy: UnitKind[],
  reversePriority = false,
) {
  const owned = Object.keys(UNITS) as UnitKind[];
  const equipped = [...new Set(player)];
  if (!player.length || !enemy.length || equipped.length > 3)
    throw new Error(
      "Balance scenario needs two nonempty armies with at most three player unit types.",
    );
  const w = createWorld({ food: 0, health: 0, damage: 0 }, owned, [
    equipped[0] ?? null,
    equipped[1] ?? null,
    equipped[2] ?? null,
  ]);
  w.nextAI = Infinity;
  for (const [side, kinds] of [
    ["player", player],
    ["enemy", enemy],
  ] as const) {
    kinds.forEach((kind, index) => {
      w.food = w.remainingEnemies = BATTLE.maxUnitFoodCost;
      // Roster balance duels use a player troop mirrored onto the opponent side;
      // normal enemy spawning accepts only wave creatures.
      const previousArmy = w.army;
      w.army = [kind, null, null];
      if (!spawn(w, "player", kind))
        throw new Error(`Could not set up ${kind}.`);
      w.army = previousArmy;
      const unit = w.units[w.units.length - 1];
      unit.side = side;
      const depth = Math.floor(index / 3) * BATTLE.spacing;
      unit.x = side === "player" ? 360 - depth : 640 + depth;
      unit.lane = index % 3;
    });
  }
  if (reversePriority) w.units.reverse();
  for (let tick = 0; tick < 90 * 60; tick++) {
    const playerAlive = w.units.some((u) => u.side === "player" && u.hp > 0);
    const enemyAlive = w.units.some((u) => u.side === "enemy" && u.hp > 0);
    if (!playerAlive || !enemyAlive)
      return {
        winner: playerAlive
          ? ("player" as const)
          : enemyAlive
            ? ("enemy" as const)
            : ("draw" as const),
        seconds: w.time,
      };
    step(w, BATTLE.fixedStep, () => 0.5);
  }
  return { winner: "draw" as const, seconds: w.time };
}

export function equalFoodMatch(
  a: UnitKind,
  b: UnitKind,
  reversePriority = false,
) {
  let x: number = UNITS[a].cost,
    y: number = UNITS[b].cost;
  while (y) [x, y] = [y, x % y];
  const lcm = (UNITS[a].cost * UNITS[b].cost) / x;
  const food = lcm * Math.ceil(12 / lcm);
  return simulateMatch(
    Array.from({ length: food / UNITS[a].cost }, () => a),
    Array.from({ length: food / UNITS[b].cost }, () => b),
    reversePriority,
  );
}
