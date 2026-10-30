import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, Picture } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { World } from "../game/types";
import { step } from "../game/engine";
import { BATTLE } from "../game/config";
import { drawWorld } from "./draw";
import { playSound } from "../audio";
type Props = {
  world: World;
  paused: boolean;
  preview?: boolean;
  onTick?: () => void;
  onFrame?: () => void;
  onEnd?: () => void;
};
export function Battlefield({
  world,
  paused,
  preview,
  onTick,
  onFrame,
  onEnd,
}: Props) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const picture = useSharedValue(drawWorld(world, 1, 1));
  const callbacks = useRef({ onTick, onFrame, onEnd });
  callbacks.current = { onTick, onFrame, onEnd };
  useEffect(() => {
    if (paused) {
      picture.value = drawWorld(world, size.width, size.height);
      return;
    }
    let frame = 0,
      last = 0,
      accumulated = 0,
      uiTime = 0,
      ended = false;
    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      if (!paused && !preview) {
        accumulated += dt;
        while (accumulated >= BATTLE.fixedStep) {
          step(world, BATTLE.fixedStep, Math.random, playSound);
          accumulated -= BATTLE.fixedStep;
        }
      }
      if (preview && !paused) world.time += dt;
      callbacks.current.onFrame?.();
      picture.value = drawWorld(world, size.width, size.height);
      uiTime += dt;
      if (uiTime >= 0.1) {
        callbacks.current.onTick?.();
        uiTime = 0;
      }
      if (world.result && !ended) {
        ended = true;
        callbacks.current.onEnd?.();
        return;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [world, paused, preview, size.width, size.height, picture]);
  return (
    <View style={styles.fill} onLayout={(e) => setSize(e.nativeEvent.layout)}>
      <Canvas style={styles.fill}>
        <Picture picture={picture} />
      </Canvas>
      <View
        pointerEvents="none"
        accessibilityLabel={`player bunker health ${Math.ceil(world.bases.player)}`}
        style={[
          styles.health,
          { top: size.height * 0.52 + (22 * size.width) / BATTLE.width },
          { left: 8 },
        ]}
      >
        <View style={styles.healthTrack}>
          <View
            style={{
              height: "100%",
              width: `${(Math.max(0, world.bases.player) / BATTLE.baseHp) * 100}%`,
              backgroundColor: "#5ce1b9",
            }}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%", overflow: "hidden" },
  health: { position: "absolute", width: 52, alignItems: "center", gap: 2 },
  healthTrack: {
    width: "100%",
    height: 11,
    borderWidth: 2,
    borderColor: "#19212b",
    borderRadius: 3,
    backgroundColor: "#19212b",
    overflow: "hidden",
  },
});
