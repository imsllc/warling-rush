import React, { useMemo } from "react";
import { Canvas, Group, Picture, Skia } from "@shopify/react-native-skia";
import { drawCoinBundle } from "../rendering/storeArt";

export function CoinBundleIcon({ tier }: { tier: number }) {
  const picture = useMemo(() => {
    const recorder = Skia.PictureRecorder();
    drawCoinBundle(
      recorder.beginRecording(Skia.XYWHRect(0, 0, 128, 112)),
      tier,
    );
    return recorder.finishRecordingAsPicture();
  }, [tier]);
  return (
    <Canvas pointerEvents="none" style={{ width: 96, height: 84 }}>
      <Group transform={[{ scale: 0.75 }]}>
        <Picture picture={picture} />
      </Group>
    </Canvas>
  );
}
