import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  act,
  valid,
  serialize,
  restore,
  actions,
  modelKey,
} from "../Game/src/core.ts";
const step = (s: any, ...events: any[]) =>
  events.reduce(
    (v, e) => act(v, typeof e === "string" ? { type: e } : e).state,
    s,
  );
const office = () => step(fresh(), "card", "enter");
const records = () =>
  step(
    office(),
    "back",
    "pry",
    "enter",
    "openBox",
    "power",
    { type: "wave", value: ["long", "short", "double"] },
    "impression",
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: 1 },
  );
const choice = () =>
  step(
    records(),
    "film",
    "battery",
    "platform",
    "mountBattery",
    "mountFilm",
    ...["entry", "junction", "service", "exit"].map((value) => ({
      type: "node",
      value,
    })),
  );
test("前三次返回每次只改一項，之後不再增加", () => {
  let s = fresh();
  for (let i = 0; i < 6; i++) s = step(s, "enter");
  assert.equal(s.loop, 3);
  assert.equal(s.scene, "corridor");
  assert.match(act(s, { type: "enter" }).message, /不再變化/);
  assert.ok(valid(s));
});
test("先拿卡漏拿撬片仍能返回；錯誤不消耗唯一物品", () => {
  let s = office();
  assert.equal(s.pry, false);
  s = step(s, "openBox");
  assert.equal(s.box, false);
  s = step(s, "back", "pry", "enter", "openBox", "power");
  assert.ok(s.power && s.pry);
});
test("未看壓痕不能完成，正確連線保留；時間吻合不等於找出改動者", () => {
  let s = step(
    office(),
    "back",
    "pry",
    "enter",
    "openBox",
    "power",
    { type: "wave", value: ["long", "short", "double"] },
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: 1 },
  );
  assert.equal(s.records, false);
  s = step(s, "impression", { type: "conclude", value: 0 });
  assert.equal(s.records, false);
  s = step(s, { type: "conclude", value: 1 });
  assert.equal(s.records, true);
});
test("獎勵冪等、裝配任意順序、拒絕未供電與跳步，取回不鎖門", () => {
  let s = step(
    records(),
    "battery",
    "battery",
    "film",
    "platform",
    "mountBattery",
    "mountFilm",
    { type: "node", value: "entry" },
    { type: "node", value: "north" },
    { type: "node", value: "exit" },
  );
  assert.deepEqual(s.path, ["entry"]);
  s = step(
    s,
    ...["junction", "service", "exit"].map((value) => ({
      type: "node",
      value,
    })),
  );
  assert.ok(s.door);
  s = step(s, "takeBattery", "takeFilm");
  assert.ok(s.door);
  assert.equal(s.path.length, 0);
  assert.equal(s.battery, "inventory");
  assert.ok(s.checkpoint);
});
test("結局甲乙、選擇前檢查點及完成後讀檔均可恢復", () => {
  let s = step(
    choice(),
    { type: "read", value: "tag" },
    { type: "hint", value: "P05" },
  );
  for (const e of ["A", "B"]) {
    s = step(s, { type: "end", value: e });
    assert.equal(s.lastEnding, e);
    s = restore(serialize(s))!;
    assert.ok(valid(s));
    s = step(s, "reselect");
    assert.ok(s.door);
    assert.equal(s.lastEnding, null);
    assert.ok(s.read.includes("tag"));
    assert.equal(s.hints.P05, 1);
  }
  assert.deepEqual(s.seenEndings, ["A", "B"]);
});
test("拒絕損壞／偽造前置存檔", () => {
  assert.equal(restore("{}"), null);
  const s = fresh();
  s.door = true;
  assert.equal(restore(serialize(s)), null);
});
test("全部可達有限抽象狀態可達出口；雙結局可再選", () => {
  const states = [fresh()],
    idx = new Map([[modelKey(states[0]), 0]]),
    reverse: number[][] = [[]];
  for (let i = 0; i < states.length; i++) {
    for (const a of actions) {
      const n = act(states[i], a).state;
      assert.ok(valid(n));
      const k = modelKey(n);
      let j = idx.get(k);
      if (j === undefined) {
        j = states.length;
        idx.set(k, j);
        states.push(n);
        reverse.push([]);
      }
      reverse[j].push(i);
    }
  }
  const good = new Set<number>(),
    q: number[] = [];
  states.forEach((s, i) => {
    if (s.door) {
      good.add(i);
      q.push(i);
    }
  });
  for (let i = 0; i < q.length; i++)
    for (const p of reverse[q[i]])
      if (!good.has(p)) {
        good.add(p);
        q.push(p);
      }
  assert.equal(good.size, states.length);
  console.log(`抽象可達狀態 ${states.length}；全部存在後續通關路徑`);
});
