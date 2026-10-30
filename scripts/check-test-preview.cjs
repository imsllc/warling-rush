const assert = require("node:assert/strict");
const Module = require("node:module");
require("tsx/cjs");
const { initialProgress } = require("../src/progress.ts");
const { UNITS, foodRate } = require("../src/game/config.ts");
const original = initialProgress();
original.coins = 321;
original.waveNumber = 7;
original.levels = { food: 40, health: 2, damage: 3 };
let saved = JSON.stringify(original);
const load = Module._load;
Module._load = function (id, ...args) {
  if (id === "@react-native-async-storage/async-storage") {
    return {
      getItem: async () => saved,
      setItem: async (key, value) => {
        saved = value;
      },
    };
  }
  return load.call(this, id, ...args);
};
const { loadProgress } = require("../src/storage.ts");
Module._load = load;
async function main() {
  delete process.env.EXPO_PUBLIC_TEST_PREVIEW;
  assert.deepEqual(await loadProgress(), original);
  assert.equal(foodRate(0), 0.5);
  assert.equal(foodRate(100), 2.5);
  process.env.EXPO_PUBLIC_TEST_PREVIEW = "1";
  const preview = await loadProgress();
  assert.deepEqual(preview, { ...original, unlockedUnits: Object.keys(UNITS) });
  assert.deepEqual(JSON.parse(saved), preview);
  for (const level of [0, 40, 100]) assert.equal(foodRate(level), 5);
  process.env.EXPO_PUBLIC_TEST_WAVE = "100";
  const wave100 = await loadProgress();
  assert.deepEqual(wave100, { ...preview, waveNumber: 100 });
  assert.deepEqual(JSON.parse(saved), wave100);
  delete process.env.EXPO_PUBLIC_TEST_WAVE;
  delete process.env.EXPO_PUBLIC_TEST_PREVIEW;
  assert.equal(foodRate(40), 1.3);
  console.log(
    "Preview verified: all roster units persist unlocked; exact 5/s at every upgrade level; optional Wave 100 override persists without changing other progress; regular-build food rates unchanged.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
