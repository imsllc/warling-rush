import {
  BATTLE,
  BOSS,
  CANNON,
  COMBAT_UNITS,
  GUNNER,
  PYRAMID,
  TIGER,
  TOMMY,
  RAPPER,
  MARINE,
  MIG,
  MAGE,
  RACCOON,
  raccoonHover,
  ENEMY_TACTICS,
  isBossKind,
  isRanged,
} from "./config";
import { AttackSound, AttackStyle, Projectile, Unit, World } from "./types";
import { attackDistance, bodyContactDistance, bodyFront } from "./geometry";
import { enemyKillCoins } from "./rewards";
import { hasUpswing, UPSWING } from "./meleeTiming";
export function damage(
  world: World,
  target: Unit | "player",
  amount: number,
  lane: number,
  potion = false,
  attackStyle?: AttackStyle,
  source?: Pick<Unit | Projectile, "kind" | "side"> & {
    visualKind?: Unit["kind"];
  },
) {
  if (typeof target === "string")
    world.bases[target] = Math.max(0, world.bases[target] - amount);
  else {
    if (target.hp <= 0) return;
    if (target.side === "enemy" && target.enemyTrait === "armored") {
      if (attackStyle === "ranged") amount *= ENEMY_TACTICS.armorRangedDamage;
      else if (attackStyle === "melee")
        amount *= ENEMY_TACTICS.armorMeleeDamage;
    }
    target.hp = Math.max(0, target.hp - amount);
    target.hit = 0.15;
    if (target.hp === 0 && target.side === "enemy") {
      const coins = enemyKillCoins(target.kind, world.battleNumber);
      if (coins > 0) {
        world.kills += 1;
        world.coinsEarned = Math.min(
          Number.MAX_SAFE_INTEGER,
          world.coinsEarned + coins,
        );
      }
    }
  }
  world.effects.push({
    ...(source?.side === "player"
      ? {
          visual: {
            kind: source.visualKind ?? source.kind,
            x:
              typeof target === "string"
                ? BATTLE.playerBaseX
                : target.x -
                  (attackStyle === "melee" ? bodyFront(target.kind) : 0),
          },
        }
      : {}),
    potion,
    id: world.nextId++,
    x: typeof target === "string" ? BATTLE.playerBaseX : target.x,
    lane,
    damage: amount,
    age: 0,
  });
}
export function updateCombat(
  world: World,
  dt: number,
  onAttack?: (sound: AttackSound) => void,
) {
  const living = world.units.filter((u) => u.hp > 0);
  for (const unit of living) {
    if (unit.hp <= 0) continue;
    const stats = COMBAT_UNITS[unit.kind],
      dir = unit.side === "player" ? 1 : -1;
    unit.cooldown -= dt;
    unit.attack = Math.max(0, unit.attack - dt);
    unit.hit = Math.max(0, unit.hit - dt);
    if (
      unit.pendingMeleeTarget !== undefined &&
      unit.attack <= UPSWING.contactRemaining + 1e-9
    ) {
      const pending = unit.pendingMeleeTarget;
      delete unit.pendingMeleeTarget;
      const victim =
        pending === "player"
          ? "player"
          : living.find(
              (other) =>
                other.id === pending &&
                other.hp > 0 &&
                other.side !== unit.side,
            );
      const targetX = victim === "player" ? BATTLE.playerBaseX + 20 : victim?.x;
      if (
        victim &&
        targetX !== undefined &&
        Math.abs(targetX - unit.x) <=
          attackDistance(unit, victim === "player" ? undefined : victim) +
            1e-9 &&
        (targetX - unit.x) * dir >= -BATTLE.spacing
      ) {
        damage(
          world,
          victim,
          unit.damage,
          victim === "player" ? unit.lane : victim.lane,
          false,
          "melee",
          unit,
        );
      }
    }
    // Plant the feet through the upswing, including its short pre-contact phase.
    if (hasUpswing(unit.kind) && unit.attack > 0) continue;
    // Hold the floating eye still while it charges and releases its beam.
    if (world.beams.some((beam) => beam.source === unit.id)) continue;
    // Lanes provide formation depth; enemies in all lanes can intercept troops.
    const target = living
      .filter(
        (e) =>
          e.hp > 0 &&
          e.side !== unit.side &&
          (e.x - unit.x) * dir >= -BATTLE.spacing,
      )
      .sort(
        (a, b) =>
          Math.abs(a.x - unit.x) -
          bodyFront(a.kind) -
          (Math.abs(b.x - unit.x) - bodyFront(b.kind)),
      )[0];
    const baseX = BATTLE.playerBaseX + 20;
    // There is no enemy base: wait at the edge until another enemy enters.
    if (!target && unit.side === "player") {
      let movement = Math.min(
        stats.speed * dt,
        Math.max(0, BATTLE.playerAdvanceX - unit.x),
      );
      for (const ally of living) {
        if (
          ally.side === unit.side &&
          ally.id !== unit.id &&
          ally.lane === unit.lane &&
          (!isRanged(ally.kind) || isRanged(unit.kind)) &&
          ally.x > unit.x
        ) {
          movement = Math.min(
            movement,
            Math.max(0, ally.x - unit.x - BATTLE.spacing),
          );
        }
      }
      unit.x += movement;
      continue;
    }
    const distance = Math.abs((target?.x ?? baseX) - unit.x);
    const reach = attackDistance(unit, target);
    // Keep support behind a living melee screen when an enemy closes in.
    // Lone ranged units can still be caught; this does not introduce endless
    // kiting or alter melee contact. A small dead zone prevents foot shuffling.
    if (
      unit.side === "player" &&
      isRanged(unit.kind) &&
      target &&
      distance < reach - BATTLE.spacing
    ) {
      const screened = living.some(
        (ally) =>
          ally.hp > 0 &&
          ally.side === unit.side &&
          !isRanged(ally.kind) &&
          ally.x > unit.x &&
          ally.x <= target.x,
      );
      if (screened) {
        let retreat = Math.min(
          stats.speed * dt,
          reach - BATTLE.spacing - distance,
          Math.max(0, unit.x - (BATTLE.playerBaseX + 25)),
        );
        for (const ally of living) {
          if (
            ally.hp > 0 &&
            ally.side === unit.side &&
            ally.id !== unit.id &&
            ally.lane === unit.lane &&
            ally.x < unit.x
          )
            retreat = Math.min(
              retreat,
              Math.max(0, unit.x - ally.x - BATTLE.spacing),
            );
        }
        unit.x -= retreat;
      }
    }
    if (distance <= reach + 1e-9) {
      if (unit.cooldown <= 0) {
        unit.cooldown = stats.cooldown;
        unit.attack =
          unit.kind === "machineGunner" ||
          unit.kind === "mafia" ||
          unit.kind === "raccoon" ||
          unit.kind === "spaceMarine"
            ? GUNNER.attackTime
            : UPSWING.duration;
        onAttack?.(isRanged(unit.kind) ? "throw" : "sword");
        if (unit.kind === "pyramid") {
          world.beams.push({
            id: world.nextId++,
            source: unit.id,
            side: unit.side,
            startX: unit.x,
            endX:
              unit.side === "enemy"
                ? Math.max(baseX, unit.x - stats.range)
                : unit.x + stats.range,
            launchLane: unit.lane,
            lane: target?.lane ?? unit.lane,
            damage: unit.damage,
            age: 0,
            fired: false,
            targetBase: !target,
          });
        } else if (stats.projectile !== null) {
          const targetX = target?.x ?? baseX;
          const shots =
            (stats.projectile === "missile" && unit.kind !== "mig17") ||
            stats.projectile === "laser"
              ? 2
              : 1;
          for (let pod = 0; pod < shots; pod++) {
            const startX =
              unit.x +
              (unit.kind === "darkMage"
                ? MAGE.staffX * dir
                : unit.kind === "mig17"
                  ? MIG.missileX * dir
                  : stats.projectile === "note"
                    ? RAPPER.micX * dir
                    : stats.projectile === "laser"
                      ? TIGER.eyes[pod].x * dir
                      : stats.projectile === "cannonball"
                        ? CANNON.muzzleOffsetX * dir
                        : stats.projectile === "basketball"
                          ? 30 * dir
                          : stats.projectile === "bullet"
                            ? (unit.kind === "raccoon"
                                ? RACCOON.muzzleOffsetX
                                : unit.kind === "spaceMarine"
                                  ? MARINE.muzzleOffsetX
                                  : unit.kind === "mafia"
                                    ? TOMMY.muzzleOffsetX
                                    : GUNNER.muzzleOffsetX) * dir
                            : stats.projectile === "potion"
                              ? BOSS.potionLaunchOffsetX * dir
                              : shots === 2
                                ? (pod === 0 ? -17 : 17) * dir
                                : 0);
            world.projectiles.push({
              kind: stats.projectile,
              ...(unit.kind === "raccoon"
                ? { visualKind: "raccoon" as const }
                : {}),
              ...(unit.enemyTrait === "frail" ? { empowered: true } : {}),
              id: world.nextId++,
              side: unit.side,
              x: startX,
              startX,
              targetX,
              lane: target?.lane ?? unit.lane,
              launchLane: unit.lane,
              launchOffsetX: startX - unit.x,
              ...(unit.kind === "darkMage"
                ? { launchOffsetY: MAGE.staffY }
                : unit.kind === "mig17"
                  ? { launchOffsetY: MIG.missileY }
                  : stats.projectile === "note"
                    ? { launchOffsetY: RAPPER.micY }
                    : stats.projectile === "laser"
                      ? { launchOffsetY: TIGER.eyes[pod].y }
                      : unit.kind === "raccoon"
                        ? {
                            launchOffsetY:
                              RACCOON.muzzleY +
                              raccoonHover(world.time, unit.id),
                          }
                        : unit.kind === "spaceMarine"
                          ? { launchOffsetY: MARINE.muzzleY }
                          : unit.kind === "mafia"
                            ? { launchOffsetY: TOMMY.muzzleY }
                            : {}),
              target: target?.id ?? "player",
              damage: unit.damage / shots,
              age: 0,
              duration:
                stats.projectile === "fireball"
                  ? Math.max(
                      0.25,
                      Math.abs(targetX - startX) / MAGE.fireballSpeed,
                    )
                  : stats.projectile === "note"
                    ? Math.max(
                        0.25,
                        Math.abs(targetX - startX) / RAPPER.noteSpeed,
                      )
                    : stats.projectile === "laser"
                      ? Math.max(
                          0.18,
                          Math.abs(targetX - startX) / TIGER.laserSpeed,
                        )
                      : stats.projectile === "cannonball"
                        ? Math.max(
                            0.1,
                            Math.abs(targetX - startX) / CANNON.ballSpeed,
                          )
                        : stats.projectile === "bullet"
                          ? Math.max(
                              0.05,
                              Math.abs(targetX - startX) / GUNNER.bulletSpeed,
                            )
                          : Math.max(
                              0.2,
                              Math.max(
                                0,
                                distance -
                                  (target && isBossKind(target.kind)
                                    ? BOSS.bodyRadius
                                    : 0),
                              ) / 340,
                            ),
            });
          }
        } else if (hasUpswing(unit.kind)) {
          unit.pendingMeleeTarget = target?.id ?? "player";
        } else {
          damage(
            world,
            target ?? "player",
            unit.damage,
            target?.lane ?? unit.lane,
            false,
            "melee",
            unit,
          );
          if (isBossKind(unit.kind) && unit.kind !== "dreadmaw" && target) {
            // A broad claw swipe catches nearby frontline troops across lanes.
            living
              .filter(
                (other) =>
                  other.id !== target.id &&
                  other.hp > 0 &&
                  other.side !== unit.side &&
                  Math.abs(other.x - unit.x) <= attackDistance(unit, other) &&
                  (other.x - unit.x) * dir >= -BATTLE.spacing,
              )
              .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))
              .slice(0, BOSS.cleaveTargets - 1)
              .forEach((other) =>
                damage(
                  world,
                  other,
                  unit.damage,
                  other.lane,
                  false,
                  "melee",
                  unit,
                ),
              );
          }
        }
      }
    } else {
      let step = Math.min(stats.speed * dt, distance - reach);
      // Opposing silhouettes cannot pass through one another while closing,
      // including across visual lanes. A few pixels of contact are allowed.
      for (const enemy of living) {
        if (enemy.hp <= 0 || enemy.side === unit.side) continue;
        const ahead = (enemy.x - unit.x) * dir;
        if (ahead >= 0)
          step = Math.min(
            step,
            Math.max(0, ahead - bodyContactDistance(unit, enemy)),
          );
      }
      // Melee troops can pass the ranged support row to reach the frontline.
      for (const ally of living)
        if (
          ally.side === unit.side &&
          ally.id !== unit.id &&
          ally.lane === unit.lane &&
          (!isRanged(ally.kind) || isRanged(unit.kind)) &&
          (ally.x - unit.x) * dir > 0
        )
          step = Math.min(
            step,
            Math.max(0, (ally.x - unit.x) * dir - BATTLE.spacing),
          );
      unit.x += step * dir;
    }
  }
  for (const p of world.projectiles) {
    p.age += dt;
    p.x = p.startX + (p.targetX - p.startX) * Math.min(1, p.age / p.duration);
    if (p.age >= p.duration) {
      const target =
        typeof p.target === "string"
          ? p.target
          : world.units.find((u) => u.id === p.target && u.hp > 0);
      if (target)
        damage(
          world,
          target,
          p.damage,
          p.lane,
          p.kind === "potion",
          "ranged",
          p,
        );
      if (p.kind === "potion" && typeof target !== "string") {
        world.units
          .filter(
            (other) =>
              other.hp > 0 &&
              other.side !== p.side &&
              other.id !== target?.id &&
              Math.abs(other.x - p.targetX) <= BOSS.potionSplashRadius,
          )
          .sort((a, b) => Math.abs(a.x - p.targetX) - Math.abs(b.x - p.targetX))
          .slice(0, target ? BOSS.cleaveTargets - 1 : BOSS.cleaveTargets)
          .forEach((other) =>
            damage(world, other, p.damage, other.lane, true, "ranged"),
          );
      }
    }
  }
  world.projectiles = world.projectiles.filter((p) => p.age < p.duration);
  for (const beam of world.beams) {
    const source = world.units.find((u) => u.id === beam.source && u.hp > 0);
    if (!source) continue;
    beam.age += dt;
    if (!beam.fired && beam.age >= PYRAMID.chargeTime) {
      beam.fired = true;
      const dir = beam.side === "enemy" ? -1 : 1;
      world.units
        .filter(
          (u) =>
            u.hp > 0 &&
            u.side !== beam.side &&
            (u.x - beam.startX) * dir >= 0 &&
            (u.x - beam.endX) * dir <= 0,
        )
        .sort(
          (a, b) => Math.abs(a.x - beam.startX) - Math.abs(b.x - beam.startX),
        )
        .slice(0, PYRAMID.maxTargets)
        .forEach((u) => damage(world, u, beam.damage, u.lane, false, "ranged"));
      if (beam.targetBase) damage(world, "player", beam.damage, beam.lane);
    }
  }
  world.beams = world.beams.filter(
    (beam) =>
      beam.age < PYRAMID.chargeTime + PYRAMID.beamTime &&
      world.units.some((u) => u.id === beam.source && u.hp > 0),
  );
  for (const u of world.units) if (u.hp <= 0) u.dead += dt;
  world.units = world.units.filter((u) => u.dead < 0.45);
  for (const e of world.effects) e.age += dt;
  world.effects = world.effects.filter((e) => e.age < 0.5);
  if (world.bases.player <= 0) world.result = "enemy";
  else if (
    world.remainingEnemies === 0 &&
    !world.units.some((u) => u.side === "enemy" && u.hp > 0)
  )
    world.result = "player";
}
