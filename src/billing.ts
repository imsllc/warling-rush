import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import type { CoinPurchase } from "./store";

export type StoreProduct = { id: string; price: string };
type BillingBridge = {
  products(): Promise<StoreProduct[]>;
  purchases(): Promise<CoinPurchase[]>;
  buy(id: string): Promise<{
    state: "purchased" | "pending" | "cancelled";
    purchases: CoinPurchase[];
  }>;
  consume(token: string): Promise<void>;
};
const bridge: BillingBridge | undefined =
  Platform.OS === "android" ? NativeModules.CoinBilling : undefined;
export function billing(): BillingBridge {
  if (!bridge)
    throw new Error(
      "Purchases are available in the Android app through Google Play.",
    );
  return bridge;
}
export function onPurchaseUpdated(listener: () => void) {
  if (!bridge) return () => {};
  const subscription = new NativeEventEmitter(
    NativeModules.CoinBilling,
  ).addListener("CoinPurchasesUpdated", listener);
  return () => subscription.remove();
}
