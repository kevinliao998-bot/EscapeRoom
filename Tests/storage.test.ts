import { test } from "node:test";
import assert from "node:assert/strict";
import { fresh, act } from "../Game/src/core.ts";
import { load, save, exportSave, SAVE, PREV } from "../Game/src/storage.ts";
class Memory {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
test("存檔往返、備援恢復及保留損壞原檔", () => {
  const m = new Memory() as unknown as Storage;
  const s = act(fresh(), { type: "card" }).state;
  assert.equal(save(fresh(), m), "");
  save(s, m);
  assert.equal(load(m).state?.card, true);
  m.setItem(SAVE, "broken");
  assert.equal(load(m).state?.card, false);
  assert.equal(m.getItem(SAVE), "broken");
  assert.ok(load(m).warning);
  save(s, m);
  assert.equal(m.getItem(SAVE + "-corrupt"), "broken");
  m.setItem(SAVE, "broken");
  m.setItem(PREV, "also broken");
  assert.equal(load(m).state, null);
  assert.equal(m.getItem(PREV), "also broken");
});
test("本機儲存被禁用時不崩潰且明確提示", () => {
  const storage = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("quota");
    },
  } as unknown as Storage;
  assert.equal(load(storage).state, null);
  assert.ok(load(storage).warning);
  assert.ok(save(fresh(), storage));
  assert.deepEqual(JSON.parse(exportSave(fresh(), storage)), fresh());
});
