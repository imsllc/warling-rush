import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COIN_PACKS, CoinPack, CoinPurchase } from "../store";
import { billing, onPurchaseUpdated, StoreProduct } from "../billing";
import { CoinBundleIcon } from "./CoinBundleIcon";
import { SoundPressable as Pressable } from "./SoundPressable";
import { colors } from "./theme";
import { GameIcon } from "./GameIcon";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

async function storeRequest<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error("Google Play is taking too long. Pull down to retry."),
            ),
          15000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function StoreScreen({
  visible,
  onGrant,
  onBusy,
}: {
  visible: boolean;
  onGrant: (purchase: CoinPurchase) => Promise<boolean>;
  onBusy: (busy: boolean) => void;
}) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const locked = useRef(false);
  const callbacks = useRef({ onGrant, onBusy });
  callbacks.current = { onGrant, onBusy };

  async function deliver(purchases: CoinPurchase[]) {
    let coins = 0;
    for (const purchase of purchases) {
      if (!(await callbacks.current.onGrant(purchase)))
        throw new Error(
          "Could not save your coins. Pull down to recover your purchase.",
        );
      await storeRequest(billing().consume(purchase.token));
      coins +=
        (COIN_PACKS.find((p) => p.id === purchase.productId)?.coins ?? 0) *
        purchase.quantity;
    }
    return coins;
  }
  async function run(task: () => Promise<void>, blockNavigation = false) {
    if (locked.current) return;
    locked.current = true;
    setWorking(true);
    if (blockNavigation) callbacks.current.onBusy(true);
    try {
      await task();
    } catch (error) {
      if (blockNavigation)
        Alert.alert(
          "Purchase",
          error instanceof Error
            ? error.message
            : "Store unavailable. Please try again.",
        );
    } finally {
      locked.current = false;
      setWorking(false);
      setBuying(null);
      if (blockNavigation) callbacks.current.onBusy(false);
    }
  }
  function refresh() {
    return run(async () => {
      // Price loading and recovery must not prevent each other from running.
      const [owned, catalog] = await Promise.allSettled([
        storeRequest(billing().purchases()),
        storeRequest(billing().products()),
      ]);
      if (catalog.status === "fulfilled") setProducts(catalog.value);
      if (owned.status === "fulfilled") await deliver(owned.value);
    });
  }
  useEffect(() => {
    void refresh();
    return onPurchaseUpdated(() => void refresh());
  }, []);
  useEffect(() => {
    if (visible) void refresh();
  }, [visible]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, []);
  function buy(pack: CoinPack) {
    void run(async () => {
      setBuying(pack.id);
      await deliver(await storeRequest(billing().purchases()));
      const result = await billing().buy(pack.id);
      if (result.state === "cancelled") return;
      if (result.state === "pending") {
        Alert.alert(
          "Payment pending",
          "Payment pending. Your coins will arrive once Google Play confirms payment.",
        );
        return;
      }
      if (!result.purchases.length)
        throw new Error(
          "Purchase is still processing. Pull down to check again.",
        );
      await deliver(result.purchases);
    }, true);
  }
  function recoverPurchases() {
    void run(async () => {
      await deliver(await storeRequest(billing().purchases()));
      Alert.alert(
        "Purchases checked",
        "All available completed purchases have been delivered. Previously delivered coin packs are stored in this game’s local save and cannot be restored after clearing app data.",
      );
    }, true);
  }
  return (
    <View style={[styles.screen, !visible && styles.hidden]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={working && !buying}
            onRefresh={() => void refresh()}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        <View style={styles.grid}>
          {COIN_PACKS.map((pack) => {
            const product = products.find((p) => p.id === pack.id);
            return (
              <View key={pack.id} style={styles.card}>
                <CoinBundleIcon tier={pack.tier} />
                <Text style={styles.name}>{pack.name}</Text>
                <View
                  style={styles.amountRow}
                  accessibilityLabel={pack.coins.toLocaleString() + " coins"}
                >
                  <GameIcon name="coin" size={20} />
                  <Text style={styles.amount}>
                    {pack.coins.toLocaleString()}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    "Buy " +
                    pack.coins.toLocaleString() +
                    " coins for " +
                    (product?.price ?? pack.price + " US reference price") +
                    (!product
                      ? ". Google Play confirms the price at checkout"
                      : "")
                  }
                  accessibilityState={{
                    disabled: working,
                    busy: buying === pack.id,
                  }}
                  disabled={working}
                  onPress={() => buy(pack)}
                  style={({ pressed }) => [
                    styles.buy,
                    pressed && styles.pressed,
                  ]}
                >
                  {buying === pack.id ? (
                    <ActivityIndicator color={colors.border} />
                  ) : (
                    <Text style={styles.price}>
                      {product?.price ?? pack.price}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recover purchases"
            disabled={working}
            onPress={recoverPurchases}
            style={styles.footerButton}
          >
            <Text style={styles.footerText}>Recover purchases</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy policy"
            onPress={() => setPrivacyOpen(true)}
            style={styles.footerButton}
          >
            <Text style={styles.footerText}>Privacy policy</Text>
          </Pressable>
          <Text style={styles.saveNotice}>
            Coins and progress are saved on this device. Clearing app data can
            lose delivered purchases.
          </Text>
        </View>
      </ScrollView>
      <PrivacyPolicyModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  footer: { width: "100%", maxWidth: 348, marginTop: 12, alignItems: "center" },
  footerButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  footerText: {
    color: colors.cream,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  saveNotice: {
    color: colors.cream,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  screen: { flex: 1 },
  hidden: { display: "none" },
  content: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    maxWidth: 348,
  },
  card: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#52617b",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: 9,
    padding: 10,
  },
  name: { color: colors.cream, fontWeight: "800", fontSize: 14, marginTop: 4 },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginVertical: 8,
  },
  amount: { color: colors.gold, fontWeight: "900", fontSize: 23 },
  buy: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a6e575",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#253c2d",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  price: { color: colors.border, fontWeight: "900", fontSize: 17 },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
});
