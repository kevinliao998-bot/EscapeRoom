import { restore, serialize, type State } from "./core.ts";
export const SAVE = "after-amber-v2-save",
  PREV = SAVE + "-previous",
  CORRUPT = SAVE + "-corrupt";
export function load(storage?: Storage): {
  state: State | null;
  warning: string;
} {
  try {
    storage ??= localStorage;
    const raw = storage.getItem(SAVE);
    if (!raw) return { state: null, warning: "" };
    const s = restore(raw);
    if (s) return { state: s, warning: "" };
    const backup = restore(storage.getItem(PREV) || "");
    return {
      state: backup,
      warning: backup
        ? "主要存檔損壞，已讀取上一份有效快照。"
        : "存檔未通過驗證；原檔保留，請先在設定匯出本機原檔，再決定是否開始新遊戲。",
    };
  } catch {
    return {
      state: null,
      warning: "瀏覽器未允許儲存；本次進度僅保留在記憶體。",
    };
  }
}
export function save(s: State, storage?: Storage): string {
  try {
    storage ??= localStorage;
    const prev = storage.getItem(SAVE);
    if (prev && restore(prev)) storage.setItem(PREV, prev);
    else if (prev) storage.setItem(CORRUPT, prev);
    storage.setItem(SAVE, serialize(s));
    return "";
  } catch {
    return "本機儲存失敗，請使用「匯出存檔」保留進度。";
  }
}

// 保留第二個參數供既有呼叫端使用；救援進度只取目前記憶體，不依賴本機寫入是否成功。
export function exportSave(s: State, _storage?: Storage): string {
  return serialize(s);
}

// 與可恢復的遊戲進度分開匯出，原文不解析、不修補，也不覆寫任何本機資料。
export function exportRecovery(storage?: Storage): {
  raw: string | null;
  warning: string;
} {
  try {
    storage ??= localStorage;
    const entries = Object.fromEntries(
      [SAVE, PREV, CORRUPT].map((key) => [key, storage!.getItem(key)]),
    );
    if (Object.values(entries).every((raw) => raw === null))
      return {
        raw: null,
        warning: "目前沒有可匯出的本機原檔。請用「匯出存檔」保留本次進度。",
      };
    return {
      raw: JSON.stringify(
        { format: "after-amber-v2-recovery", entries },
        null,
        2,
      ),
      warning: "",
    };
  } catch {
    return {
      raw: null,
      warning: "無法讀取本機原檔。請用「匯出存檔」保留本次進度。",
    };
  }
}
