import { CombatKind, EnemyKind, UnitKind } from "./config";
import { ArmySlots } from "../army";
export type Side = "player" | "enemy";
export type AttackSound = "sword" | "throw";
export type AttackStyle = "melee" | "ranged";
export type EnemyTrait = "armored" | "frail";
export type Levels = { food: number; health: number; damage: number };
export type Unit = {
  id: number;
  kind: CombatKind;
  enemyTrait?: EnemyTrait;
  side: Side;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  damage: number;
  cooldown: number;
  attack: number;
  pendingMeleeTarget?: number | "player";
  hit: number;
  dead: number;
};
export type Projectile = {
  visualKind?: UnitKind;
  empowered?: boolean;
  kind:
    | "rock"
    | "axe"
    | "spear"
    | "missile"
    | "slime"
    | "potion"
    | "bullet"
    | "basketball"
    | "cannonball"
    | "laser"
    | "note"
    | "fireball";
  launchLane?: number;
  launchOffsetX?: number;
  launchOffsetY?: number;
  id: number;
  side: Side;
  x: number;
  startX: number;
  targetX: number;
  lane: number;
  target: number | "player";
  damage: number;
  age: number;
  duration: number;
};
export type Effect = {
  // Presentation metadata only; never read by combat or progression.
  visual?: { kind: Unit["kind"] | Projectile["kind"]; x: number };
  potion?: boolean;
  id: number;
  x: number;
  lane: number;
  age: number;
  damage: number;
};
export type Beam = {
  id: number;
  source: number;
  side: Side;
  startX: number;
  endX: number;
  launchLane: number;
  lane: number;
  damage: number;
  age: number;
  fired: boolean;
  targetBase: boolean;
};
export type World = {
  battleNumber: number;
  time: number;
  food: number;
  remainingEnemies: number;
  kills: number;
  coinsEarned: number;
  bases: { player: number };
  units: Unit[];
  projectiles: Projectile[];
  beams: Beam[];
  effects: Effect[];
  nextId: number;
  nextAI: number;
  burstSpawned: number;
  aiPlan?: EnemyKind;
  result: Side | null;
  levels: Levels;
  unlockedUnits: UnitKind[];
  army: ArmySlots;
};
