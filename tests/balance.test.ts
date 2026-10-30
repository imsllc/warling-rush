import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defineUnit,
  combatPower,
  foodEfficiency,
  MAX_UNIT_FOOD,
  UnitProfile,
  unlockPrice,
} from "../src/game/balance";
import { BATTLE, ENEMY_UNITS, UNITS, UnitKind } from "../src/game/config";
import { equalFoodMatch, simulateMatch } from "../scripts/lib/balance-match";

const blueprint = {
  name: "Test",
  role: "Test",
  foodCost: 4,
  profile: "balanced",
  speed: 39,
  range: 25,
  cooldown: 0.9,
  projectile: null,
} as const;
const profiles: UnitProfile[] = ["balanced", "tank", "damage", "glassCannon"];
const kinds = Object.keys(UNITS) as UnitKind[];

test("each roster tier buys more combined health/DPS value while preserving different roles", () => {
  for (let i = 1; i < kinds.length; i++) {
    const previous = UNITS[kinds[i - 1]],
      current = UNITS[kinds[i]];
    assert.ok(current.cost > previous.cost);
    assert.ok(current.unlockCost > previous.unlockCost);
    assert.ok(
      combatPower(current) / combatPower(previous) >=
        (current.cost / previous.cost) ** 0.3,
      `${current.name} needs a clear total stat increase over ${previous.name}`,
    );
    assert.ok(
      current.hp > previous.hp ||
        current.damage / current.cooldown > previous.damage / previous.cooldown,
      `${current.name} cannot have both lower health and lower DPS`,
    );
  }
});

test("role profiles exchange health for DPS while keeping equal food-budget power", () => {
  const [balanced, tank, damage, glass] = profiles.map((profile) =>
    defineUnit({ ...blueprint, profile }),
  );
  assert.ok(
    tank.hp > balanced.hp &&
      tank.damage / tank.cooldown < balanced.damage / balanced.cooldown,
  );
  assert.ok(
    damage.hp < balanced.hp &&
      damage.damage / damage.cooldown > balanced.damage / balanced.cooldown,
  );
  assert.ok(
    glass.hp < damage.hp &&
      glass.damage / glass.cooldown > damage.damage / damage.cooldown,
  );
  for (const unit of [balanced, tank, damage, glass])
    assert.ok(Math.abs(foodEfficiency(unit) - 1) < 0.04);
});

test("range and movement consume power and faster attacks do not create free DPS", () => {
  const base = defineUnit(blueprint);
  const ranged = defineUnit({ ...blueprint, range: 230, projectile: "spear" });
  const fast = defineUnit({ ...blueprint, speed: 60 });
  assert.ok(ranged.hp < base.hp && ranged.damage < base.damage);
  assert.ok(fast.hp < base.hp && fast.damage < base.damage);
  const quickHits = defineUnit({ ...blueprint, cooldown: 0.4 });
  const heavyHits = defineUnit({ ...blueprint, cooldown: 2 });
  assert.ok(heavyHits.damage > quickHits.damage);
  assert.ok(
    Math.abs(
      quickHits.damage /
        quickHits.cooldown /
        (heavyHits.damage / heavyHits.cooldown) -
        1,
    ) < 0.04,
  );
});

test("all supported tiers and archetypes remain inside the rounding tolerance", () => {
  assert.equal(MAX_UNIT_FOOD, BATTLE.maxUnitFoodCost);
  for (let foodCost = 1; foodCost <= MAX_UNIT_FOOD; foodCost++)
    for (const profile of profiles) {
      for (const range of [25, 185, 260]) {
        const unit = defineUnit({ ...blueprint, foodCost, profile, range });
        assert.ok(unit.hp > 0 && unit.damage > 0);
        assert.ok(
          Math.abs(foodEfficiency(unit) - 1) < 0.06,
          `${foodCost} ${profile} ${range}`,
        );
      }
    }
  // The final raccoon intentionally has an explicit five-times-mage budget.
  for (const kind of kinds.filter((kind) => kind !== "raccoon"))
    assert.ok(Math.abs(foodEfficiency(UNITS[kind]) - 1) < 0.025, kind);
});

test("unlock price grows with the food budget, not the HP/DPS split", () => {
  assert.equal(unlockPrice(1), 0);
  assert.equal(unlockPrice(2), 100);
  let previous = 0;
  for (let foodCost = 2; foodCost <= MAX_UNIT_FOOD; foodCost++) {
    assert.ok(unlockPrice(foodCost) > previous);
    previous = unlockPrice(foodCost);
    assert.equal(unlockPrice(foodCost) % 25, 0);
  }
  const prices = profiles.map(
    (profile) => defineUnit({ ...blueprint, profile }).unlockCost,
  );
  assert.equal(new Set(prices).size, 1);
});

test("invalid budgets and unsupported stat ranges cannot generate broken units", () => {
  for (const foodCost of [0, -1, 1.5, MAX_UNIT_FOOD + 1, NaN, Infinity])
    assert.throws(() => defineUnit({ ...blueprint, foodCost }));
  for (const input of [
    { speed: 0 },
    { speed: Infinity },
    { range: 1000 },
    { cooldown: 0 },
    { cooldown: NaN },
  ])
    assert.throws(() => defineUnit({ ...blueprint, ...input }));
});

test("every purchased tier improves combined value per food over the starter roster", () => {
  const starterValue = Math.max(
    ...[UNITS.clubman, UNITS.spearman, UNITS.rock].map(
      (unit) => combatPower(unit) / unit.cost,
    ),
  );
  for (const kind of kinds.filter((kind) => UNITS[kind].cost > 3)) {
    const unit = UNITS[kind];
    assert.ok(
      combatPower(unit) / unit.cost > starterValue * 1.05,
      `${unit.name} must provide better combined HP/DPS per food than starter units`,
    );
  }
});

test("one Machine Gunner beats two Rock Throwers at the same six-food cost", () => {
  const gunner = UNITS.machineGunner,
    rock = UNITS.rock;
  assert.equal(gunner.cost, rock.cost * 2);
  assert.ok(
    gunner.damage / gunner.cooldown > (2 * rock.damage) / rock.cooldown,
  );
  assert.ok(gunner.hp > 2 * rock.hp);
  for (const reverse of [false, true])
    assert.equal(
      simulateMatch(["machineGunner"], ["rock", "rock"], reverse).winner,
      "player",
    );
});

test("player progression buffs preserve the existing enemy base stats", () => {
  assert.equal(ENEMY_UNITS.slimeArm.hp, 100);
  assert.equal(ENEMY_UNITS.slimeArm.damage, 15);
  assert.equal(ENEMY_UNITS.slimeThrower.hp, 172);
  assert.equal(ENEMY_UNITS.slimeThrower.damage, 71);
});

test("equal-food matchups give every advanced purchase a winning starter matchup", () => {
  const outcomes = Object.fromEntries(
    kinds.map((kind) => [kind, { starterWins: 0 }]),
  ) as Record<UnitKind, { starterWins: number }>;
  for (let i = 0; i < kinds.length; i++)
    for (let j = i + 1; j < kinds.length; j++)
      for (const reverse of [false, true]) {
        const a = kinds[i],
          b = kinds[j];
        const result = equalFoodMatch(a, b, reverse);
        if (result.winner === "draw") continue;
        const winner = result.winner === "player" ? a : b,
          loser = winner === a ? b : a;
        if (UNITS[loser].cost <= 3) outcomes[winner].starterWins++;
      }
  for (const kind of kinds.filter((kind) => UNITS[kind].cost > 3)) {
    assert.ok(
      outcomes[kind].starterWins > 0,
      `${kind} cannot beat any starter army`,
    );
  }
});
