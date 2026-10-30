import React from "react";
import {
  Canvas,
  Circle,
  Group,
  Path,
  Line,
  RoundedRect,
} from "@shopify/react-native-skia";
export type IconName =
  | "coin"
  | "meat"
  | "battle"
  | "upgrade"
  | "store"
  | "video"
  | "heart"
  | "shield"
  | "lock"
  | "pause"
  | "close"
  | "chevronUp"
  | "chevronDown"
  | "check";
const ink = "#19212b";
export function GameIcon({
  name,
  size = 28,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Group transform={[{ scale: size / 40 }]}>
        {name === "video" && (
          <>
            <RoundedRect
              x={3}
              y={15}
              width={34}
              height={23}
              r={3}
              color={ink}
            />
            <Path
              path="M3 15 L1 8 Q1 6 3 5 L30 0 Q33 0 34 3 L35 8 Z"
              color={ink}
            />
            <Path
              path="M5 6 L9 5 L15 11 L11 12 Z M15 4 L19 3 L25 9 L21 10 Z M25 2 L29 1 L34 7 L30 8 Z M5 16 L11 16 L7 21 L3 21 Z M16 16 L22 16 L18 21 L12 21 Z M27 16 L33 16 L29 21 L23 21 Z"
              color="#ffffff"
            />
            <Path
              path="M16 25 Q16 24 17 24 L26 29 Q27 30 26 31 L17 36 Q16 36 16 35 Z"
              color="#ffffff"
            />
          </>
        )}
        {name === "coin" && (
          <>
            <Circle cx={20} cy={20} r={17} color={ink} />
            <Circle cx={20} cy={20} r={14} color="#ffca46" />
            <Circle
              cx={20}
              cy={20}
              r={10}
              color="#ffe48d"
              style="stroke"
              strokeWidth={2}
            />
            <Line
              p1={{ x: 20, y: 13 }}
              p2={{ x: 20, y: 27 }}
              color="#b47d22"
              strokeWidth={3}
              strokeCap="round"
            />
          </>
        )}
        {name === "meat" && (
          <>
            <Path
              path="M14 24 L6.5 31.5 C3.8 29.7 1 32 2 35 C2.4 36.8 4 37.6 5.7 37.2 C5.6 39.8 9.8 40 11.1 37.7 C12 36.2 11.8 34.6 10.6 33.6 L19 26 Z"
              color="#fff5de"
            />
            <Path
              path="M14 24 L6.5 31.5 C3.8 29.7 1 32 2 35 C2.4 36.8 4 37.6 5.7 37.2 C5.6 39.8 9.8 40 11.1 37.7 C12 36.2 11.8 34.6 10.6 33.6 L19 26 Z"
              color={ink}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
            />
            <Path
              path="M19 3 C13 6 11 14 10 20 C7 26 10 31 16 31 C21 30 23 29 28 28 C33 27 36 24 37 21 C40 13 29 0 21 2 Z"
              color="#bd6854"
            />
            <Path
              path="M19 3 C13 6 11 14 10 20 C7 26 10 31 16 31 C21 30 23 29 28 28 C33 27 36 24 37 21 C40 13 29 0 21 2 Z"
              color={ink}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
            />
            <Path
              path="M19 3 C25 0 34 8 37 16 C41 26 33 29 24 23 C16 18 12 7 19 3 Z"
              color="#e895a5"
            />
            <Path
              path="M19 3 C25 0 34 8 37 16 C41 26 33 29 24 23 C16 18 12 7 19 3 Z"
              color={ink}
              style="stroke"
              strokeWidth={2.5}
            />
            <Path
              path="M25 9 C28 8 32 12 32 15 C32 18 29 17 26 15 C23 13 22 10 25 9 Z"
              color="#fff5de"
            />
            <Path
              path="M25 9 C28 8 32 12 32 15 C32 18 29 17 26 15 C23 13 22 10 25 9 Z"
              color={ink}
              style="stroke"
              strokeWidth={2}
            />
          </>
        )}
        {name === "battle" && (
          <>
            <Path path="M7 3 L18 8 L30 26 L25 30 L9 13 Z" color="#dadfe2" />
            <Path
              path="M7 3 L18 8 L30 26 L25 30 L9 13 Z"
              color={ink}
              style="stroke"
              strokeWidth={2}
            />
            <Path path="M33 3 L22 8 L10 26 L15 30 L31 13 Z" color="#fff7d1" />
            <Path
              path="M33 3 L22 8 L10 26 L15 30 L31 13 Z"
              color={ink}
              style="stroke"
              strokeWidth={2}
            />
            {[false, true].map((right) => (
              <Group key={String(right)}>
                <Line
                  p1={{ x: right ? 29 : 11, y: 28 }}
                  p2={{ x: right ? 35 : 5, y: 36 }}
                  color={ink}
                  strokeWidth={7}
                  strokeCap="round"
                />
                <Line
                  p1={{ x: right ? 29 : 11, y: 28 }}
                  p2={{ x: right ? 35 : 5, y: 36 }}
                  color="#925b35"
                  strokeWidth={4}
                  strokeCap="round"
                />
              </Group>
            ))}
            <Line
              p1={{ x: 5, y: 24 }}
              p2={{ x: 16, y: 33 }}
              color="#bf8047"
              strokeWidth={5}
            />
            <Line
              p1={{ x: 24, y: 33 }}
              p2={{ x: 35, y: 24 }}
              color="#bf8047"
              strokeWidth={5}
            />
          </>
        )}
        {name === "store" && (
          <>
            <RoundedRect
              x={6}
              y={16}
              width={28}
              height={21}
              r={2}
              color="#ffcf50"
            />
            <RoundedRect
              x={6}
              y={16}
              width={28}
              height={21}
              r={2}
              color={ink}
              style="stroke"
              strokeWidth={2.5}
            />
            <Path path="M7 5 L33 5 L37 16 L3 16 Z" color="#fff9eb" />
            <Path
              path="M12 5 L17 5 L16 16 L9 16 Z M23 5 L28 5 L31 16 L24 16 Z"
              color="#ec947b"
            />
            <Path
              path="M7 5 L33 5 L37 16 L3 16 Z"
              color={ink}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
            />
            <RoundedRect
              x={11}
              y={22}
              width={8}
              height={9}
              r={1}
              color="#6ac5aa"
            />
            <RoundedRect
              x={23}
              y={22}
              width={7}
              height={15}
              r={1}
              color={ink}
            />
            <Line
              p1={{ x: 4, y: 37 }}
              p2={{ x: 36, y: 37 }}
              color={ink}
              strokeWidth={3}
              strokeCap="round"
            />
          </>
        )}
        {name === "upgrade" && (
          <>
            <Path
              path="M20 3 L37 19 L28 19 L28 36 L12 36 L12 19 L3 19 Z"
              color="#b2ef66"
            />
            <Path
              path="M20 3 L37 19 L28 19 L28 36 L12 36 L12 19 L3 19 Z"
              color={ink}
              style="stroke"
              strokeWidth={3}
              strokeJoin="round"
            />
          </>
        )}
        {name === "heart" && (
          <>
            <Path
              path="M20 35 C-7 18 5 -1 20 10 C35 -1 47 18 20 35 Z"
              color="#ff647b"
            />
            <Path
              path="M20 35 C-7 18 5 -1 20 10 C35 -1 47 18 20 35 Z"
              color={ink}
              style="stroke"
              strokeWidth={3}
            />
          </>
        )}
        {name === "shield" && (
          <>
            <Path
              path="M20 3 L35 9 L33 25 L20 37 L7 25 L5 9 Z"
              color="#b5cbd7"
            />
            <Path
              path="M20 3 L35 9 L33 25 L20 37 L7 25 L5 9 Z"
              color={ink}
              style="stroke"
              strokeWidth={3}
            />
            <Path
              path="M20 8 L20 30"
              color="#718d9e"
              style="stroke"
              strokeWidth={3}
            />
          </>
        )}
        {name === "lock" && (
          <>
            <Path
              path="M11 19 L11 12 C11 0 29 0 29 12 L29 19"
              color={ink}
              style="stroke"
              strokeWidth={5}
            />
            <RoundedRect
              x={5}
              y={17}
              width={30}
              height={21}
              r={4}
              color={ink}
            />
            <Circle cx={20} cy={26} r={3} color="#aab1c0" />
            <Line
              p1={{ x: 20, y: 26 }}
              p2={{ x: 20, y: 32 }}
              color="#aab1c0"
              strokeWidth={3}
            />
          </>
        )}
        {name === "pause" && (
          <>
            <RoundedRect
              x={9}
              y={7}
              width={7}
              height={26}
              r={2}
              color="#fff9eb"
            />
            <RoundedRect
              x={24}
              y={7}
              width={7}
              height={26}
              r={2}
              color="#fff9eb"
            />
          </>
        )}
        {name === "close" && (
          <>
            <Line
              p1={{ x: 10, y: 10 }}
              p2={{ x: 30, y: 30 }}
              color="#fff9eb"
              strokeWidth={5}
              strokeCap="round"
            />
            <Line
              p1={{ x: 30, y: 10 }}
              p2={{ x: 10, y: 30 }}
              color="#fff9eb"
              strokeWidth={5}
              strokeCap="round"
            />
          </>
        )}
        {(name === "chevronUp" || name === "chevronDown") && (
          <Path
            path={
              name === "chevronUp"
                ? "M10 25 L20 15 L30 25"
                : "M10 15 L20 25 L30 15"
            }
            color="#fff9eb"
            style="stroke"
            strokeWidth={5}
            strokeCap="round"
            strokeJoin="round"
          />
        )}
        {name === "check" && (
          <Path
            path="M7 20 L16 29 L33 10"
            color="#b2ef66"
            style="stroke"
            strokeWidth={5}
            strokeCap="round"
            strokeJoin="round"
          />
        )}
      </Group>
    </Canvas>
  );
}
