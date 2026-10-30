import type { Progress } from "./progress";

export const COIN_PACKS = [
  {
    id: "coins_pouch_500",
    name: "Coin Pouch",
    coins: 500,
    price: "$0.99",
    tier: 0,
    value: "",
  },
  {
    id: "coins_bag_2500",
    name: "Coin Bag",
    coins: 2500,
    price: "$2.99",
    tier: 1,
    value: "1.7× VALUE",
  },
  {
    id: "coins_chest_7500",
    name: "Coin Chest",
    coins: 7500,
    price: "$4.99",
    tier: 2,
    value: "3× VALUE",
  },
  {
    id: "coins_vault_25000",
    name: "Coin Vault",
    coins: 25000,
    price: "$9.99",
    tier: 3,
    value: "BEST VALUE · 5×",
  },
] as const;
export type CoinPack = (typeof COIN_PACKS)[number];
export type CoinPurchase = {
  productId: string;
  token: string;
  quantity: number;
};

// Persist the receipt alongside the coins before consuming the Play purchase.
// A retry after a crash can finish consumption without granting coins twice.
export function grantCoinPurchase(
  progress: Progress,
  purchase: CoinPurchase,
): Progress {
  const pack = COIN_PACKS.find((item) => item.id === purchase.productId);
  if (
    !pack ||
    !purchase.token ||
    !Number.isSafeInteger(purchase.quantity) ||
    purchase.quantity < 1
  )
    throw new Error("Invalid coin purchase.");
  if (progress.coinPurchaseTokens?.includes(purchase.token)) return progress;
  const coins = progress.coins + pack.coins * purchase.quantity;
  if (!Number.isSafeInteger(coins))
    throw new Error("Coin balance is too large.");
  return {
    ...progress,
    coins,
    coinPurchaseTokens: [
      ...(progress.coinPurchaseTokens ?? []),
      purchase.token,
    ],
  };
}
