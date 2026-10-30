import {
  BATTLE,
  COMBAT_UNITS,
  CombatKind,
  UPGRADES,
  isEnemyKind,
  isBossKind,
  isRanged,
} from "./config";
import { EnemyTrait, Side, World } from "./types";
import { bossForWave, enemyStats, isBossWave } from "./waves";
export function spawn(
  world: World,
  side: Side,
  kind: CombatKind,
  enemyTrait?: EnemyTrait,
): boolean {
  if (
    (enemyTrait !== undefined &&
      (side !== "enemy" ||
        (enemyTrait === "armored"
          ? kind !== "slimeArm"
          : kind !== "slimeThrower"))) ||
    world.result ||
    (side === "enemy" && !isEnemyKind(kind)) ||
    (side === "enemy" && isBossKind(kind) !== isBossWave(world.battleNumber)) ||
    (side === "enemy" &&
      isBossKind(kind) &&
      kind !== bossForWave(world.battleNumber)) ||
    (side === "player" &&
      (isEnemyKind(kind) ||
        !world.unlockedUnits.includes(kind) ||
        !world.army.includes(kind)))
  )
    return false;
  const stats =
    side === "enemy" && isEnemyKind(kind)
      ? enemyStats(kind, world.battleNumber, enemyTrait)
      : COMBAT_UNITS[kind];
  const key = side === "player" ? "food" : "remainingEnemies";
  const cost = side === "player" ? stats.cost : 1;
  if (
    world[key] < cost ||
    (side === "enemy" &&
      world.units.filter((u) => u.side === "enemy" && u.hp > 0).length >=
        BATTLE.maxEnemyUnits)
  )
    return false;
  const laneCounts = [0, 1, 2].map(
    (l) =>
      world.units.filter((u) => u.side === side && u.hp > 0 && u.lane === l)
        .length,
  );
  const lane = isBossKind(kind)
    ? 1
    : laneCounts.indexOf(Math.min(...laneCounts));
  const x =
    side === "player"
      ? BATTLE.playerBaseX + 25
      : BATTLE.enemySpawnX + (isBossKind(kind) ? 160 : 0);
  if (
    side === "enemy" &&
    world.units.some(
      (u) =>
        u.hp > 0 &&
        u.side === side &&
        u.lane === lane &&
        (!isRanged(u.kind) || isRanged(kind)) &&
        Math.abs(u.x - x) < BATTLE.spacing,
    )
  )
    return false;
  world[key] -= cost;
  const hp =
    stats.hp *
    (side === "player" ? 1 + world.levels.health * UPGRADES.health.bonus : 1);
  world.units.push({
    id: world.nextId++,
    kind,
    ...(enemyTrait ? { enemyTrait } : {}),
    side,
    x,
    lane,
    hp,
    maxHp: hp,
    damage:
      stats.damage *
      (side === "player" ? 1 + world.levels.damage * UPGRADES.damage.bonus : 1),
    cooldown: 0.15,
    attack: 0,
    hit: 0,
    dead: 0,
  });
  return true;
}
