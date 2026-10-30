import React, { useMemo } from "react";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { UnitKind } from "../game/config";
import { soldier } from "../rendering/draw";
export function UnitPortrait({ kind }: { kind: UnitKind }) {
  const picture = useMemo(() => {
    const r = Skia.PictureRecorder(),
      c = r.beginRecording(Skia.XYWHRect(0, 0, 72, 64));
    c.translate(5, 7);
    const equipped =
      kind === "machineGunner" ||
      kind === "basketballPlayer" ||
      kind === "rapper";
    const scale =
      kind === "raccoon"
        ? 0.46
        : kind === "stormblade"
          ? 0.42
          : kind === "darkMage"
            ? 0.49
            : kind === "skeletonKing"
              ? 0.52
              : kind === "gundam"
                ? 0.46
                : kind === "mig17"
                  ? 0.48
                  : kind === "duck"
                    ? 0.66
                    : kind === "spaceMarine"
                      ? 0.58
                      : kind === "barbarian"
                        ? 0.5
                        : kind === "mafia"
                          ? 0.7
                          : kind === "cyborgWalrus"
                            ? 0.68
                            : kind === "tiger"
                              ? 0.66
                              : kind === "shark"
                                ? 0.68
                                : kind === "cannon"
                                  ? 0.6
                                  : kind === "mech"
                                    ? 0.69
                                    : equipped
                                      ? 0.78
                                      : 0.85;
    c.scale(scale, scale);
    soldier(
      c,
      {
        id: 1,
        kind,
        side: "player",
        x:
          kind === "raccoon"
            ? 52
            : kind === "stormblade"
              ? 49
              : kind === "darkMage"
                ? 43
                : kind === "skeletonKing"
                  ? 35
                  : kind === "gundam"
                    ? 40
                    : kind === "mig17"
                      ? 63
                      : kind === "duck"
                        ? 32
                        : kind === "spaceMarine"
                          ? 34
                          : kind === "barbarian"
                            ? 38
                            : kind === "mafia"
                              ? 25
                              : kind === "cyborgWalrus"
                                ? 36
                                : kind === "tiger"
                                  ? 44
                                  : kind === "shark"
                                    ? 43
                                    : kind === "cannon"
                                      ? 40
                                      : kind === "mech"
                                        ? 34
                                        : equipped
                                          ? 26
                                          : 20,
        lane: 0,
        hp: 100,
        maxHp: 100,
        damage: 1,
        cooldown: 0,
        attack: 0,
        hit: 0,
        dead: 0,
      },
      0,
      kind === "raccoon"
        ? 115
        : kind === "stormblade"
          ? 121
          : kind === "darkMage"
            ? 112
            : kind === "skeletonKing"
              ? 102
              : kind === "gundam"
                ? 119
                : kind === "mig17"
                  ? 143
                  : kind === "duck"
                    ? 73
                    : kind === "spaceMarine"
                      ? 88
                      : kind === "barbarian"
                        ? 106
                        : kind === "mafia"
                          ? 76
                          : kind === "cyborgWalrus"
                            ? 78
                            : kind === "tiger"
                              ? 66
                              : kind === "shark"
                                ? 65
                                : kind === "mech" || kind === "cannon"
                                  ? 75
                                  : equipped
                                    ? 66
                                    : 57,
    );
    return r.finishRecordingAsPicture();
  }, [kind]);
  return (
    <Canvas style={{ width: 72, height: 64 }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
