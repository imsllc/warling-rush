import assert from "node:assert/strict";
import test from "node:test";
import { initialProgress, decodeProgress, rewardBattle } from "../src/progress";
import { COIN_PACKS, grantCoinPurchase } from "../src/store";

test("four packs have the agreed prices, coins, and increasing value", () => {
  assert.deepEqual(
    COIN_PACKS.map((p) => p.coins),
    [500, 2500, 7500, 25000],
  );
  assert.deepEqual(
    COIN_PACKS.map((p) => p.price),
    ["$0.99", "$2.99", "$4.99", "$9.99"],
  );
  const value = COIN_PACKS.map((p) => p.coins / Number(p.price.slice(1)));
  value.slice(1).forEach((v, i) => assert.ok(v > value[i]));
});
test("credit saves the receipt with the coins and recovery cannot grant twice", () => {
  const before = { ...initialProgress(), coins: 123 };
  const receipt = {
    productId: COIN_PACKS[2].id,
    token: "test-purchase",
    quantity: 1,
  };
  const credited = grantCoinPurchase(before, receipt);
  assert.equal(credited.coins, 7623);
  assert.deepEqual(credited.army, before.army);
  assert.deepEqual(credited.unlockedUnits, before.unlockedUnits);
  const reloaded = decodeProgress(JSON.stringify(credited));
  assert.equal(grantCoinPurchase(reloaded, receipt), reloaded);
  const afterBattle = rewardBattle(reloaded, true, 100);
  assert.equal(grantCoinPurchase(afterBattle, receipt).coins, 7723);
});
test("repeated purchases use new tokens and quantities are honored", () => {
  const receipt = { productId: COIN_PACKS[0].id, token: "first", quantity: 2 };
  const first = grantCoinPurchase(initialProgress(), receipt);
  const second = grantCoinPurchase(first, {
    ...receipt,
    token: "second",
    quantity: 1,
  });
  assert.equal(first.coins, 1000);
  assert.equal(second.coins, 1500);
  assert.deepEqual(second.coinPurchaseTokens, ["first", "second"]);
});
test("unknown products, missing receipts, invalid quantities, and overflow are rejected", () => {
  const receipt = { productId: COIN_PACKS[0].id, token: "first", quantity: 1 };
  for (const invalid of [
    { ...receipt, productId: "fake" },
    { ...receipt, token: "" },
    ...[0, -1, 0.5, NaN, Infinity].map((quantity) => ({
      ...receipt,
      quantity,
    })),
  ])
    assert.throws(() => grantCoinPurchase(initialProgress(), invalid));
  assert.throws(() =>
    grantCoinPurchase(
      { ...initialProgress(), coins: Number.MAX_SAFE_INTEGER },
      receipt,
    ),
  );
  assert.throws(() =>
    decodeProgress(
      JSON.stringify({ ...initialProgress(), coinPurchaseTokens: [12] }),
    ),
  );
  assert.equal(decodeProgress(JSON.stringify(initialProgress())).coins, 0);
});
