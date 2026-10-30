import React, { useEffect, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SoundPressable as Pressable } from "./SoundPressable";
import { World } from "../game/types";
import { ENEMY_TACTICS, UNITS, UnitKind } from "../game/config";
import { isBossWave } from "../game/waves";
import { spawn } from "../game/units";
import { Battlefield } from "../rendering/Battlefield";
import { GameIcon } from "./GameIcon";
import { chrome, Resource } from "./chrome";
import { UnitPortrait } from "./UnitPortrait";
import { colors, radii } from "./theme";
import { useSharedValue } from "react-native-reanimated";
import { FillReveal } from "./FillReveal";
import { availableFoodProgress, foodProductionProgress } from "./foodProgress";
export type BattlePhase = "ready" | "playing" | "result";
export function BattleScreen({
  world,
  phase,
  hidden,
  onPlay,
  onEnd,
  onLeave,
  onEarnings,
  leaving,
  leaveError,
}: {
  world: World;
  phase: BattlePhase;
  hidden: boolean;
  onPlay: () => void;
  onEnd: () => void;
  onLeave: () => void;
  onEarnings: () => void;
  leaving: boolean;
  leaveError: string;
}) {
  const [paused, setPaused] = useState(false),
    [, setTick] = useState(0);
  const foodFill = useSharedValue(foodProductionProgress(world));
  const availableFood = useSharedValue(availableFoodProgress(world));
  function updateFoodFill() {
    foodFill.value = foodProductionProgress(world);
    availableFood.value = availableFoodProgress(world);
  }
  useEffect(() => {
    setPaused(false);
    updateFoodFill();
  }, [world]);
  useEffect(() => {
    const app = AppState.addEventListener("change", (state) => {
      if (state !== "active") setPaused(true);
    });
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (phase === "playing") {
        setPaused(true);
        return true;
      }
      return false;
    });
    return () => {
      app.remove();
      back.remove();
    };
  }, [phase]);
  function deploy(kind: UnitKind) {
    if (paused || hidden || phase !== "playing") return;
    spawn(world, "player", kind);
    updateFoodFill();
    setTick((n) => n + 1);
  }
  return (
    <View style={styles.fill}>
      <Battlefield
        world={world}
        paused={paused || hidden || phase !== "playing"}
        onFrame={updateFoodFill}
        onTick={() => {
          setTick((n) => n + 1);
          onEarnings();
        }}
        onEnd={onEnd}
      />
      {phase === "playing" && (
        <View
          pointerEvents="none"
          accessible
          accessibilityLabel={`${world.food} food`}
          style={styles.food}
        >
          <FillReveal amount={foodFill} style={styles.foodIcon}>
            <GameIcon name="meat" size={40} />
          </FillReveal>
          <Text style={styles.foodCount}>{world.food}</Text>
        </View>
      )}
      {phase === "playing" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pause battle"
          onPress={() => setPaused(true)}
          style={styles.pause}
        >
          <GameIcon name="pause" size={25} />
        </Pressable>
      )}
      {phase === "ready" && (
        <View pointerEvents="box-none" style={styles.start}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="FIGHT!"
            onPress={onPlay}
            style={({ pressed }) => [
              styles.fightButton,
              pressed && styles.fightPressed,
            ]}
          >
            <Text style={styles.startText}>FIGHT!</Text>
          </Pressable>
          {!isBossWave(world.battleNumber) &&
            world.battleNumber >= ENEMY_TACTICS.armoredFromWave && (
              <View pointerEvents="none" style={styles.tactics}>
                <View style={styles.tacticRow}>
                  <GameIcon name="shield" size={22} />
                  <Text style={styles.tacticText}>Melee breaks shields</Text>
                </View>
                {world.battleNumber >= ENEMY_TACTICS.frailFromWave && (
                  <View style={styles.tacticRow}>
                    <View style={styles.orangeMarker} />
                    <Text style={styles.tacticText}>
                      Orange: low health, heavy hits
                    </Text>
                  </View>
                )}
              </View>
            )}
        </View>
      )}
      {phase === "playing" && (
        <View style={styles.deployBar}>
          <View style={styles.cards}>
            {world.army.map((kind, slot) => {
              if (kind === null)
                return (
                  <View
                    key={`empty-${slot}`}
                    accessibilityLabel={`Army slot ${slot + 1} empty`}
                    style={[styles.unit, styles.emptyUnit]}
                  />
                );
              const disabled = world.food < UNITS[kind].cost || paused;
              return (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityLabel={`Deploy ${UNITS[kind].name}, ${UNITS[kind].cost} food`}
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={() => deploy(kind)}
                  style={[styles.unit, paused && { opacity: 0.45 }]}
                >
                  <FillReveal
                    amount={availableFood}
                    target={UNITS[kind].cost}
                    fillColor="#15b7ef"
                    style={styles.unitFill}
                    contentStyle={styles.unitContent}
                  >
                    <UnitPortrait kind={kind} />
                    <Resource icon="meat" value={UNITS[kind].cost} size={21} />
                  </FillReveal>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      <Modal
        transparent
        visible={paused && phase === "playing" && !hidden}
        animationType="fade"
        onRequestClose={() => {
          if (!leaving) setPaused(false);
        }}
      >
        <View style={chrome.scrim}>
          <View
            accessibilityViewIsModal
            style={[chrome.dialog, styles.pauseDialog]}
          >
            {!!leaveError && <Text style={chrome.error}>{leaveError}</Text>}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Leave battle"
                disabled={leaving}
                onPress={onLeave}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.leaveButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.dialogButtonText}>
                  {leaving ? "Saving…" : "Leave"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resume battle"
                disabled={leaving}
                onPress={() => setPaused(false)}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.resumeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.dialogButtonText}>Resume</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  food: {
    position: "absolute",
    top: 10,
    left: 64,
    right: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  foodCount: {
    color: colors.cream,
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: colors.border,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  foodIcon: { width: 40, height: 40 },
  pause: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.control,
  },
  start: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  fightButton: {
    width: 176,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e53935",
    borderRadius: radii.control,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: "#8f1d20",
  },
  fightPressed: {
    backgroundColor: "#c62828",
    transform: [{ translateY: 2 }],
  },
  startText: { fontSize: 36, fontWeight: "900", color: colors.cream },
  tactics: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.control,
    backgroundColor: colors.bg,
    gap: 6,
  },
  tacticRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  tacticText: { color: colors.cream, fontSize: 13, fontWeight: "700" },
  orangeMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#f58c42",
    borderWidth: 2,
    borderColor: "#ffd578",
    marginHorizontal: 2,
  },
  deployBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 115,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 18,
    paddingTop: 8,
    backgroundColor: colors.bg,
    borderTopWidth: 3,
    borderColor: colors.border,
  },
  cards: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 7 },
  unit: {
    flex: 1,
    minWidth: 64,
    marginTop: -30,
    backgroundColor: "#46535e",
    borderRadius: radii.control,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  unitFill: { width: "100%", borderRadius: radii.control - 2 },
  unitContent: { paddingBottom: 6 },
  emptyUnit: {
    height: 105,
    backgroundColor: "transparent",
    borderStyle: "dashed",
    opacity: 0.4,
  },
  pauseDialog: { maxWidth: 340, padding: 20 },
  actions: { width: "100%", flexDirection: "row", gap: 12 },
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
  leaveButton: { backgroundColor: "#db3f44" },
  resumeButton: { backgroundColor: "#28ad68" },
  dialogButtonText: { color: colors.cream, fontSize: 17, fontWeight: "900" },
  pressed: { opacity: 0.7 },
});
