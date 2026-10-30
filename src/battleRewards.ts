import { Progress, rewardBattle } from "./progress";

export function settleBattleReward(
  progress: Progress,
  won: boolean,
  earned: number,
  id: string,
): Progress {
  if (!id) throw new Error("Missing battle reward ID.");
  return {
    ...rewardBattle(progress, won, earned),
    battleReward: { id, amount: Math.max(50, earned), doubled: false },
  };
}

export function doubleBattleReward(progress: Progress, id: string): Progress {
  const reward = progress.battleReward;
  if (!reward || reward.id !== id)
    throw new Error("Battle reward does not match.");
  if (reward.doubled) return progress;
  return {
    ...progress,
    coins: Math.min(Number.MAX_SAFE_INTEGER, progress.coins + reward.amount),
    battleReward: { ...reward, doubled: true },
  };
}
