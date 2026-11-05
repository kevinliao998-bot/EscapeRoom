import { restore, type State } from "./model.ts";
export const SAVE_KEY = "amber-expansion-b1-v1";
export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function load(store: Store): {
  state: State | null;
  warning: string;
  raw: string | null;
} {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (raw === null) return { state: null, warning: "", raw: null };
    const state = restore(raw);
    return {
      state,
      raw,
      warning: state
        ? ""
        : "地下一層存檔無法讀取，原文仍保留。開始新試玩前可先匯出排查。",
    };
  } catch {
    return {
      state: null,
      raw: null,
      warning: "瀏覽器無法讀取存檔。仍可在記憶體中試玩，離開前請匯出進度。",
    };
  }
}
export function save(state: State, store: Store) {
  try {
    store.setItem(SAVE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "本機儲存失敗。進度仍在記憶體中，請匯出目前進度。";
  }
}
// 匯出永遠取目前記憶體，避免回到儲存失敗前的舊快照。
export const exportCurrent = (state: State) => JSON.stringify(state, null, 2);
