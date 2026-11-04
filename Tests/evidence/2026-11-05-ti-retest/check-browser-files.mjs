// 核對本輪由正式版按鈕實際下載的檔案，不讀取或注入瀏覽器狀態。
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { restore } from "../../../Game/src/core.ts";
const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const raw = read("downloaded-progress.json");
const state = restore(raw);
assert.ok(state);
assert.equal(state.card, true);
assert.equal(state.door, true);
assert.ok(state.checkpoint);
assert.equal(state.lastEnding, "B");
assert.deepEqual(state.seenEndings, ["A", "B"]);
const recovery = JSON.parse(read("downloaded-recovery.json"));
assert.equal(recovery.format, "after-amber-v2-recovery");
assert.deepEqual(Object.keys(recovery.entries), ["after-amber-v2-save", "after-amber-v2-save-previous", "after-amber-v2-save-corrupt"]);
assert.deepEqual(restore(recovery.entries["after-amber-v2-save"]), state);
const keyboard = JSON.parse(read("keyboard-check.json"));
assert.equal(keyboard.moved, true);
assert.notDeepEqual(keyboard.before, keyboard.after);
const viewports = JSON.parse(read("viewports.json"));
assert.deepEqual(viewports[0].stage, {width: 480, height: 270});
for (const [name, zoom, width, height] of [["3x",3,1440,810],["4x",4,1920,1080]]) {
  const sample = viewports.find(x => x.name === name);
  assert.equal(sample.rootStyle, `--zoom: ${zoom};`);
  assert.equal(sample.stageWidth, width);
  assert.equal(sample.stageHeight, height);
}
const small = viewports.find(x => x.name === "too-small");
assert.match(small.bodyClass, /too-small/);
assert.equal(small.stageWidth, 0);
const result = {progressValid:true,scene:state.scene,card:state.card,door:state.door,checkpoint:true,lastEnding:state.lastEnding,seenEndings:state.seenEndings,recoveryFormat:recovery.format,recoveryKeys:Object.keys(recovery.entries),recoveryMatchesProgress:true,keyboard,viewportSizesChecked:true};
writeFileSync(new URL("browser-check.json",import.meta.url),JSON.stringify(result,null,2)+"\n");
console.log("實際下載的進度、原檔排查包、方向鍵位移與舞台尺寸核對通過。");
