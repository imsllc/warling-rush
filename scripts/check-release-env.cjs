const { load } = require("@expo/env");

function validateReleaseEnvironment(env, localTestSigning) {
  const preview = env.EXPO_PUBLIC_TEST_PREVIEW === "1";
  const wave = env.EXPO_PUBLIC_TEST_WAVE;
  if (preview && !localTestSigning)
    throw new Error(
      "Test preview requires -PlocalTestSigning=true, including .env settings.",
    );
  if (wave && !preview)
    throw new Error("Test wave requires EXPO_PUBLIC_TEST_PREVIEW=1.");
  if (
    wave &&
    (!Number.isSafeInteger(Number(wave)) ||
      Number(wave) < 1 ||
      Number(wave) > 100)
  )
    throw new Error("Test wave must be an integer from 1 to 100.");
}
module.exports = { validateReleaseEnvironment };
if (require.main === module) {
  process.env.NODE_ENV ||= "production";
  load(process.cwd());
  try {
    validateReleaseEnvironment(process.env, process.argv[2] === "true");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
