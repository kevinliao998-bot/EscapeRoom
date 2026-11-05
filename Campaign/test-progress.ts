import assert from "node:assert/strict";
import { fresh, act, restore, type State, type Action } from "./model.ts";
import { story } from "../Game/src/core.ts";

// 透過合法遊戲動作建立測試進度；不偽造已完成旗標。
export function step(s: State, a: Action) {
  const r = act(s, a);
  assert.ok(
    restore(JSON.stringify(r.state)),
    `有效操作必須可讀檔：${JSON.stringify(a)} / ${r.message}`,
  );
  return r.state;
}
export function prologue() {
  let s = fresh();
  for (const a of [
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
    { type: "mountBattery" },
    { type: "mountFilm" },
    ...story.route.answer.map((value) => ({ type: "node", value })),
  ])
    s = step(s, { type: "base", action: a });
  return s;
}
export function b1() {
  let s = step(prologue(), { type: "travel", floor: "B1" });
  const order = ["照明", "通訊", "排風", "泵浦", "門鎖"] as const;
  order.forEach(
    (c, slot) =>
      (s = step(s, {
        type: "b1",
        action: { type: "place", circuit: c, slot },
      })),
  );
  for (const a of [
    { type: "wire" },
    { type: "power", load: "comm" },
    { type: "power", load: "fan" },
    { type: "trace" },
    { type: "power", load: "pump" },
    { type: "valve", valve: "C" },
    { type: "valve", valve: "D" },
    { type: "drain" },
    { type: "power", load: "pump" },
    { type: "power", load: "lock" },
    { type: "door" },
  ] as const)
    s = step(s, { type: "b1", action: a });
  return s;
}
export function b2() {
  let s = step(b1(), { type: "travel", floor: "B2" });
  s = step(s, { type: "read", id: "D07" });
  s = step(s, { type: "offset", device: "terminal", value: 2 });
  s = step(s, { type: "offset", device: "cctv", value: -1 });
  for (const index of [0, 1, 2, 3, 4]) s = step(s, { type: "event", index });
  s = step(s, { type: "checkTime" });
  for (const id of ["C", "A", "D", "B"]) s = step(s, { type: "clip", id });
  s = step(s, { type: "checkAudio" });
  s = step(s, { type: "splice", id: "negation" });
  s = step(s, { type: "card", id: "D" });
  return s;
}
export function hatch() {
  let s = step(b2(), { type: "travel", floor: "B3" });
  for (const id of ["B", "D"] as const) s = step(s, { type: "switch", id });
  s = step(s, { type: "checkIsolation" });
  for (const id of ["D", "A", "B"] as const)
    s = step(s, { type: "handle", id });
  return s;
}
export function identity() {
  let s = hatch();
  for (const id of ["D07", "D08", "D09", "D10", "D11", "D12", "D06"])
    s = step(s, { type: "read", id });
  ["M-042", "U-017-03", "H-017-03"].forEach(
    (id, index) => (s = step(s, { type: "identity", index, id })),
  );
  return step(s, { type: "checkIdentity" });
}
export const finish = (input: State) => {
  let s = input;
  for (const id of ["A", "C", "B", "D"] as const)
    if (s.b3.power[id] !== ["A", "C"].includes(id))
      s = step(s, { type: "switch", id });
  for (const a of [
    { type: "restorePower" },
    { type: "backup" },
    { type: "request" },
    { type: "receipt" },
    { type: "shutdown" },
    { type: "unlock" },
    { type: "exit" },
  ] as const)
    s = step(s, a);
  return s;
};
