import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeProgress, Progress } from "./progress";
import { UNITS, UnitKind } from "./game/config";
// Start the phone-testing release fresh once; subsequent launches keep its save.
// Development progress stays in the old key and cannot unlock the test roster.
const KEY = "warling-rush.progress.phone.v1";
export const loadProgress = async () => {
  const progress = decodeProgress(await AsyncStorage.getItem(KEY));
  if (process.env.EXPO_PUBLIC_TEST_PREVIEW === "1") {
    progress.unlockedUnits = Object.keys(UNITS) as UnitKind[];
    const testWave = Number(process.env.EXPO_PUBLIC_TEST_WAVE);
    if (Number.isSafeInteger(testWave) && testWave >= 1 && testWave <= 100)
      progress.waveNumber = testWave;
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  }
  return progress;
};
export const saveProgress = (p: Progress) =>
  AsyncStorage.setItem(KEY, JSON.stringify(p));
