import { CombatKind, isBossKind, isEnemyKind } from "./config";
import { waveDifficulty } from "./waves";

export function enemyKillCoins(kind: CombatKind, wave: number): number {
  const difficulty = waveDifficulty(wave);
  if (!isEnemyKind(kind)) return 0;
  const rate = 10 + Math.floor((wave - 1) / 5);
  // A boss replaces the normal army, so it carries that army's coin reward.
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    isBossKind(kind) ? rate * difficulty.enemyCount : rate,
  );
}
