import { test } from "node:test";
import assert from "node:assert/strict";
import { fresh, act, restore, story, type Action } from "../Game/src/core.ts";
import {
  load,
  save,
  exportSave,
  exportRecovery,
  SAVE,
  PREV,
  CORRUPT,
} from "../Game/src/storage.ts";
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
test("寫入舊快照或主存檔失敗後，匯出仍保留最新道具、提示、檢查點與雙結局", () => {
  const actions: Action[] = [
    { type: "card" },
    { type: "pry" },
    { type: "enter" },
    { type: "openBox" },
    { type: "power" },
    { type: "wave", value: story.waveOrder },
    { type: "impression" },
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: story.correctConclusion },
    { type: "film" },
    { type: "battery" },
    { type: "platform" },
    { type: "mountFilm" },
    { type: "mountBattery" },
    ...story.route.answer.map((value) => ({ type: "node", value })),
    { type: "read", value: "tag" },
    { type: "hint", value: "P05" },
    { type: "end", value: "A" },
    { type: "reselect" },
    { type: "end", value: "B" },
  ];
  for (const rejectedKey of [PREV, SAVE]) {
    const memory = new Memory();
    assert.equal(save(fresh(), memory as unknown as Storage), "");
    const blocked = {
      getItem: (key: string) => memory.getItem(key),
      setItem(key: string, value: string) {
        if (key === rejectedKey) throw Error("quota");
        memory.setItem(key, value);
      },
    } as unknown as Storage;
    let state = fresh();
    for (const action of actions) {
      state = act(state, action).state;
      assert.ok(save(state, blocked));
      assert.equal(load(blocked).state?.card, false);
      const beforeExport = new Map(memory.data);
      assert.deepEqual(restore(exportSave(state, blocked)), state);
      assert.deepEqual(memory.data, beforeExport, "匯出不寫入或覆寫舊檔");
    }
    assert.ok(state.checkpoint);
    assert.deepEqual(state.seenEndings, ["A", "B"]);
    assert.equal(state.hints.P05, 1);
  }
});
test("最新進度與損壞原文分開匯出，保留主檔、備援及損壞快照的原始字串", () => {
  const memory = new Memory(),
    storage = memory as unknown as Storage;
  const broken = '{"進度":"未完成\\n資料"\n';
  memory.setItem(SAVE, broken);
  memory.setItem(PREV, JSON.stringify(fresh()));
  memory.setItem(CORRUPT, "上一份損壞原文");
  const current = act(fresh(), { type: "card" }).state;
  const before = new Map(memory.data);
  assert.deepEqual(restore(exportSave(current, storage)), current);
  let recovery = exportRecovery(storage);
  assert.equal(recovery.warning, "");
  assert.deepEqual(JSON.parse(recovery.raw!), {
    format: "after-amber-v2-recovery",
    entries: Object.fromEntries(before),
  });
  assert.deepEqual(memory.data, before);
  assert.equal(save(current, storage), "");
  recovery = exportRecovery(storage);
  assert.equal(JSON.parse(recovery.raw!).entries[CORRUPT], broken);
  assert.deepEqual(restore(JSON.parse(recovery.raw!).entries[SAVE]), current);
});
test("沒有原檔或瀏覽器拒絕讀取時，原檔匯出明確回報且不產生假存檔", () => {
  const empty = exportRecovery(new Memory() as unknown as Storage);
  assert.equal(empty.raw, null);
  assert.match(empty.warning, /沒有可匯出/);
  const blocked = {
    getItem() {
      throw Error("denied");
    },
  } as unknown as Storage;
  const denied = exportRecovery(blocked);
  assert.equal(denied.raw, null);
  assert.match(denied.warning, /無法讀取/);
  assert.deepEqual(restore(exportSave(fresh(), blocked)), fresh());
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
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw Error("denied getter");
      },
    });
    assert.ok(load().warning);
    assert.ok(save(fresh()));
    assert.deepEqual(JSON.parse(exportSave(fresh())), fresh());
  } finally {
    if (old) Object.defineProperty(globalThis, "localStorage", old);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
