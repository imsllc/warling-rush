import { NativeModules, Platform } from "react-native";
type AdsBridge = {
  prepare(): Promise<{ privacyRequired: boolean }>;
  show(id: string): Promise<boolean>;
  pendingReward(): Promise<string | null>;
  clearReward(id: string): Promise<void>;
  privacy(): Promise<{ privacyRequired: boolean }>;
};
export const rewardAds: AdsBridge | undefined =
  Platform.OS === "android" ? NativeModules.BattleRewardAds : undefined;
