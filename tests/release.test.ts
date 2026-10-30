import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const {
  validateReleaseEnvironment,
} = require("../scripts/check-release-env.cjs");
const { bumpVersion } = require("../scripts/bump-version.cjs");

test("release guard rejects shell and dotenv preview settings for Play signing", () => {
  assert.doesNotThrow(() => validateReleaseEnvironment({}, false));
  assert.throws(() =>
    validateReleaseEnvironment({ EXPO_PUBLIC_TEST_PREVIEW: "1" }, false),
  );
  assert.throws(() =>
    validateReleaseEnvironment({ EXPO_PUBLIC_TEST_WAVE: "20" }, true),
  );
  assert.throws(() =>
    validateReleaseEnvironment(
      { EXPO_PUBLIC_TEST_PREVIEW: "1", EXPO_PUBLIC_TEST_WAVE: "101" },
      true,
    ),
  );
  const directory = mkdtempSync(join(tmpdir(), "warling-env-"));
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production" };
  for (const key of [
    "EXPO_PUBLIC_TEST_PREVIEW",
    "EXPO_PUBLIC_TEST_WAVE",
    "EXPO_NO_DOTENV",
  ])
    delete env[key];
  try {
    writeFileSync(
      join(directory, ".env.production"),
      "EXPO_PUBLIC_TEST_PREVIEW=1\nEXPO_PUBLIC_TEST_WAVE=20\n",
    );
    const run = (local: string) =>
      spawnSync(
        process.execPath,
        [resolve("scripts/check-release-env.cjs"), local],
        { cwd: directory, env, encoding: "utf8" },
      );
    assert.equal(run("false").status, 1);
    const local = run("true");
    assert.equal(local.status, 0, local.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("each upload increments Android code and keeps all version sources synchronized", () => {
  const directory = mkdtempSync(join(tmpdir(), "warling-version-"));
  const read = (file: string) =>
    JSON.parse(readFileSync(join(directory, file), "utf8"));
  try {
    mkdirSync(join(directory, "android/app"), { recursive: true });
    writeFileSync(
      join(directory, "app.json"),
      JSON.stringify({
        expo: { version: "1.0.16", android: { versionCode: 18 } },
      }),
    );
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ version: "1.0.16", dependencies: { example: "1.2.3" } }),
    );
    writeFileSync(
      join(directory, "package-lock.json"),
      JSON.stringify({
        version: "1.0.16",
        packages: { "": { version: "1.0.16" } },
      }),
    );
    writeFileSync(
      join(directory, "android/app/build.gradle"),
      'versionCode 18\nversionName "1.0.16"\n',
    );
    for (const [version, code] of [
      ["1.0.17", 19],
      ["1.0.18", 20],
    ] as const) {
      assert.deepEqual(bumpVersion(directory), { version, code });
      assert.equal(read("app.json").expo.android.versionCode, code);
      assert.equal(read("app.json").expo.version, version);
      assert.equal(read("package.json").version, version);
      assert.equal(read("package-lock.json").packages[""].version, version);
      assert.equal(
        readFileSync(join(directory, "android/app/build.gradle"), "utf8"),
        `versionCode ${code}\nversionName "${version}"\n`,
      );
      assert.equal(read("package.json").dependencies.example, "1.2.3");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
