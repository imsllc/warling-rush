export const BATTLE_THEMES = [
  "grasslands",
  "mountains",
  "desert",
  "lava",
  "space",
  "jungle",
] as const;

export function battleTheme(battleNumber: number) {
  const battle = Math.max(1, Math.floor(battleNumber));
  return BATTLE_THEMES[Math.floor((battle - 1) / 10) % BATTLE_THEMES.length];
}
