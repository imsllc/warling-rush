const fs = require("node:fs");
const assert = require("node:assert/strict");
const log = fs.readFileSync(process.argv[2], "utf8");
assert.ok(
  !log.includes("Could not play game audio"),
  "Native audio reported a failure",
);
assert.ok(!log.includes("FATAL EXCEPTION"), "The app crashed");
const loaded = log.match(/Audio smoke test: loaded voices\D*(\d+)/);
assert.equal(Number(loaded?.[1]), 14, "All 14 native audio voices must load");
const line = log
  .split(/\r?\n/)
  .find((line) => line.includes("Audio smoke test: playback"));
assert.ok(line, "Native audio playback evidence is missing");
const playback = JSON.parse(
  line.slice(line.indexOf("{"), line.lastIndexOf("}") + 1),
);
for (const [sound, size] of [
  ["click", 2],
  ["sword", 6],
  ["throw", 6],
]) {
  const voices = playback[sound];
  assert.equal(voices.length, size, "Wrong voice pool for " + sound);
  assert.ok(
    voices.every((voice) => voice.loaded && voice.duration > 0),
    "Audio is not loaded: " + sound,
  );
  assert.ok(
    voices.some((voice) => voice.time > 0),
    "Playback did not advance: " + sound,
  );
}
console.log(
  "PASS: native audio setup, all 14 assets/players, seek and playback for click, sword and throw.",
);
console.log(JSON.stringify(playback, null, 2));
