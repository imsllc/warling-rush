import {
  AI,
  BOSS,
  BOSS_UNITS,
  ENEMY_UNITS,
  ENEMY_TACTICS,
  EnemyKind,
  BossKind,
  isBossKind,
  PYRAMID,
} from "./config";
import type { EnemyTrait } from "./types";

export function waveBurst(wave: number) {
  const size = wave === 1 ? AI.starterBurstSize : AI.burstSize;
  const interval = wave === 1 ? AI.starterBurstInterval : AI.burstInterval;
  return {
    size,
    interval,
    // A complete burst/rest cycle retains the old average spawn cadence.
    rest: size * AI.decisionInterval - (size - 1) * interval,
  };
}

export function enemyTraitForSpawn(
  kind: EnemyKind,
  wave: number,
  burstPosition: number,
): EnemyTrait | undefined {
  if (
    kind === "slimeArm" &&
    wave >= ENEMY_TACTICS.armoredFromWave &&
    burstPosition % 2 === 0
  )
    return "armored";
  if (
    kind === "slimeThrower" &&
    wave >= ENEMY_TACTICS.frailFromWave &&
    burstPosition % 2 === 1
  )
    return "frail";
  return undefined;
}

export const isBossWave = (wave: number) =>
  wave >= BOSS.interval && wave % BOSS.interval === 0;
const BOSS_SEQUENCE: readonly BossKind[] = [
  "dreadmaw",
  "ironback",
  "titan",
  "scientist",
  "pyramid",
];
export const bossForWave = (wave: number): BossKind | null =>
  isBossWave(wave)
    ? BOSS_SEQUENCE[(wave / BOSS.interval - 1) % BOSS_SEQUENCE.length]
    : null;
export const waveEnemyCount = (wave: number) => {
  const difficulty = waveDifficulty(wave);
  return isBossWave(wave) ? 1 : difficulty.enemyCount;
};

export const WAVE_SCALING = {
  startingCount: 12,
  growthPerWave: 0.08,
  difficultyExponent: 1.5,
  countShare: 0.4,
  healthShare: 0.65,
  attackShare: 0.55,
} as const;

export function waveDifficulty(wave: number) {
  if (!Number.isSafeInteger(wave) || wave < 1)
    throw new Error("Wave number must be a positive safe integer.");
  const strength =
    (1 + WAVE_SCALING.growthPerWave * (wave - 1)) **
    WAVE_SCALING.difficultyExponent;
  // Count × sqrt(health × attack) follows strength before count rounding.
  // Share .4 + (.65 + .55) / 2 = 1 keeps the combined curve at power 1.5.
  return {
    strength,
    enemyCount: Math.ceil(
      WAVE_SCALING.startingCount * strength ** WAVE_SCALING.countShare,
    ),
    healthMultiplier: strength ** WAVE_SCALING.healthShare,
    attackMultiplier: strength ** WAVE_SCALING.attackShare,
  };
}

export function enemyStats(kind: EnemyKind, wave: number, trait?: EnemyTrait) {
  const scaling = waveDifficulty(wave);
  if (isBossKind(kind)) {
    const bruiser = {
      hp: Math.round(ENEMY_UNITS.slimeArm.hp * scaling.healthMultiplier),
      damage: Math.round(
        ENEMY_UNITS.slimeArm.damage * scaling.attackMultiplier,
      ),
    };
    const lobberHp = Math.round(
      ENEMY_UNITS.slimeThrower.hp * scaling.healthMultiplier,
    );
    const averageHp =
      (bruiser.hp * AI.weights.slimeArm + lobberHp * AI.weights.slimeThrower) /
      (AI.weights.slimeArm + AI.weights.slimeThrower);
    return {
      ...BOSS_UNITS[kind],
      // A boss gets 60% more HP than the expected entire mixed slime army.
      hp: Math.round(
        averageHp *
          scaling.enemyCount *
          BOSS.healthPerWaveArmy *
          (kind === "pyramid" ? PYRAMID.healthMultiplier : 1),
      ),
      damage: Math.round(
        bruiser.damage *
          BOSS.attackMultiplier *
          (kind === "pyramid" ? PYRAMID.damageMultiplier : 1),
      ),
    };
  }
  const base = ENEMY_UNITS[kind];
  const hp = Math.round(base.hp * scaling.healthMultiplier);
  const damage = Math.round(base.damage * scaling.attackMultiplier);
  const frail = kind === "slimeThrower" && trait === "frail";
  return {
    ...base,
    // Trade health for damage, preserving the scaled HP × DPS budget before
    // integer rounding. Boss budgets always use the original base mixture.
    hp: frail ? Math.max(1, Math.round(hp * ENEMY_TACTICS.frailHealth)) : hp,
    damage: frail ? Math.round(damage / ENEMY_TACTICS.frailHealth) : damage,
  };
}
