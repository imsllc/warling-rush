import { UnitKind } from "./game/config";

export type ArmySlots<T = UnitKind> = [T | null, T | null, T | null];

export function addToArmy<T>(army: ArmySlots<T>, unit: T): ArmySlots<T> {
  if (army.includes(unit)) return [...army];
  const next: ArmySlots<T> = [...army];
  const empty = next.indexOf(null);
  if (empty !== -1) next[empty] = unit;
  else return [next[1], next[2], unit];
  return next;
}
