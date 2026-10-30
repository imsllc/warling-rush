import React, { useRef, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SoundPressable as Pressable } from "./SoundPressable";
import { Progress } from "../progress";
import {
  UNITS,
  UnitKind,
  UPGRADES,
  foodRateLabel,
  upgradeCost,
} from "../game/config";
import { UnitPortrait } from "./UnitPortrait";
import { GameIcon } from "./GameIcon";
import { chrome, Resource } from "./chrome";
import { colors, radii } from "./theme";

const unitColors: Record<UnitKind, string> = {
  clubman: "#37b7df",
  spearman: "#efbb65",
  rock: "#cb9be4",
  stormblade: "#e3b75f",
  mech: "#92a7ad",
  machineGunner: "#8c9b63",
  basketballPlayer: "#9b75be",
  cannon: "#b89768",
  shark: "#7daac5",
  tiger: "#e7a256",
  cyborgWalrus: "#9da9b4",
  mafia: "#8e94a4",
  rapper: "#b38bd4",
  barbarian: "#bb8c63",
  spaceMarine: "#6495cf",
  duck: "#6fa584",
  mig17: "#a4bac6",
  gundam: "#6c8ed9",
  skeletonKing: "#8d77ac",
  darkMage: "#688cc9",
  raccoon: "#976ac1",
};

function Stats({
  kind,
  progress,
  compact = false,
}: {
  kind: UnitKind;
  progress: Progress;
  compact?: boolean;
}) {
  const unit = UNITS[kind];
  const damage = Math.round(
    unit.damage * (1 + progress.levels.damage * UPGRADES.damage.bonus),
  );
  return (
    <View style={[styles.stats, compact && styles.tightStats]}>
      <Resource
        dark
        icon="battle"
        value={damage}
        accessibilityLabel={`${damage} damage per hit`}
        size={19}
      />
      <Resource
        dark
        icon="heart"
        value={Math.round(
          unit.hp * (1 + progress.levels.health * UPGRADES.health.bonus),
        )}
        size={19}
      />
    </View>
  );
}

export function UpgradeScreen({
  progress,
  saving,
  error,
  onUnlock,
  onUse,
  onRemove,
  onFoodUpgrade,
}: {
  progress: Progress;
  saving: boolean;
  error: string;
  onUnlock: (kind: UnitKind) => Promise<boolean>;
  onUse: (kind: UnitKind) => Promise<boolean>;
  onRemove: (slot: number) => void;
  onFoodUpgrade: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = height < 720;
  const foodCost = upgradeCost("food", progress.levels.food);
  const foodMaxed = progress.levels.food >= 100;
  const canBuyFood = !saving && !foodMaxed && progress.coins >= foodCost;
  const unitList = useRef<FlatList<UnitKind>>(null);
  const scrollMetrics = useRef({ offset: 0, content: 0, viewport: 0 });
  const [scrollEdges, setScrollEdges] = useState({ up: false, down: false });
  function updateScrollEdges() {
    const { content, viewport, offset } = scrollMetrics.current;
    const max = Math.max(0, content - viewport);
    const clamped = Math.max(0, Math.min(max, offset));
    // In the inverted roster, offset zero is the cheapest end at the bottom.
    const up = max - clamped > 4;
    const down = clamped > 4;
    setScrollEdges((previous) =>
      previous.up === up && previous.down === down ? previous : { up, down },
    );
  }
  function jumpToEnd(top: boolean) {
    const { content, viewport } = scrollMetrics.current;
    unitList.current?.scrollToOffset({
      offset: top ? Math.max(0, content - viewport) : 0,
      animated: true,
    });
  }
  const [selected, setSelected] = useState<UnitKind | null>(null);
  const selectedOwned =
    selected !== null && progress.unlockedUnits.includes(selected);
  const canConfirm =
    selected !== null &&
    !saving &&
    (selectedOwned || progress.coins >= UNITS[selected].unlockCost);
  function closeSelection() {
    if (!saving) setSelected(null);
  }
  async function confirmSelection() {
    if (!selected || !canConfirm) return;
    if (await (selectedOwned ? onUse(selected) : onUnlock(selected)))
      setSelected(null);
  }
  const available = (Object.keys(UNITS) as UnitKind[])
    .filter((kind) => !progress.army.includes(kind))
    .sort((a, b) => UNITS[a].unlockCost - UNITS[b].unlockCost);
  return (
    <View style={styles.screen}>
      <View style={styles.collection}>
        {available.length ? (
          <FlatList
            ref={unitList}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={available}
            inverted
            scrollEventThrottle={16}
            onLayout={(event) => {
              scrollMetrics.current.viewport = event.nativeEvent.layout.height;
              updateScrollEdges();
            }}
            onContentSizeChange={(_, height) => {
              scrollMetrics.current.content = height;
              updateScrollEdges();
            }}
            onScroll={({ nativeEvent }) => {
              scrollMetrics.current = {
                offset: nativeEvent.contentOffset.y,
                content: nativeEvent.contentSize.height,
                viewport: nativeEvent.layoutMeasurement.height,
              };
              updateScrollEdges();
            }}
            keyExtractor={(kind) => kind}
            renderItem={({ item: kind }) => {
              const unit = UNITS[kind],
                unlocked = progress.unlockedUnits.includes(kind);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${unit.name}, ${unlocked ? "unlocked" : `locked, ${unit.unlockCost} coins`}`}
                  accessibilityState={{ disabled: saving }}
                  disabled={saving}
                  onPress={() => setSelected(kind)}
                  style={({ pressed }) => [
                    styles.unitBlock,
                    { backgroundColor: unitColors[kind] },
                    !unlocked && styles.locked,
                    pressed && styles.pressed,
                  ]}
                >
                  <UnitPortrait kind={kind} />
                  <Stats kind={kind} progress={progress} />
                  <View style={styles.costs}>
                    <Resource
                      dark
                      icon="coin"
                      value={unit.unlockCost}
                      size={20}
                    />
                    <Resource dark icon="meat" value={unit.cost} size={20} />
                  </View>
                  {!unlocked && (
                    <View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFillObject,
                        styles.lockedOverlay,
                      ]}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        ) : (
          <View style={styles.emptyList}>
            <Text style={styles.hint}>All units are in your army</Text>
          </View>
        )}
        {available.length > 0 && scrollEdges.up && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to top of unit list"
            hitSlop={8}
            onPress={() => jumpToEnd(true)}
            style={({ pressed }) => [
              styles.scrollJump,
              styles.scrollUp,
              pressed && styles.pressed,
            ]}
          >
            <GameIcon name="chevronUp" size={24} />
          </Pressable>
        )}
        {available.length > 0 && scrollEdges.down && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to bottom of unit list"
            hitSlop={8}
            onPress={() => jumpToEnd(false)}
            style={({ pressed }) => [
              styles.scrollJump,
              styles.scrollDown,
              pressed && styles.pressed,
            ]}
          >
            <GameIcon name="chevronDown" size={24} />
          </Pressable>
        )}
      </View>
      <View style={styles.foodUpgrade}>
        <GameIcon name="meat" size={38} />
        <Text
          accessibilityLabel={`Food production ${foodRateLabel(progress.levels.food)}`}
          style={styles.foodRate}
        >
          {foodRateLabel(progress.levels.food)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            foodMaxed
              ? "Food production fully upgraded"
              : `Upgrade food production by 0.02 per second for ${foodCost} coins`
          }
          accessibilityState={{ disabled: !canBuyFood }}
          disabled={!canBuyFood}
          onPress={onFoodUpgrade}
          style={({ pressed }) => [
            styles.foodBuy,
            !canBuyFood && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {foodMaxed ? (
            <Text style={styles.dialogButtonText}>MAX</Text>
          ) : (
            <Resource icon="coin" value={foodCost} size={23} />
          )}
        </Pressable>
      </View>
      <View
        style={[
          styles.armyPanel,
          { height: compact ? 190 : (width - 40) / 3 + 124 },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.armyContent,
            compact && styles.compactContent,
          ]}
        >
          <Text style={styles.armyTitle}>ARMY</Text>
          <View style={styles.armySlots}>
            {progress.army.map((kind, slot) => (
              <View
                key={slot}
                style={[styles.armyColumn, compact && styles.compactColumn]}
              >
                <View
                  accessibilityLabel={`Army slot ${slot + 1}: ${kind ? UNITS[kind].name : "empty"}`}
                  style={[
                    styles.armyPortrait,
                    compact && styles.compactPortrait,
                    kind
                      ? { backgroundColor: unitColors[kind] }
                      : styles.emptySlot,
                  ]}
                >
                  {kind ? (
                    <UnitPortrait kind={kind} />
                  ) : (
                    <Text style={styles.slotNumber}>{slot + 1}</Text>
                  )}
                  {kind && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${UNITS[kind].name} from slot ${slot + 1}`}
                      accessibilityState={{ disabled: saving }}
                      disabled={saving}
                      hitSlop={8}
                      onPress={() => onRemove(slot)}
                      style={({ pressed }) => [
                        styles.remove,
                        saving && styles.disabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      <GameIcon name="close" size={17} />
                    </Pressable>
                  )}
                </View>
                {kind ? (
                  <View style={styles.tightStats}>
                    <Stats kind={kind} progress={progress} compact />
                    <Resource
                      dark
                      icon="meat"
                      value={UNITS[kind].cost}
                      size={19}
                    />
                  </View>
                ) : (
                  <Text style={styles.hint}>Empty</Text>
                )}
              </View>
            ))}
          </View>
          {progress.army.every((kind) => kind === null) && (
            <Text style={styles.hint}>
              Use a unit above to build your army.
            </Text>
          )}
        </ScrollView>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Modal
        transparent
        visible={selected !== null}
        animationType="fade"
        onRequestClose={closeSelection}
      >
        <View style={chrome.scrim}>
          <View
            accessibilityViewIsModal
            style={[chrome.dialog, styles.selectionDialog]}
          >
            {selected && (
              <>
                {!selectedOwned && (
                  <Resource
                    icon="coin"
                    value={UNITS[selected].unlockCost}
                    size={34}
                  />
                )}
                <UnitPortrait kind={selected} />
                {error ? (
                  <Text accessibilityRole="alert" style={chrome.error}>
                    {error}
                  </Text>
                ) : null}
                <View style={styles.dialogActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                    accessibilityState={{ disabled: saving }}
                    disabled={saving}
                    onPress={closeSelection}
                    style={({ pressed }) => [
                      styles.dialogButton,
                      styles.cancelButton,
                      saving && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dialogButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={selectedOwned ? "Use" : "Unlock"}
                    accessibilityState={{ disabled: !canConfirm }}
                    disabled={!canConfirm}
                    onPress={() => void confirmSelection()}
                    style={({ pressed }) => [
                      styles.dialogButton,
                      styles.confirmButton,
                      !canConfirm && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dialogButtonText}>
                      {selectedOwned ? "Use" : "Unlock"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f0eee8" },
  collection: { flex: 1 },
  foodUpgrade: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    gap: 12,
  },
  foodRate: {
    flex: 1,
    textAlign: "center",
    color: colors.border,
    fontSize: 24,
    fontWeight: "900",
  },
  foodBuy: {
    minWidth: 106,
    minHeight: 48,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14b6ed",
    borderRadius: radii.control,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
  },
  scrollJump: {
    position: "absolute",
    left: "50%",
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 4,
  },
  scrollUp: { top: 6 },
  scrollDown: { bottom: 6 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  unitBlock: {
    borderRadius: radii.panel,
    marginVertical: 5,
    overflow: "hidden",
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  locked: { backgroundColor: "#d3d6d3", borderColor: "#a3aaa7" },
  lockedOverlay: { backgroundColor: "rgba(211, 214, 211, 0.45)" },
  stats: { gap: 5, alignItems: "center" },
  tightStats: { gap: 1, alignItems: "center" },
  costs: { gap: 5, minWidth: 58 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  emptyList: { flex: 1, alignItems: "center", justifyContent: "center" },
  armyPanel: {
    flex: 0,
  },
  armyContent: {
    flexGrow: 1,
    padding: 12,
    paddingBottom: 8,
    justifyContent: "flex-end",
    gap: 12,
  },
  armyTitle: {
    color: colors.border,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
  armySlots: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  armyColumn: { flex: 1, alignItems: "stretch", gap: 4 },
  armyPortrait: {
    borderRadius: radii.panel,
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptySlot: {
    backgroundColor: "#d5dbd3",
    borderColor: "#a1aca3",
    borderStyle: "dashed",
  },
  slotNumber: { color: "#98a399", fontSize: 26, fontWeight: "800" },
  hint: { color: "#65716b", fontSize: 12, textAlign: "center" },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#db3f44",
    borderWidth: 2,
    borderColor: "#8f3036",
  },
  error: { color: "#a32f3b", fontSize: 13, textAlign: "center", padding: 8 },
  compactContent: { padding: 8, gap: 8 },
  compactColumn: { gap: 4 },
  compactPortrait: { width: 64, height: 64, alignSelf: "center" },
  selectionDialog: { maxWidth: 340, padding: 20 },
  dialogActions: { width: "100%", flexDirection: "row", gap: 12 },
  dialogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: { backgroundColor: "#db3f44" },
  confirmButton: { backgroundColor: "#14b6ed" },
  dialogButtonText: { color: colors.cream, fontSize: 17, fontWeight: "900" },
});
