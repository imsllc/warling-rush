import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createWorld } from "./src/game/engine";
import { isBossWave } from "./src/game/waves";
import { UnitKind } from "./src/game/config";
import { World } from "./src/game/types";
import {
  initialProgress,
  collectKillCoins,
  Progress,
  equipUnit,
  purchase,
  removeFromArmy,
  unlockUnit,
} from "./src/progress";
import { loadProgress, saveProgress } from "./src/storage";
import { BattlePhase, BattleScreen } from "./src/ui/BattleScreen";
import { UpgradeScreen } from "./src/ui/UpgradeScreen";
import { BottomNav, chrome, GameButton, Resource, Tab } from "./src/ui/chrome";
import { colors, ui } from "./src/ui/theme";
import { startGameAudio } from "./src/audio";
import { StoreScreen } from "./src/ui/StoreScreen";
import { CoinPurchase, grantCoinPurchase } from "./src/store";
import { settleBattleReward, doubleBattleReward } from "./src/battleRewards";
import { rewardAds } from "./src/ads";
import { RewardedBonusButton } from "./src/ui/RewardedBonusButton";
import { SoundPressable } from "./src/ui/SoundPressable";
import { GameIcon } from "./src/ui/GameIcon";
function Game() {
  useEffect(startGameAudio, []);
  const [tab, setTab] = useState<Tab>("battle"),
    [phase, setPhase] = useState<BattlePhase>("ready");
  const [progress, setProgress] = useState(initialProgress),
    [loaded, setLoaded] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [world, setWorld] = useState<World>(() =>
    createWorld(initialProgress().levels),
  );
  const busy = useRef(false),
    finished = useRef(false),
    pendingReward = useRef<Progress | null>(null);
  const [rewardSaved, setRewardSaved] = useState(false);
  const [bonusDoubled, setBonusDoubled] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const adBusyRef = useRef(false);
  const bonusPendingRef = useRef(false);
  const battleStart = useRef(initialProgress());
  const bankedCoins = useRef(0);
  const coinSave = useRef<Promise<boolean> | null>(null);
  const nextCoinSave = useRef(0);
  const settling = useRef(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [storeBusy, setStoreBusy] = useState(false);
  const storeBusyRef = useRef(false);
  const progressRef = useRef(progress);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  function storeWorking(value: boolean) {
    storeBusyRef.current = value;
    setStoreBusy(value);
  }
  async function grantPurchase(receipt: CoinPurchase) {
    if (phaseRef.current !== "ready" || busy.current) return false;
    const next = grantCoinPurchase(progressRef.current, receipt);
    return next === progressRef.current || commit(next);
  }
  async function load() {
    try {
      let saved = await loadProgress();
      const pendingAdReward = await rewardAds?.pendingReward();
      if (pendingAdReward) {
        if (saved.battleReward?.id === pendingAdReward) {
          saved = doubleBattleReward(saved, pendingAdReward);
          await saveProgress(saved);
        }
        await rewardAds?.clearReward(pendingAdReward);
      }
      setProgress(saved);
      progressRef.current = saved;
      setWorld(
        createWorld(
          saved.levels,
          saved.unlockedUnits,
          saved.army,
          saved.waveNumber,
        ),
      );
      setLoaded(true);
      setError("");
    } catch {
      setError("Could not load your tribe. Retry to keep saved progress safe.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (loaded && rewardAds)
      void rewardAds
        .prepare()
        .then((status) => setPrivacyRequired(status.privacyRequired))
        .catch(() => {});
  }, [loaded]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && phase === "playing") void bankKillCoins(true);
    });
    return () => subscription.remove();
  }, [world, phase]);
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (storeBusyRef.current || adBusyRef.current) return true;
      if (tab !== "battle") {
        setTab("battle");
        return true;
      }
      return false;
    });
    return () => back.remove();
  }, [tab]);
  async function commit(next: Progress) {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await saveProgress(next);
      progressRef.current = next;
      setProgress(next);
      return true;
    } catch {
      setError("Could not save. Please retry.");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function play() {
    if (busy.current || storeBusyRef.current) return;
    if (progress.army.every((kind) => kind === null)) {
      setTab("upgrades");
      return;
    }
    finished.current = false;
    battleStart.current = progress;
    bankedCoins.current = 0;
    nextCoinSave.current = 0;
    setEarnedCoins(0);
    setLeaveError("");
    pendingReward.current = null;
    setRewardSaved(false);
    setBonusDoubled(false);
    bonusPendingRef.current = false;
    setError("");
    setWorld(
      createWorld(
        progress.levels,
        progress.unlockedUnits,
        progress.army,
        progress.waveNumber,
      ),
    );
    setPhase("playing");
    setTab("battle");
  }
  async function bankKillCoins(force = false): Promise<boolean> {
    if (coinSave.current) {
      if (!force) return coinSave.current;
      await coinSave.current;
    }
    if (finished.current || world.coinsEarned <= bankedCoins.current)
      return true;
    if (!force && Date.now() < nextCoinSave.current) return false;
    nextCoinSave.current = Date.now() + 1000;
    const amount = world.coinsEarned;
    const task = (async () => {
      const saved = await commit(collectKillCoins(battleStart.current, amount));
      if (saved) bankedCoins.current = amount;
      return saved;
    })();
    coinSave.current = task;
    try {
      return await task;
    } finally {
      if (coinSave.current === task) coinSave.current = null;
    }
  }
  function updateEarnings() {
    setEarnedCoins(world.coinsEarned);
    if (!finished.current) void bankKillCoins();
  }
  async function leave() {
    if (leaving || finished.current) return;
    finished.current = true;
    setLeaving(true);
    setLeaveError("");
    await coinSave.current;
    const next = collectKillCoins(battleStart.current, world.coinsEarned);
    if (!(await commit(next))) {
      finished.current = false;
      setLeaving(false);
      setLeaveError("Could not save earned coins. Tap Leave to retry.");
      return;
    }
    setWorld(
      createWorld(next.levels, next.unlockedUnits, next.army, next.waveNumber),
    );
    setPhase("ready");
    setLeaving(false);
  }
  async function saveReward() {
    if (settling.current || !pendingReward.current) return;
    settling.current = true;
    try {
      await coinSave.current;
      if (await commit(pendingReward.current)) setRewardSaved(true);
    } finally {
      settling.current = false;
    }
  }
  async function finish() {
    if (finished.current || !world.result) return;
    finished.current = true;
    pendingReward.current = settleBattleReward(
      battleStart.current,
      world.result === "player",
      world.coinsEarned,
      `${Date.now().toString(36)}-${battleStart.current.battles + 1}`,
    );
    setEarnedCoins(Math.max(50, world.coinsEarned));
    setRewardSaved(false);
    setPhase("result");
    setTab("battle");
    await saveReward();
  }
  function closeReward() {
    if (
      rewardSaved &&
      !busy.current &&
      !adBusyRef.current &&
      !bonusPendingRef.current
    ) {
      const nextBattle = progress.waveNumber;
      setPhase("ready");
      setWorld(
        createWorld(
          progress.levels,
          progress.unlockedUnits,
          progress.army,
          nextBattle,
        ),
      );
    }
  }
  async function saveDoubleBonus() {
    const id = progressRef.current.battleReward?.id;
    if (!id || !rewardAds) return;
    const next = doubleBattleReward(progressRef.current, id);
    if (next !== progressRef.current && !(await commit(next))) return;
    pendingReward.current = progressRef.current;
    try {
      await rewardAds.clearReward(id);
    } catch {
      setError("Could not finish saving the bonus. Please retry.");
      return;
    }
    bonusPendingRef.current = false;
    setBonusDoubled(true);
    setEarnedCoins(Math.max(50, world.coinsEarned) * 2);
    setError("");
  }
  async function watchDoubleReward() {
    const record = progressRef.current.battleReward;
    if (
      !rewardAds ||
      !rewardSaved ||
      adBusyRef.current ||
      busy.current ||
      !record ||
      record.doubled
    )
      return;
    adBusyRef.current = true;
    setAdBusy(true);
    try {
      if (await rewardAds.show(record.id)) {
        bonusPendingRef.current = true;
        await saveDoubleBonus();
      }
    } catch (cause) {
      Alert.alert(
        "Ad unavailable",
        cause instanceof Error ? cause.message : "Please try again later.",
      );
    } finally {
      adBusyRef.current = false;
      setAdBusy(false);
    }
  }
  async function retryResultSave() {
    if (!bonusPendingRef.current) {
      await saveReward();
      return;
    }
    if (adBusyRef.current) return;
    adBusyRef.current = true;
    setAdBusy(true);
    try {
      await saveDoubleBonus();
    } finally {
      adBusyRef.current = false;
      setAdBusy(false);
    }
  }
  async function showPrivacy() {
    if (!rewardAds || adBusyRef.current) return;
    try {
      const status = await rewardAds.privacy();
      setPrivacyRequired(status.privacyRequired);
    } catch (cause) {
      Alert.alert(
        "Privacy choices",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  }
  async function changePreparation(next: Progress | null) {
    if (phase !== "ready" || !next) return false;
    if (await commit(next)) {
      setWorld(
        createWorld(
          next.levels,
          next.unlockedUnits,
          next.army,
          next.waveNumber,
        ),
      );
      return true;
    }
    return false;
  }
  async function unlock(kind: UnitKind) {
    const next = unlockUnit(progress, kind);
    return next ? commit(next) : false;
  }
  if (!loaded)
    return (
      <View style={[ui.screen, styles.loading]}>
        <Text style={chrome.dialogTitle}>Warling Rush</Text>
        {error ? (
          <>
            <Text style={chrome.error}>{error}</Text>
            <GameButton label="Retry" onPress={() => void load()} />
          </>
        ) : (
          <ActivityIndicator color={colors.gold} />
        )}
      </View>
    );
  const amount = Math.max(50, world.coinsEarned) * (bonusDoubled ? 2 : 1);
  const battleNumber = world.battleNumber;
  return (
    <View style={ui.screen}>
      <View style={chrome.header}>
        <Resource
          icon="coin"
          value={
            phase === "ready"
              ? progress.coins
              : collectKillCoins(battleStart.current, earnedCoins).coins
          }
          size={26}
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[chrome.title, styles.headerTitle]}
        >
          {tab === "battle"
            ? `${isBossWave(battleNumber) ? "BOSS · " : ""}Wave ${battleNumber}/100`
            : tab === "upgrades"
              ? "Upgrades"
              : "Store"}
        </Text>
        {privacyRequired && phase !== "playing" && (
          <SoundPressable
            accessibilityRole="button"
            accessibilityLabel="Ad privacy choices"
            onPress={() => void showPrivacy()}
            style={styles.privacyButton}
          >
            <GameIcon name="shield" size={24} />
          </SoundPressable>
        )}
      </View>
      <View style={[styles.content, tab !== "battle" && { display: "none" }]}>
        <BattleScreen
          world={world}
          phase={phase}
          hidden={tab !== "battle"}
          onPlay={play}
          onEnd={() => void finish()}
          onLeave={() => void leave()}
          onEarnings={updateEarnings}
          leaving={leaving}
          leaveError={leaveError}
        />
      </View>
      {tab === "upgrades" && (
        <UpgradeScreen
          progress={progress}
          saving={saving}
          error={error}
          onUnlock={unlock}
          onUse={(kind) => changePreparation(equipUnit(progress, kind))}
          onRemove={(slot) =>
            void changePreparation(removeFromArmy(progress, slot))
          }
          onFoodUpgrade={() =>
            void changePreparation(purchase(progress, "food"))
          }
        />
      )}
      {phase === "ready" && (
        <StoreScreen
          visible={tab === "store"}
          onGrant={grantPurchase}
          onBusy={storeWorking}
        />
      )}
      {phase !== "playing" && (
        <View style={tab === "battle" ? styles.battleNavigation : undefined}>
          <BottomNav
            tab={tab}
            onChange={setTab}
            disabled={phase === "result" || saving || storeBusy}
          />
        </View>
      )}

      <Modal
        transparent
        visible={phase === "result"}
        animationType="fade"
        onRequestClose={closeReward}
      >
        <View style={chrome.scrim}>
          <View style={chrome.dialog}>
            <Text style={styles.resultLabel}>
              {world.result === "player" ? "VICTORY" : "BATTLE OVER"}
            </Text>
            <Text style={chrome.dialogTitle}>Collected</Text>
            <View style={styles.divider} />
            <Resource icon="coin" value={`+${amount}`} size={50} />
            <Text style={chrome.text}>{world.kills} enemies defeated</Text>
            {saving ? (
              <ActivityIndicator color={colors.gold} />
            ) : error ? (
              <>
                <Text accessibilityRole="alert" style={chrome.error}>
                  {error}
                </Text>
                <GameButton
                  label="Retry saving"
                  onPress={() => void retryResultSave()}
                />
              </>
            ) : (
              <>
                {!!rewardAds && !bonusDoubled && (
                  <RewardedBonusButton
                    amount={Math.max(50, world.coinsEarned)}
                    busy={adBusy}
                    disabled={!rewardSaved || adBusy}
                    onPress={() => void watchDoubleReward()}
                  />
                )}
                <GameButton
                  label="Continue"
                  style={chrome.resultAction}
                  disabled={!rewardSaved || adBusy || bonusPendingRef.current}
                  onPress={closeReward}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SafeAreaView style={ui.screen}>
        <Game />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  privacyButton: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  battleNavigation: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 20,
  },
  headerTitle: {
    position: "absolute",
    left: 110,
    right: 110,
    textAlign: "center",
  },
  resultLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  divider: {
    height: 2,
    backgroundColor: colors.border,
    width: "100%",
    marginBottom: 8,
  },
});
