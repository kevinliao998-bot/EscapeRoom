// 只供定向複驗；不是玩家實際下載，也不計作本輪新局通關。
import { writeFileSync } from "node:fs";
import { prologue } from "../Campaign/test-progress.ts";
import { exportCurrent } from "../Campaign/storage.ts";

writeFileSync(
  new URL("./evidence/2026-11-06-campaign-retest/generated-first-door.json", import.meta.url),
  exportCurrent(prologue()),
);
console.log("已由合法模型動作建立首次維修門測試進度；僅經遊戲選檔匯入使用。");
