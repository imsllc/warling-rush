import test from "node:test";
import assert from "node:assert/strict";
import { initialProgress, decodeProgress } from "../src/progress";
import { settleBattleReward, doubleBattleReward } from "../src/battleRewards";

test("rewarded boost adds only this battle's reward and preserves battle statistics", () => {
  const start = { ...initialProgress(), coins: 10000 };
  const settled = settleBattleReward(start, true, 347, "battle-a");
  const doubled = doubleBattleReward(settled, "battle-a");
  assert.equal(doubled.coins, 10694);
  assert.equal(doubled.battles, 1);
  assert.equal(doubled.wins, 1);
  assert.equal(doubled.waveNumber, 2);
});
test("a zero-kill loss doubles the displayed minimum 50 reward", () => {
  const settled = settleBattleReward(initialProgress(), false, 0, "loss");
  const doubled = doubleBattleReward(settled, "loss");
  assert.equal(doubled.coins, 100);
  assert.equal(doubled.waveNumber, 1);
  assert.equal(doubled.wins, 0);
});
test("reward recovery after restart cannot credit the bonus twice", () => {
  const settled = settleBattleReward(initialProgress(), false, 120, "receipt");
  const recovered = doubleBattleReward(
    decodeProgress(JSON.stringify(settled)),
    "receipt",
  );
  const reloaded = decodeProgress(JSON.stringify(recovered));
  assert.equal(reloaded.coins, 240);
  assert.equal(doubleBattleReward(reloaded, "receipt"), reloaded);
});
test("an old ad entitlement cannot reward another battle", () => {
  const settled = settleBattleReward(initialProgress(), false, 50, "new");
  assert.throws(() => doubleBattleReward(settled, "old"));
  assert.throws(() => doubleBattleReward(initialProgress(), "old"));
  assert.equal(
    decodeProgress(JSON.stringify(initialProgress())).battleReward,
    undefined,
  );
});
