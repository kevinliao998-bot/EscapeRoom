import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  act,
  restore,
  circuitChecks,
  waterRoute,
  consumption,
  circuits,
  loads,
  valves,
  proposal,
  type State,
  type Action,
  type Circuit,
  type Load,
  type Puzzle,
} from "./model.ts";
import { SAVE_KEY, save, load, exportCurrent } from "./storage.ts";
import { SAVE, PREV, CORRUPT } from "../Game/src/storage.ts";
function step(s: State, a: Action) {
  return act(s, a).state;
}
function wire(s = fresh()) {
  circuits.forEach((circuit, slot) => {
    s = step(s, { type: "place", circuit, slot });
  });
  return step(s, { type: "wire" });
}
function safe(s = wire()) {
  for (const load of ["comm", "fan", "pump"] as Load[])
    s = step(s, { type: "power", load });
  for (const valve of ["C", "D"] as const)
    s = step(s, { type: "valve", valve });
  s = step(s, { type: "drain" });
  s = step(s, { type: "power", load: "pump" });
  return s;
}
function perm<T>(xs: T[]): T[][] {
  return xs.length
    ? xs.flatMap((x, i) =>
        perm(xs.filter((_, j) => i !== j)).map((p) => [x, ...p]),
      )
    : [[]];
}
test("B1-01｜SC 資料的五條回路線索在 120 種排列中只有一個解", () => {
  const solutions = perm([...circuits]).filter((slots) =>
    circuitChecks(slots).every(Boolean),
  );
  assert.deepEqual(solutions, [
    proposal.puzzles.find((p) => p.id === "EP01")!.solution,
  ]);
  assert.equal(
    circuitChecks([null, null, null, null, null]).some(Boolean),
    false,
  );
});
test("B1-02｜所有 1546 種不重複的部分配線均能重新排列，沒有接頭永久遺失", () => {
  let count = 0;
  function visit(slots: (Circuit | null)[]) {
    if (slots.length === 5) {
      count++;
      const s = { ...fresh(), slots };
      assert.ok(restore(JSON.stringify(s)));
      assert.equal(wire(s).wired, true);
      return;
    }
    for (const c of [null, ...circuits])
      if (c === null || !slots.includes(c)) visit([...slots, c]);
  }
  visit([]);
  assert.equal(count, 1546);
});
test("B1-03｜16 種閥門配置只有 A/B 開、C/D 關會排水", () => {
  let count = 0;
  for (let mask = 0; mask < 16; mask++) {
    let s = wire();
    s.power = { light: true, comm: false, fan: false, pump: true, lock: false };
    s.checkClosed = false;
    valves.forEach((id, i) => {
      s.valves[id] = !!(mask & (1 << i));
    });
    const result = act(s, { type: "drain" });
    assert.equal(result.state.water === "safe", waterRoute(s));
    if (result.state.water === "safe") {
      count++;
      assert.deepEqual(s.valves, { A: true, B: true, C: false, D: false });
    }
  }
  assert.equal(count, 1);
});
test("B1-04｜檢修窗需停止排風；新增管線及其文字會保留在筆記", () => {
  let s = wire();
  assert.match(act(s, { type: "trace" }).message, /排風/);
  s = step(s, { type: "power", load: "fan" });
  s = step(s, { type: "trace" });
  assert.equal(s.traceSeen, true);
  assert.ok(s.read.includes("trace"));
  s = step(s, { type: "power", load: "fan" });
  assert.ok(restore(JSON.stringify(s))!.read.includes("trace"));
});
test("B1-05｜超載、高水位、黑暗作業會被拒絕且不清除接線與證據", () => {
  let s = wire();
  s = step(s, { type: "read", doc: "work" });
  for (const load of ["pump", "lock"] as Load[])
    assert.deepEqual(act(s, { type: "power", load }).state, s);
  for (const load of ["comm", "fan", "light"] as Load[])
    s = step(s, { type: "power", load });
  assert.match(act(s, { type: "power", load: "pump" }).message, /照明/);
  assert.equal(step(s, { type: "door" }).door, false);
});
test("B1-06｜停泵維持安全水位，轉供後可放行並取得林沐原文工單", () => {
  let s = safe();
  assert.equal(s.water, "safe");
  assert.equal(s.checkClosed, true);
  assert.equal(consumption(s), 1);
  s = step(s, { type: "power", load: "lock" });
  assert.equal(consumption(s), 3);
  s = step(s, { type: "door" });
  assert.equal(s.door, true);
  assert.ok(s.read.includes("lin"));
  assert.equal(proposal.midpointReveal.text, "照明保留。先讓走廊的人出去。");
  assert.ok(restore(JSON.stringify(s))?.door);
});
test("B1-07｜三房間任意往返與三級提示不替代解題、不遺失狀態", () => {
  let s = safe();
  const water = s.water;
  for (const room of [
    "vestibule",
    "distribution",
    "pump",
    "vestibule",
  ] as const)
    s = step(s, { type: "move", room });
  for (const puzzle of ["EP01", "EP02", "EP03"] as Puzzle[])
    for (let i = 0; i < 5; i++) s = step(s, { type: "hint", puzzle });
  assert.equal(s.water, water);
  assert.deepEqual(s.hints, { EP01: 3, EP02: 3, EP03: 3 });
  assert.equal(s.door, false);
  assert.ok(restore(JSON.stringify(s)));
});
test("B1-08｜存檔拒絕偽造超載、提早開門、重複接頭與未讀可得的工單", () => {
  for (const change of [
    (s: State) => {
      s.power = { light: true, comm: true, fan: true, pump: true, lock: true };
    },
    (s: State) => {
      s.door = true;
    },
    (s: State) => {
      s.slots[0] = s.slots[1] = "照明";
    },
    (s: State) => {
      s.read.push("lin");
    },
    (s: State) => {
      s.hints.EP01 = -1;
    },
    (s: State) => {
      (s.read as string[]).push("__proto__");
    },
  ]) {
    const s = fresh();
    change(s);
    assert.equal(restore(JSON.stringify(s)), null);
  }
  assert.equal(restore("{}"), null);
  assert.equal(restore("<bad>"), null);
});
test("B1-12｜負載、水路與三級提示均符合釘選 SC 提案資料", () => {
  const p2 = proposal.puzzles.find((p) => p.id === "EP02")!,
    p3 = proposal.puzzles.find((p) => p.id === "EP03")!;
  assert.deepEqual(p2.solution, { A: "開", B: "開", C: "關", D: "關" });
  assert.equal(p3.capacity, 4);
  assert.deepEqual(
    Object.fromEntries(
      (Object.keys(loads) as Load[]).map((id) => [
        {
          light: "應急照明",
          comm: "通訊",
          fan: "排風",
          pump: "泵浦",
          lock: "門鎖",
        }[id],
        loads[id],
      ]),
    ),
    p3.loads,
  );
  assert.ok(proposal.puzzles.slice(0, 3).every((p) => p.hints.length === 3));
});
test("B1-09｜B1 存檔 key 獨立；寫入失敗時匯出仍保留最新進度", () => {
  const values = new Map([
    [SAVE, "原版存檔不可改"],
    [PREV, "原版備援不可改"],
    [CORRUPT, "原版損壞快照不可改"],
  ]);
  let fail = false;
  const store = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail) throw new Error("quota");
      values.set(k, v);
    },
  };
  save(fresh(), store);
  fail = true;
  const latest = safe();
  assert.ok(save(latest, store));
  assert.equal(restore(exportCurrent(latest))?.water, "safe");
  assert.equal(load(store).state?.water, "high");
  assert.equal(values.get(SAVE), "原版存檔不可改");
  assert.ok(values.has(SAVE_KEY));
  assert.equal(values.get(PREV), "原版備援不可改");
  assert.equal(values.get(CORRUPT), "原版損壞快照不可改");
});
test("B1-10｜損壞原文及禁用儲存的錯誤會明確回報", () => {
  const raw = "bad-save";
  assert.deepEqual(load({ getItem: () => raw, setItem() {} }), {
    state: null,
    raw,
    warning: "地下一層存檔無法讀取，原文仍保留。開始新試玩前可先匯出排查。",
  });
  assert.ok(
    load({
      getItem() {
        throw new Error("blocked");
      },
      setItem() {},
    }).warning,
  );
});
test("B1-11｜遍歷可達設備狀態，每個非終局均有合法操作路徑抵達工單", () => {
  const key = (s: State) =>
    JSON.stringify([
      s.wired,
      s.power,
      s.valves,
      s.water,
      s.checkClosed,
      s.traceSeen,
      s.door,
    ]);
  const actions: Action[] = [
    ...(Object.keys(loads) as Load[]).map(
      (load) => ({ type: "power", load }) as Action,
    ),
    ...valves.map((valve) => ({ type: "valve", valve }) as Action),
    { type: "trace" },
    { type: "drain" },
    { type: "door" },
  ];
  const start = fresh(),
    q = [start],
    states = new Map([[key(start), start]]),
    reverse = new Map<string, Set<string>>();
  for (let i = 0; i < q.length; i++) {
    const s = q[i];
    if (s.door) continue;
    const next = actions.map((a) => act(s, a).state);
    if (!s.wired) next.push(wire(s));
    for (const n of next) {
      assert.ok(restore(JSON.stringify(n)), "所有可達狀態都能存讀檔");
      const from = key(s),
        to = key(n);
      if (!reverse.has(to)) reverse.set(to, new Set());
      reverse.get(to)!.add(from);
      if (!states.has(to)) {
        states.set(to, n);
        q.push(n);
      }
    }
    assert.ok(q.length < 20000, "抽象狀態應有限");
  }
  const ends = q.filter((s) => s.door).map(key),
    reachable = new Set(ends),
    back = [...ends];
  for (let i = 0; i < back.length; i++)
    for (const prev of reverse.get(back[i]) || [])
      if (!reachable.has(prev)) {
        reachable.add(prev);
        back.push(prev);
      }
  assert.ok(ends.length);
  assert.equal(reachable.size, states.size);
  console.log(
    `B1 可達設備狀態 ${states.size}；每個非終局都有通關路徑。部分接線另枚舉 1546 種。`,
  );
});
