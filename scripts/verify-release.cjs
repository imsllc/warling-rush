const fs = require("node:fs");
const zlib = require("node:zlib");
const assert = require("node:assert/strict");
const path = require("node:path");
const crypto = require("node:crypto");

// Read standard APK/AAB ZIP entries without extracting native libraries.
function zipEntries(file) {
  const data = fs.readFileSync(file);
  let end = data.length - 22;
  while (
    end >= Math.max(0, data.length - 65557) &&
    data.readUInt32LE(end) !== 0x06054b50
  )
    end--;
  assert.ok(end >= 0, "ZIP directory not found");
  const entries = new Map();
  let offset = data.readUInt32LE(end + 16);
  const count = data.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    assert.equal(data.readUInt32LE(offset), 0x02014b50);
    const method = data.readUInt16LE(offset + 10);
    const size = data.readUInt32LE(offset + 20);
    const nameLength = data.readUInt16LE(offset + 28);
    const name = data
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    const local = data.readUInt32LE(offset + 42);
    entries.set(name, () => {
      const start =
        local +
        30 +
        data.readUInt16LE(local + 26) +
        data.readUInt16LE(local + 28);
      const bytes = data.subarray(start, start + size);
      assert.ok(method === 0 || method === 8, "Unsupported ZIP compression");
      return method === 8 ? zlib.inflateRawSync(bytes) : bytes;
    });
    offset +=
      46 +
      nameLength +
      data.readUInt16LE(offset + 30) +
      data.readUInt16LE(offset + 32);
  }
  return entries;
}

const file = process.argv[2];
assert.ok(file, "Pass an APK or AAB path");
const entries = zipEntries(file);
const bundle = file.endsWith(".aab");
const prefix = bundle ? "base/" : "";
assert.ok(
  entries.has(prefix + "assets/index.android.bundle"),
  "Offline JavaScript missing",
);
const soundHashes = new Set(
  [...entries.keys()]
    .filter((name) => name.endsWith(".mp3"))
    .map((name) =>
      crypto.createHash("sha256").update(entries.get(name)()).digest("hex"),
    ),
);
for (const sound of ["click", "sword", "throw"]) {
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync("assets/sounds/" + sound + ".mp3"))
    .digest("hex");
  assert.ok(
    soundHashes.has(hash),
    "Bundled sound missing or changed: " + sound,
  );
}
const dexNames = [...entries.keys()].filter((n) =>
  new RegExp(
    "^" + prefix + (bundle ? "dex/" : "") + "classes[0-9]*\\.dex$",
  ).test(n),
);
assert.ok(dexNames.length, "DEX files missing");
const mappingDirectory =
  process.argv[3] || "android/app/build/outputs/mapping/release";
const mapFile = path.join(mappingDirectory, "mapping.txt");
const configFile = path.join(mappingDirectory, "configuration.txt");
assert.ok(fs.statSync(mapFile).size > 0, "R8 mapping missing");
assert.ok(
  fs.statSync(mapFile).mtimeMs >= fs.statSync(file).mtimeMs - 30 * 60 * 1000,
  "R8 mapping appears stale",
);
const config = fs.readFileSync(configFile, "utf8");
assert.ok(
  !/^\s*-(dontoptimize|dontshrink|dontobfuscate)\b/m.test(config),
  "R8 optimization is disabled",
);
const mapping = fs.readFileSync(mapFile, "utf8");
const renamed = (mapping.match(/^\S+ -> \S+:$/gm) || []).filter((line) => {
  const [from, to] = line.slice(0, -1).split(" -> ");
  return from !== to;
}).length;
assert.ok(renamed > 0, "No obfuscated classes found");
for (const name of [
  "expo.modules.audio.AudioMode",
  "expo.modules.audio.AudioSource",
  "expo.modules.kotlin.records.Field",
  "kotlin.reflect.jvm.internal.KClassImpl",
]) {
  assert.ok(
    mapping.includes(name + " -> " + name + ":"),
    "Audio reflection class not preserved: " + name,
  );
}
for (const [name, methods] of [
  ["CoinBillingModule", ["products", "purchases", "buy", "consume"]],
  [
    "RewardedAdsModule",
    ["prepare", "show", "pendingReward", "clearReward", "privacy"],
  ],
]) {
  const start = mapping.indexOf("com.warlingrush.app." + name + " ->");
  assert.ok(start >= 0, "Native module missing: " + name);
  const block = mapping.slice(start).split(/\r?\n(?=[^ #])/)[0];
  for (const method of methods)
    assert.ok(
      block.includes(" -> " + method),
      "Native bridge method renamed: " + name + "." + method,
    );
}
const manifest =
  entries.get(prefix + "manifest/AndroidManifest.xml")?.() ||
  entries.get("AndroidManifest.xml")();
// AAB uses protobuf strings; APK uses UTF-16 binary XML strings.
const manifestText = bundle
  ? manifest.toString("utf8")
  : manifest.toString("utf16le");
const manifestContains = (text) =>
  manifestText.includes(text) ||
  manifest.includes(Buffer.from(text, "utf8")) ||
  manifest.includes(Buffer.from(text, "utf16le"));
for (const permission of [
  "RECORD_AUDIO",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "SYSTEM_ALERT_WINDOW",
])
  assert.ok(
    !manifestContains("android.permission." + permission),
    "Unnecessary permission: " + permission,
  );
for (const service of ["AudioControlsService", "AudioRecordingService"])
  assert.ok(
    !manifestContains(service),
    "Background audio service unexpectedly registered",
  );
let libraries = 0;
for (const abi of ["arm64-v8a", "x86_64"]) {
  const names = [...entries.keys()].filter(
    (n) => n.startsWith(prefix + "lib/" + abi + "/") && n.endsWith(".so"),
  );
  assert.ok(names.length, "Missing native support for " + abi);
  for (const name of names) {
    const elf = entries.get(name)();
    assert.equal(elf.subarray(0, 4).toString("hex"), "7f454c46");
    assert.equal(elf[4], 2, "Expected 64-bit ELF");
    assert.equal(elf[5], 1, "Expected little-endian ELF");
    const ph = Number(elf.readBigUInt64LE(32));
    const width = elf.readUInt16LE(54),
      count = elf.readUInt16LE(56);
    for (let i = 0; i < count; i++) {
      const offset = ph + i * width;
      if (elf.readUInt32LE(offset) === 1)
        assert.ok(
          elf.readBigUInt64LE(offset + 48) >= 16384n,
          "Native library lacks 16KB alignment: " + name,
        );
    }
    libraries++;
  }
}
console.log(
  JSON.stringify(
    {
      file,
      bytes: fs.statSync(file).size,
      dexFiles: dexNames.length,
      renamedClasses: renamed,
      nativeLibrariesChecked: libraries,
      r8Optimization: true,
      bridgeMethodNamesPreserved: true,
      requiredAbisAnd16KBAlignment: true,
      offlineBundle: true,
      originalSoundAssetsAndReflectionPreserved: true,
      unnecessaryPermissionsAbsent: true,
    },
    null,
    2,
  ),
);
