const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
require("tsx/cjs");

async function main() {
  const kit = await require("canvaskit-wasm/bin/full/canvaskit.js")({
    wasmBinary: fs.readFileSync(
      require.resolve("canvaskit-wasm/bin/full/canvaskit.wasm"),
    ),
  });
  const {
    JsiSkApi,
  } = require("../node_modules/@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js");
  const Skia = JsiSkApi(kit);
  const original = Module._load;
  Module._load = function (id, ...args) {
    if (id === "@shopify/react-native-skia")
      return { Skia, PaintStyle: { Fill: 0, Stroke: 1 } };
    return original.call(this, id, ...args);
  };
  const { soldier } = require("../src/rendering/draw.ts");
  Module._load = original;
  const kinds = ["stormblade", "barbarian", "gundam", "skeletonKing"];
  const attacks = [0, 0.21, 0.17, 0.095];
  const surface = Skia.Surface.Make(1360, 1040);
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color("#41495d"));
  for (const [row, kind] of kinds.entries()) {
    for (const [column, attack] of attacks.entries()) {
      canvas.save();
      canvas.translate(110 + column * 340, 240 + row * 260);
      canvas.scale(1.7, 1.7);
      soldier(
        canvas,
        {
          id: 1,
          kind,
          side: "player",
          x: 0,
          lane: 0,
          hp: 100,
          maxHp: 100,
          damage: 1,
          cooldown: 0,
          attack,
          hit: 0,
          dead: 0,
        },
        0,
        0,
      );
      canvas.restore();
    }
  }
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, "../artifacts/melee-arm-swings.png");
  fs.writeFileSync(output, snapshot.encodeToBytes());
  snapshot.dispose();
  surface.dispose();
  const portraits = Skia.Surface.Make(288, 256);
  portraits.getCanvas().clear(Skia.Color("#41495d"));
  const framing = {
    stormblade: [0.42, 49, 121],
    barbarian: [0.5, 38, 106],
    gundam: [0.46, 40, 119],
    skeletonKing: [0.52, 35, 102],
  };
  for (const [row, kind] of kinds.entries()) {
    for (const [column, attack] of attacks.entries()) {
      const portrait = Skia.Surface.Make(72, 64);
      const pc = portrait.getCanvas();
      pc.clear(Skia.Color("#41495d"));
      const [scale, x, ground] = framing[kind];
      pc.translate(5, 7);
      pc.scale(scale, scale);
      soldier(
        pc,
        {
          id: 1,
          kind,
          side: "player",
          x,
          lane: 0,
          hp: 100,
          maxHp: 100,
          damage: 1,
          cooldown: 0,
          attack,
          hit: 0,
          dead: 0,
        },
        0,
        ground,
      );
      portrait.flush();
      const image = portrait.makeImageSnapshot();
      portraits.getCanvas().drawImage(image, column * 72, row * 64);
      image.dispose();
      portrait.dispose();
    }
  }
  portraits.flush();
  const portraitImage = portraits.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/melee-arm-portraits.png"),
    portraitImage.encodeToBytes(),
  );
  portraitImage.dispose();
  portraits.dispose();
  console.log(output);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
