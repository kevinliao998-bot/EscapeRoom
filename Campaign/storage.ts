import { restore, type State } from "./model.ts";
export const KEY = "after-amber-campaign-v1",
  PREVIOUS = KEY + "-previous",
  CORRUPT = KEY + "-corrupt";
export interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
export function load(store: Store) {
  let raw: string | null = null;
  try {
    raw = store.getItem(KEY);
    if (raw === null) return { state: null, warning: "", raw };
    const state = restore(raw);
    if (state) return { state, warning: "", raw };
    try {
      store.setItem(CORRUPT, raw);
    } catch {}
    const previous = store.getItem(PREVIOUS);
    const recovered = previous && restore(previous);
    return {
      state: recovered || null,
      raw,
      warning: recovered
        ? "主存檔損壞，已載入上一份有效進度；原文已保留。"
        : "存檔無法讀取，原文保留；可先匯出排查。",
    };
  } catch {
    return {
      state: null,
      raw,
      warning: "瀏覽器拒絕讀取。可在記憶體繼續，離開前請匯出。",
    };
  }
}
export function save(s: State, store: Store) {
  try {
    const old = store.getItem(KEY);
    if (old && restore(old)) store.setItem(PREVIOUS, old);
    store.setItem(KEY, JSON.stringify(s));
    return "";
  } catch {
    return "本機儲存失敗，記憶體進度仍在；請匯出目前進度。";
  }
}
export const exportCurrent = (s: State) => JSON.stringify(s, null, 2);
