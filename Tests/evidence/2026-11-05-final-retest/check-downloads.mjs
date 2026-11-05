// 只讀取正式版按鈕實際下載的 JSON，不讀寫瀏覽器狀態。
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { restore } from "../../../Game/src/core.ts";
const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const state = restore(read("downloaded-progress.json"));
assert.ok(state);
assert.equal(state.door, true);
assert.ok(state.checkpoint);
assert.equal(state.lastEnding, "B");
assert.deepEqual(state.seenEndings, ["A", "B"]);
const recovery = JSON.parse(read("downloaded-recovery.json"));
assert.equal(recovery.format, "after-amber-v2-recovery");
assert.deepEqual(Object.keys(recovery.entries), ["after-amber-v2-save", "after-amber-v2-save-previous", "after-amber-v2-save-corrupt"]);
assert.deepEqual(restore(recovery.entries["after-amber-v2-save"]), state);
const result = {progressValid:true,scene:state.scene,lastEnding:state.lastEnding,seenEndings:state.seenEndings,door:state.door,checkpoint:true,recoveryMatchesProgress:true};
writeFileSync(new URL("downloads-check.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
console.log("本輪實際下載可恢復，保留雙結局與檢查點，原檔包 SAVE 與進度檔相符。");
