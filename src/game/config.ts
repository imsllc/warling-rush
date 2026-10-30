import { defineUnit, defineEnemyUnit, MAX_UNIT_FOOD } from "./balance";

// Choose food budget, archetype and attack style. The shared formula supplies
// health, damage per hit and unlock price; don't hand-enter those stats here.
const DARK_MAGE = defineUnit({
  name: "Dark Mage",
  role: "Fire spell caster",
  foodCost: 20,
  profile: "glassCannon",
  speed: 20,
  range: 200,
  cooldown: 1.4,
  projectile: "fireball",
});
export const UNITS = {
  clubman: defineUnit({
    name: "Clubman",
    role: "Frontline",
    foodCost: 1,
    profile: "balanced",
    speed: 39,
    range: 25,
    cooldown: 0.9,
    projectile: null,
  }),
  spearman: defineUnit({
    name: "Spearman",
    role: "Balanced reach",
    foodCost: 2,
    profile: "balanced",
    speed: 31,
    range: 48,
    cooldown: 1.15,
    projectile: null,
  }),
  rock: defineUnit({
    name: "Rock Thrower",
    role: "Ranged damage",
    foodCost: 3,
    profile: "damage",
    speed: 33,
    range: 185,
    cooldown: 1.4,
    projectile: "rock",
  }),
  stormblade: defineUnit({
    name: "Stormblade",
    role: "Giant sword melee",
    foodCost: 4,
    profile: "damage",
    speed: 35,
    range: 104,
    cooldown: 1.45,
    projectile: null,
  }),
  mech: defineUnit({
    name: "Mech",
    role: "Missile support",
    foodCost: 5,
    profile: "balanced",
    speed: 27,
    range: 250,
    cooldown: 1.8,
    projectile: "missile",
  }),
  machineGunner: defineUnit({
    name: "Machine Gunner",
    role: "Rapid-fire support",
    foodCost: 6,
    profile: "damage",
    speed: 34,
    range: 250,
    cooldown: 0.16,
    projectile: "bullet",
  }),
  basketballPlayer: defineUnit({
    name: "Basketball Player",
    role: "Arc-shot support",
    foodCost: 7,
    profile: "balanced",
    speed: 42,
    range: 230,
    cooldown: 1.05,
    projectile: "basketball",
  }),
  cannon: defineUnit({
    name: "Cannon",
    role: "Heavy artillery",
    foodCost: 8,
    profile: "damage",
    speed: 24,
    range: 260,
    cooldown: 2,
    projectile: "cannonball",
  }),
  shark: defineUnit({
    name: "Shark",
    role: "Melee biter",
    foodCost: 9,
    profile: "balanced",
    speed: 36,
    range: 35,
    cooldown: 0.85,
    projectile: null,
  }),
  tiger: defineUnit({
    name: "Tiger",
    role: "Eye-laser support",
    foodCost: 10,
    profile: "damage",
    speed: 24,
    range: 200,
    cooldown: 0.9,
    projectile: "laser",
  }),
  cyborgWalrus: defineUnit({
    name: "Cyborg Walrus",
    role: "Tusk melee tank",
    foodCost: 11,
    profile: "tank",
    speed: 28,
    range: 40,
    cooldown: 1.25,
    projectile: null,
  }),
  mafia: defineUnit({
    name: "Mafia",
    role: "Tommy-gun support",
    foodCost: 12,
    profile: "damage",
    speed: 20,
    range: 175,
    cooldown: 0.2,
    projectile: "bullet",
  }),
  rapper: defineUnit({
    name: "Rapper",
    role: "Musical-note support",
    foodCost: 13,
    profile: "balanced",
    speed: 20,
    range: 185,
    cooldown: 1.1,
    projectile: "note",
  }),
  barbarian: defineUnit({
    name: "Barbarian",
    role: "Heavy axe melee",
    foodCost: 14,
    profile: "damage",
    speed: 32,
    range: 45,
    cooldown: 1.4,
    projectile: null,
  }),
  spaceMarine: defineUnit({
    name: "Space Marine",
    role: "Armored gunner",
    foodCost: 15,
    profile: "balanced",
    speed: 20,
    range: 200,
    cooldown: 0.45,
    projectile: "bullet",
  }),
  duck: defineUnit({
    name: "Mallard Duck",
    role: "Melee pecker",
    foodCost: 16,
    profile: "balanced",
    speed: 34,
    range: 30,
    cooldown: 0.55,
    projectile: null,
  }),
  mig17: defineUnit({
    name: "MiG-17",
    role: "Jet missile support",
    foodCost: 17,
    profile: "damage",
    speed: 20,
    range: 230,
    cooldown: 1.8,
    projectile: "missile",
  }),
  gundam: defineUnit({
    name: "Gundam Warrior",
    role: "Beam sword melee",
    foodCost: 18,
    profile: "balanced",
    speed: 32,
    range: 55,
    cooldown: 1.15,
    projectile: null,
  }),
  skeletonKing: defineUnit({
    name: "Skeleton King",
    role: "Cursed sword melee",
    foodCost: 19,
    profile: "damage",
    speed: 30,
    range: 50,
    cooldown: 1.3,
    projectile: null,
  }),
  darkMage: DARK_MAGE,
  // Final unlock deliberately exceeds the normal food-budget progression.
  raccoon: {
    ...DARK_MAGE,
    name: "Jetpack Raccoon",
    role: "Elite airborne rifleman",
    foodCost: 21,
    cost: 21,
    unlockCost: 10000,
    hp: DARK_MAGE.hp * 5,
    damage: DARK_MAGE.damage,
    cooldown: DARK_MAGE.cooldown / 5,
    speed: 30,
    range: 240,
    projectile: "bullet",
  },
} as const;
export type UnitKind = keyof typeof UNITS;
export const RACCOON = {
  muzzleOffsetX: 77,
  muzzleY: -49,
  hoverY: -18,
} as const;
export function raccoonHover(time: number, id: number) {
  return Math.sin(time * 4 + id) * 2;
}
export const MAGE = {
  heightScale: 0.78,
  staffX: 39,
  staffY: -85 * 0.78,
  fireballSpeed: 320,
} as const;
export const MIG = {
  missileX: 22,
  missileY: -87,
} as const;
export const MARINE = {
  muzzleOffsetX: 58,
  muzzleY: -38,
} as const;
export const RAPPER = {
  micX: 32,
  micY: -44,
  noteSpeed: 300,
} as const;
export const TOMMY = {
  muzzleOffsetX: 50,
  muzzleY: -27,
} as const;
export const TIGER = {
  eyes: [
    { x: 28, y: -43 },
    { x: 37, y: -40 },
  ],
  laserSpeed: 1400,
} as const;
export const CANNON = {
  muzzleOffsetX: 43,
  muzzleY: -35,
  ballSpeed: 460,
} as const;
export const GUNNER = {
  muzzleOffsetX: 62,
  bulletSpeed: 1100,
  attackTime: 0.12,
} as const;
// Wave creatures are deliberately separate from the purchasable roster.
export const ENEMY_UNITS = {
  slimeArm: defineEnemyUnit({
    name: "Slime Bruiser",
    role: "Sword melee",
    foodCost: 1,
    profile: "balanced",
    speed: 39,
    range: 25,
    cooldown: 0.9,
    projectile: null,
  }),
  slimeThrower: defineEnemyUnit({
    name: "Slime Lobber",
    role: "Slime slingshot",
    foodCost: 3,
    profile: "damage",
    speed: 30,
    range: 185,
    cooldown: 1.4,
    projectile: "slime",
  }),
} as const;
export type SlimeKind = keyof typeof ENEMY_UNITS;
export const ENEMY_TACTICS = {
  armoredFromWave: 3,
  frailFromWave: 5,
  armorRangedDamage: 0.7,
  armorMeleeDamage: 1.3,
  frailHealth: 0.5,
} as const;
export const BOSS = {
  interval: 20,
  scale: 3,
  bodyRadius: 60,
  healthPerWaveArmy: 1.6,
  attackMultiplier: 5,
  cleaveTargets: 3,
  potionSplashRadius: 55,
  potionLaunchOffsetX: 85,
} as const;
export const PYRAMID = {
  healthMultiplier: 2.5,
  damageMultiplier: 2,
  chargeTime: 0.9,
  beamTime: 0.35,
  maxTargets: 5,
  eyeX: -5,
  eyeY: -36,
} as const;
export const BOSS_UNITS = {
  pyramid: {
    name: "The All-Seeing Eye",
    role: "Pyramid overlord",
    cost: 1,
    hp: 100,
    damage: 15,
    speed: 24,
    range: 360,
    cooldown: 2.2,
    projectile: null,
  },
  scientist: {
    name: "Professor Fizz",
    role: "Mad scientist boss",
    cost: 1,
    hp: 100,
    damage: 15,
    speed: 28,
    range: 240,
    cooldown: 1.8,
    projectile: "potion",
  },
  titan: {
    name: "Iron Titan",
    role: "Giant robot boss",
    cost: 1,
    hp: 100,
    damage: 15,
    speed: 28,
    range: 95,
    cooldown: 1.3,
    projectile: null,
  },
  ironback: {
    name: "Ironback",
    role: "Giant gorilla boss",
    cost: 1,
    hp: 100,
    damage: 15,
    speed: 28,
    range: 95,
    cooldown: 1.3,
    projectile: null,
  },
  dreadmaw: {
    name: "Dreadmaw",
    role: "Dinosaur boss",
    cost: 1,
    hp: 100,
    damage: 15,
    speed: 28,
    range: 95,
    cooldown: 1.3,
    projectile: null,
  },
} as const;
export type BossKind = keyof typeof BOSS_UNITS;
export type EnemyKind = SlimeKind | BossKind;
export type CombatKind = UnitKind | EnemyKind;
export const COMBAT_UNITS = { ...UNITS, ...ENEMY_UNITS, ...BOSS_UNITS };
export const isBossKind = (kind: CombatKind): kind is BossKind =>
  Object.hasOwn(BOSS_UNITS, kind);
export const isEnemyKind = (kind: CombatKind): kind is EnemyKind =>
  Object.hasOwn(ENEMY_UNITS, kind) || isBossKind(kind);
export const isRanged = (kind: CombatKind) =>
  kind === "pyramid" || COMBAT_UNITS[kind].projectile !== null;
export const BATTLE = {
  width: 1000,
  baseHp: 1000,
  playerBaseX: 65,
  enemySpawnX: 1080,
  playerAdvanceX: 940,
  startingFood: 2,
  foodPerSecond: 0.5,
  maxUnitFoodCost: MAX_UNIT_FOOD,
  maxEnemyUnits: 36,
  spacing: 23,
  fixedStep: 1 / 60,
};
export const AI = {
  firstSpawnDelay: 5,
  decisionInterval: 1.8,
  burstSize: 4,
  burstInterval: 0.9,
  starterBurstSize: 3,
  starterBurstInterval: 1.2,
  weights: {
    slimeArm: 5,
    slimeThrower: 2,
  },
};
export type UpgradeKind = "food" | "health" | "damage";
export const UPGRADES = {
  food: {
    name: "Full baskets",
    description: "Food production",
    baseCost: 60,
    growth: 1.55,
    bonus: 0.02,
    suffix: " food/s",
  },
  health: {
    name: "Thick hides",
    description: "All unit health",
    baseCost: 80,
    growth: 1.55,
    bonus: 0.1,
    suffix: "%",
  },
  damage: {
    name: "Sharper stones",
    description: "All unit damage",
    baseCost: 80,
    growth: 1.55,
    bonus: 0.1,
    suffix: "%",
  },
};
export const upgradeCost = (kind: UpgradeKind, level: number) =>
  Math.ceil(
    kind === "food"
      ? UPGRADES.food.baseCost * (level + 1) ** 1.35
      : UPGRADES[kind].baseCost * UPGRADES[kind].growth ** level,
  );

export const foodRate = (level: number) =>
  process.env.EXPO_PUBLIC_TEST_PREVIEW === "1"
    ? 5
    : Math.round((BATTLE.foodPerSecond + level * UPGRADES.food.bonus) * 100) /
      100;

export function foodRateLabel(level: number) {
  return `${foodRate(level).toFixed(2)}/s`;
}
