const fs = require("node:fs");
const path = require("node:path");

function bumpVersion(root) {
  const read = (file) =>
    JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const app = read("app.json");
  const pkg = read("package.json");
  const lock = read("package-lock.json");
  const parts = app.expo.version.split(".").map(Number);
  if (
    parts.length !== 3 ||
    parts.some((n) => !Number.isSafeInteger(n) || n < 0)
  )
    throw new Error("Expected a numeric major.minor.patch version.");
  parts[2]++;
  const version = parts.join(".");
  const code = app.expo.android.versionCode + 1;
  if (!Number.isSafeInteger(code) || code < 1)
    throw new Error("Invalid Android version code.");
  const gradlePath = path.join(root, "android/app/build.gradle");
  const gradle = fs.readFileSync(gradlePath, "utf8");
  if (!/versionCode \d+/.test(gradle) || !/versionName "[^"]+"/.test(gradle))
    throw new Error("Native version fields are missing.");
  app.expo.version =
    pkg.version =
    lock.version =
    lock.packages[""].version =
      version;
  app.expo.android.versionCode = code;
  for (const [file, value] of [
    ["app.json", app],
    ["package.json", pkg],
    ["package-lock.json", lock],
  ])
    fs.writeFileSync(
      path.join(root, file),
      JSON.stringify(value, null, 2) + "\n",
    );
  fs.writeFileSync(
    gradlePath,
    gradle
      .replace(/versionCode \d+/, `versionCode ${code}`)
      .replace(/versionName "[^"]+"/, `versionName "${version}"`),
  );
  return { version, code };
}
module.exports = { bumpVersion };
if (require.main === module)
  console.log(JSON.stringify(bumpVersion(path.resolve(__dirname, ".."))));
