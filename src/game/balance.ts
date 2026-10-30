export type UnitProfile = "balanced" | "tank" | "damage" | "glassCannon";
export const MAX_UNIT_FOOD = 21;
export const BALANCE = {
  baseHp: 100,
  baseDps: 15 / 0.9,
  foodExponent: 1.2,
  rangeAllowance: 1500,
  speedExponent: 0.2,
  unlockExponent: 1.2,
  healthBias: { balanced: 1, tank: 1.8, damage: 0.75, glassCannon: 0.55 },
} as const;

type UnitBlueprint = {
  name: string;
  role: string;
  foodCost: number;
  profile: UnitProfile;
  speed: number;
  range: number;
  cooldown: number;
  projectile:
    | "rock"
    | "axe"
    | "spear"
    | "missile"
    | "slime"
    | "bullet"
    | "basketball"
    | "cannonball"
    | "laser"
    | "note"
    | "fireball"
    | null;
};

export function utilityMultiplier(unit: { range: number; speed: number }) {
  return (
    (1 + Math.max(0, unit.range - 25) / BALANCE.rangeAllowance) *
    (unit.speed / 39) ** BALANCE.speedExponent
  );
}

export function unlockPrice(foodCost: number) {
  if (!Number.isInteger(foodCost) || foodCost < 1 || foodCost > MAX_UNIT_FOOD)
    throw new Error(
      `Unit food cost must be an integer from 1 to ${MAX_UNIT_FOOD}.`,
    );
  return foodCost === 1
    ? 0
    : Math.round((100 * (foodCost - 1) ** BALANCE.unlockExponent) / 25) * 25;
}

// Purchases improve combined HP/DPS value per food as the roster progresses.
// Keep wave creatures on their original curve so roster buffs do not buff enemies.
export function defineUnit<const T extends UnitBlueprint>(blueprint: T) {
  return buildUnit(blueprint, BALANCE.foodExponent);
}

export function defineEnemyUnit<const T extends UnitBlueprint>(blueprint: T) {
  return buildUnit(blueprint, 0.8);
}

// Reach and movement consume budget; cooldown converts DPS into damage per hit.
function buildUnit<const T extends UnitBlueprint>(
  blueprint: T,
  foodExponent: number,
) {
  const { foodCost, profile, speed, range, cooldown } = blueprint;
  if (!Object.hasOwn(BALANCE.healthBias, profile))
    throw new Error("Unknown unit balance profile.");
  if (!Number.isInteger(foodCost) || foodCost < 1 || foodCost > MAX_UNIT_FOOD)
    throw new Error(
      `Unit food cost must be an integer from 1 to ${MAX_UNIT_FOOD}.`,
    );
  for (const [name, value, min, max] of [
    ["speed", speed, 20, 60],
    ["range", range, 25, 260],
    ["cooldown", cooldown, 0.12, 2],
  ] as const) {
    if (!Number.isFinite(value) || value < min || value > max)
      throw new Error(`Unit ${name} must be between ${min} and ${max}.`);
  }
  const budget = foodCost ** foodExponent;
  const utility = utilityMultiplier(blueprint);
  const bias = BALANCE.healthBias[profile];
  const hp = Math.round((BALANCE.baseHp * budget * bias) / utility);
  const dps = (BALANCE.baseDps * budget) / (bias * utility);
  return {
    ...blueprint,
    cost: foodCost,
    unlockCost: unlockPrice(foodCost),
    hp: Math.max(1, hp),
    damage: Math.max(1, Math.round(dps * cooldown)),
  };
}

export function combatPower(unit: {
  hp: number;
  damage: number;
  cooldown: number;
}) {
  return Math.sqrt(
    ((unit.hp / BALANCE.baseHp) * (unit.damage / unit.cooldown)) /
      BALANCE.baseDps,
  );
}

export function foodEfficiency(unit: {
  hp: number;
  damage: number;
  cooldown: number;
  cost: number;
  range: number;
  speed: number;
}) {
  const power = combatPower(unit) * utilityMultiplier(unit);
  return power / unit.cost ** BALANCE.foodExponent;
}
