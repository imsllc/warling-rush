// Deterministic launcher packaging: preserve the complete source and its spacing.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const Jimp = require("jimp-compact");
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets/icons");
const res = path.join(root, "android/app/src/main/res");
const artifacts = path.join(root, "artifacts");
const artworkSize = 800;
const paddingSize = (1024 - artworkSize) / 2;

async function main() {
  fs.mkdirSync(assets, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
  const source = await Jimp.read(path.join(root, "app_icon2.jpg"));
  assert.equal(
    source.bitmap.width,
    source.bitmap.height,
    "Keep source aspect ratio",
  );
  const bg = source.getPixelColor(0, 0);
  const rgb = Jimp.intToRGBA(bg);
  const foreground = new Jimp(1024, 1024, 0x00000000);
  foreground.composite(
    source.clone().resize(artworkSize, artworkSize),
    paddingSize,
    paddingSize,
  );
  const background = new Jimp(1024, 1024, bg);
  // Extract a themed silhouette without trimming or changing source spacing.
  const monoArt = source.clone();
  monoArt.scan(
    0,
    0,
    monoArt.bitmap.width,
    monoArt.bitmap.height,
    function (x, y, i) {
      const d = this.bitmap.data;
      const delta = Math.max(
        Math.abs(d[i] - rgb.r),
        Math.abs(d[i + 1] - rgb.g),
        Math.abs(d[i + 2] - rgb.b),
      );
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (delta - 35) / 35)));
    },
  );
  const monochrome = new Jimp(1024, 1024, 0x00000000);
  monochrome.composite(
    monoArt.resize(artworkSize, artworkSize),
    paddingSize,
    paddingSize,
  );
  await foreground.writeAsync(path.join(assets, "adaptive-foreground.png"));
  await background.writeAsync(path.join(assets, "adaptive-background.png"));
  await monochrome.writeAsync(path.join(assets, "adaptive-monochrome.png"));
  const composed = background.clone().composite(foreground, 0, 0);
  await composed
    .clone()
    .crop(171, 171, 682, 682)
    .resize(1024, 1024)
    .writeAsync(path.join(assets, "app-icon.png"));
  const themed = new Jimp(1024, 1024, 0xdce8ffff);
  const tint = monochrome.clone();
  tint.scan(0, 0, 1024, 1024, function (x, y, i) {
    this.bitmap.data[i] = 23;
    this.bitmap.data[i + 1] = 50;
    this.bitmap.data[i + 2] = 81;
  });
  themed.composite(tint, 0, 0);
  const preview = new Jimp(1140, 850, 0x202938ff);
  for (const [row, input] of [composed, themed].entries()) {
    const y0 = row === 0 ? 55 : 455;
    for (let n = 0; n < 3; n++) {
      // Resting adaptive viewport is the central 72 dp of each 108 dp layer.
      const tile = input.clone().crop(171, 171, 682, 682).resize(280, 280);
      tile.scan(0, 0, 280, 280, function (x, y, i) {
        const a = Math.abs((x + 0.5 - 140) / 140),
          b = Math.abs((y + 0.5 - 140) / 140);
        const inside =
          n === 0
            ? a * a + b * b <= 1
            : n === 1
              ? a ** 4 + b ** 4 <= 1
              : Math.max(0, Math.abs(x + 0.5 - 140) - 90) ** 2 +
                  Math.max(0, Math.abs(y + 0.5 - 140) - 90) ** 2 <=
                50 ** 2;
        if (!inside) this.bitmap.data[i + 3] = 0;
      });
      preview.composite(tile, 50 + n * 380, y0);
    }
  }
  await preview.writeAsync(path.join(artifacts, "adaptive-icon-previews.png"));
  const padding = new Jimp(1024, 1024, 0x000000ff);
  padding.scan(0, 0, 1024, 1024, function (x, y, i) {
    const v = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 ? 215 : 241;
    this.bitmap.data[i] = this.bitmap.data[i + 1] = this.bitmap.data[i + 2] = v;
  });
  padding.composite(foreground, 0, 0);
  await padding.writeAsync(path.join(artifacts, "adaptive-icon-padding.png"));
  for (const [density, legacy, layer] of [
    ["mdpi", 48, 108],
    ["hdpi", 72, 162],
    ["xhdpi", 96, 216],
    ["xxhdpi", 144, 324],
    ["xxxhdpi", 192, 432],
  ]) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const name of ["ic_launcher", "ic_launcher_foreground"]) {
      const old = path.join(dir, `${name}.webp`);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    // Legacy launchers get the same padded composition as adaptive launchers.
    const legacyIcon = composed
      .clone()
      .crop(171, 171, 682, 682)
      .resize(legacy, legacy);
    await legacyIcon.writeAsync(path.join(dir, "ic_launcher.png"));
    await legacyIcon.writeAsync(path.join(dir, "ic_launcher_round.png"));
    await foreground
      .clone()
      .resize(layer, layer)
      .writeAsync(path.join(dir, "ic_launcher_foreground.png"));
    await monochrome
      .clone()
      .resize(layer, layer)
      .writeAsync(path.join(dir, "ic_launcher_monochrome.png"));
  }
  for (const api of [26, 33]) {
    const dir = path.join(res, `mipmap-anydpi-v${api}`);
    fs.mkdirSync(dir, { recursive: true });
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@color/iconBackground" />\n  <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n${api === 33 ? '  <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />\n' : ""}</adaptive-icon>\n`;
    for (const name of ["ic_launcher", "ic_launcher_round"])
      fs.writeFileSync(path.join(dir, `${name}.xml`), xml);
  }
  // Verify exact geometry and transparency of both masters.
  for (const layer of [foreground, monochrome]) {
    layer.scan(0, 0, 1024, 1024, function (x, y, i) {
      if (
        x < paddingSize ||
        x >= 1024 - paddingSize ||
        y < paddingSize ||
        y >= 1024 - paddingSize
      )
        assert.equal(this.bitmap.data[i + 3], 0);
    });
  }
  const color = `#${[rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const colorsPath = path.join(res, "values/colors.xml");
  const colors = fs
    .readFileSync(colorsPath, "utf8")
    .replace(/(<color name="iconBackground">).*?(<\/color>)/, `$1${color}$2`);
  fs.writeFileSync(colorsPath, colors);
  const appPath = path.join(root, "app.json");
  const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
  app.expo.icon = "./assets/icons/app-icon.png";
  app.expo.android.adaptiveIcon = {
    foregroundImage: "./assets/icons/adaptive-foreground.png",
    backgroundImage: "./assets/icons/adaptive-background.png",
    backgroundColor: color,
    monochromeImage: "./assets/icons/adaptive-monochrome.png",
  };
  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + "\n");
  console.log(
    `Generated adaptive + monochrome layers, native resources and previews. Background: ${color}. Verified ${paddingSize} px padding on every side.`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
