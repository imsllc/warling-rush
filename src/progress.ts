import { Levels } from "./game/types";
import { addToArmy, ArmySlots } from "./army";
import { UNITS, UnitKind, UpgradeKind, upgradeCost } from "./game/config";
// Recognize retired roster entries only while migrating existing local saves.
const retiredUnits = new Set([
  "axeman",
  "axeThrower",
  "spearThrower",
  "puncher",
  "swordsman",
]);
export type Progress = {
  version: 1;
  coins: number;
  levels: Levels;
  battles: number;
  waveNumber: number;
  wins: number;
  unlockedUnits: UnitKind[];
  army: ArmySlots;
  coinPurchaseTokens?: string[];
  battleReward?: { id: string; amount: number; doubled: boolean };
};
export const initialProgress = (): Progress => ({
  version: 1,
  coins: 0,
  levels: { food: 0, health: 0, damage: 0 },
  battles: 0,
  waveNumber: 1,
  wins: 0,
  unlockedUnits: ["clubman", "spearman", "rock"],
  army: ["clubman", "spearman", "rock"],
});
// Always apply a cumulative battle total to its starting balance. Re-saving a
// kill snapshot or the final result therefore cannot credit the same kill twice.
export function collectKillCoins(
  progress: Progress,
  earnedCoins: number,
): Progress {
  if (!Number.isSafeInteger(earnedCoins) || earnedCoins < 0)
    throw new Error("Earned coins must be a non-negative safe integer.");
  return {
    ...progress,
    coins: Math.min(Number.MAX_SAFE_INTEGER, progress.coins + earnedCoins),
  };
}
export function rewardBattle(
  progress: Progress,
  won: boolean,
  earnedCoins = 0,
): Progress {
  const collected = collectKillCoins(progress, earnedCoins);
  return {
    ...collected,
    // Kill snapshots stay unchanged; top up only when the wave ends.
    coins: Math.min(
      Number.MAX_SAFE_INTEGER,
      collected.coins + Math.max(0, 50 - earnedCoins),
    ),
    battles: progress.battles + 1,
    waveNumber: progress.waveNumber + (won ? 1 : 0),
    wins: progress.wins + (won ? 1 : 0),
  };
}
export function decodeProgress(raw: string | null): Progress {
  if (!raw) return initialProgress();
  const p = JSON.parse(raw);
  const integer = (n: unknown) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  if (
    p?.version !== 1 ||
    !integer(p.coins) ||
    !integer(p.battles) ||
    !integer(p.wins) ||
    !p.levels ||
    !["food", "health", "damage"].every(
      (k) => integer(p.levels[k]) && p.levels[k] <= 100,
    )
  )
    throw new Error("Saved progress is invalid.");
  const waveNumber = p.waveNumber === undefined ? p.battles + 1 : p.waveNumber;
  if (!Number.isSafeInteger(waveNumber) || waveNumber < 1)
    throw new Error("Saved wave number is invalid.");
  const unlockedUnits =
    p.unlockedUnits === undefined ? ["clubman"] : p.unlockedUnits;
  if (
    !Array.isArray(unlockedUnits) ||
    !unlockedUnits.includes("clubman") ||
    unlockedUnits.some(
      (k: unknown) =>
        typeof k !== "string" ||
        (!Object.hasOwn(UNITS, k) && !retiredUnits.has(k)),
    ) ||
    new Set(unlockedUnits).size !== unlockedUnits.length
  )
    throw new Error("Saved unit unlocks are invalid.");
  const army =
    p.army === undefined
      ? [
          unlockedUnits[0] ?? null,
          unlockedUnits[1] ?? null,
          unlockedUnits[2] ?? null,
        ]
      : p.army;
  if (
    !Array.isArray(army) ||
    army.length !== 3 ||
    army.some(
      (kind: unknown) => kind !== null && !unlockedUnits.includes(kind),
    ) ||
    new Set(army.filter((kind: unknown) => kind !== null)).size !==
      army.filter((kind: unknown) => kind !== null).length
  )
    throw new Error("Saved army is invalid.");
  const activeUnits = unlockedUnits.filter(
    (kind: string) => !retiredUnits.has(kind),
  );
  if (
    p.coinPurchaseTokens !== undefined &&
    (!Array.isArray(p.coinPurchaseTokens) ||
      p.coinPurchaseTokens.some(
        (token: unknown) => typeof token !== "string" || !token,
      ))
  )
    throw new Error("Saved purchase history is invalid.");
  if (
    p.battleReward !== undefined &&
    (!p.battleReward ||
      typeof p.battleReward.id !== "string" ||
      !p.battleReward.id ||
      !integer(p.battleReward.amount) ||
      p.battleReward.amount < 50 ||
      typeof p.battleReward.doubled !== "boolean")
  )
    throw new Error("Saved battle reward is invalid.");
  const activeArmy = army.map((kind: string | null) =>
    kind !== null && retiredUnits.has(kind) ? null : kind,
  );
  // If retirement emptied an equipped army, leave the starter ready to deploy.
  const migratedArmy =
    army.some((kind: string | null) => kind !== null) &&
    activeArmy.every((kind: string | null) => kind === null)
      ? (["clubman", null, null] as ArmySlots)
      : (activeArmy as ArmySlots);
  return { ...p, waveNumber, unlockedUnits: activeUnits, army: migratedArmy };
}
export function purchase(p: Progress, kind: UpgradeKind): Progress | null {
  const cost = upgradeCost(kind, p.levels[kind]);
  if (p.coins < cost || p.levels[kind] >= 100) return null;
  return {
    ...p,
    coins: p.coins - cost,
    levels: { ...p.levels, [kind]: p.levels[kind] + 1 },
  };
}

export function unlockUnit(p: Progress, kind: UnitKind): Progress | null {
  if (
    !Object.hasOwn(UNITS, kind) ||
    p.unlockedUnits.includes(kind) ||
    p.coins < UNITS[kind].unlockCost
  )
    return null;
  return {
    ...p,
    coins: p.coins - UNITS[kind].unlockCost,
    unlockedUnits: [...p.unlockedUnits, kind],
  };
}

export function equipUnit(p: Progress, kind: UnitKind): Progress | null {
  if (!p.unlockedUnits.includes(kind) || p.army.includes(kind)) return null;
  return { ...p, army: addToArmy(p.army, kind) };
}

export function removeFromArmy(p: Progress, slot: number): Progress | null {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2 || p.army[slot] === null)
    return null;
  const army: ArmySlots = [...p.army];
  army[slot] = null;
  return { ...p, army };
}
