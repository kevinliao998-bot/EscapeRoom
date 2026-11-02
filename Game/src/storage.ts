import { restore, serialize, type State } from "./core.ts";
export const SAVE = "after-amber-v2-save",
  PREV = SAVE + "-previous";
export function load(storage: Storage = localStorage): {
  state: State | null;
  warning: string;
} {
  try {
    const raw = storage.getItem(SAVE);
    if (!raw) return { state: null, warning: "" };
    const s = restore(raw);
    if (s) return { state: s, warning: "" };
    const backup = restore(storage.getItem(PREV) || "");
    return {
      state: backup,
      warning: backup
        ? "主要存檔損壞，已讀取上一份有效快照。"
        : "存檔未通過驗證；原檔保留，請先匯出再決定是否開始新遊戲。",
    };
  } catch {
    return {
      state: null,
      warning: "瀏覽器未允許儲存；本次進度僅保留在記憶體。",
    };
  }
}
export function save(s: State, storage: Storage = localStorage): string {
  try {
    const prev = storage.getItem(SAVE);
    if (prev && restore(prev)) storage.setItem(PREV, prev);
    storage.setItem(SAVE, serialize(s));
    return "";
  } catch {
    return "本機儲存失敗，請使用「匯出存檔」保留進度。";
  }
}

export function exportSave(s: State, storage: Storage = localStorage): string {
  try {
    return storage.getItem(SAVE) || serialize(s);
  } catch {
    return serialize(s);
  }
}
