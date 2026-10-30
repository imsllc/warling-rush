const fs = require("node:fs");
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
  const { drawCoinBundle } = require("../src/rendering/storeArt.ts");
  Module._load = original;
  const surface = Skia.Surface.Make(640, 170);
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color("#52617b"));
  for (let tier = 0; tier < 4; tier++) {
    canvas.save();
    canvas.translate(tier * 160 + 16, 25);
    drawCoinBundle(canvas, tier);
    canvas.restore();
  }
  surface.flush();
  fs.writeFileSync(
    "artifacts/store-icons.png",
    surface.makeImageSnapshot().encodeToBytes(),
  );
  const { COIN_PACKS } = require("../src/store.ts");
  fs.mkdirSync("artifacts/store-products", { recursive: true });
  for (const pack of COIN_PACKS) {
    const icon = Skia.Surface.Make(512, 512);
    const c = icon.getCanvas();
    c.clear(
      Skia.Color(["#627e91", "#726b98", "#948062", "#647e94"][pack.tier]),
    );
    c.translate(32, 60);
    c.scale(3.5, 3.5);
    drawCoinBundle(c, pack.tier);
    icon.flush();
    fs.writeFileSync(
      `artifacts/store-products/${pack.id}.png`,
      icon.makeImageSnapshot().encodeToBytes(),
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
