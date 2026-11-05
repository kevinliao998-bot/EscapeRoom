import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gitTextBlobSha1 } from "../Tests/git-text.ts";
import {
  fresh,
  act,
  restore,
  exitReady,
  canRead,
  isolationReady,
  guidanceOn,
  terminalOn,
  sourceDoc,
  type State,
  type Action,
} from "./model.ts";
import { story } from "../Game/src/core.ts";
import { KEY, load, save, exportCurrent, type Store } from "./storage.ts";
import { spots } from "./world-data.ts";
import {
  step,
  prologue,
  b1,
  b2,
  hatch,
  identity,
  finish,
} from "./test-progress.ts";
export { prologue, b1, b2, hatch, identity } from "./test-progress.ts";

test("MF-01｜新局經原五題及 B1–B3 九題，到告別結局，每步存檔可恢復", () => {
  const s = finish(identity());
  assert.equal(s.floor, "end");
  assert.ok(s.b3.exited);
  assert.ok(exitReady(s));
  assert.ok(s.read.includes("D14"));
  assert.equal(s.base.lastEnding, null);
  assert.ok(restore(exportCurrent(s)));
});
test("MF-02｜未解開樓層不可跳關；所有已開門均可返回，跨層進度保留", () => {
  assert.equal(act(fresh(), { type: "travel", floor: "B3" }).state.floor, "L0");
  let s = identity();
  for (const floor of ["B2", "B1", "L0", "B1", "B2", "B3"] as const) {
    s = step(s, { type: "travel", floor });
    assert.equal(s.floor, floor);
    assert.ok(s.b3.verified);
    assert.ok(s.b2.key);
    assert.ok(s.b1.door);
  }
  assert.equal(finish(s).floor, "end");
});
test("MF-03｜校時錯誤、事件反排、錯錄音不清草稿；成功後憑證仍需自行推理", () => {
  let s = step(b1(), { type: "travel", floor: "B2" });
  for (const index of [4, 3, 2, 1, 0]) s = step(s, { type: "event", index });
  s = step(s, { type: "checkTime" });
  assert.equal(s.b2.timeline, false);
  assert.deepEqual(s.b2.events, [4, 3, 2, 1, 0]);
  assert.equal(canRead(s, "D04"), false);
  s = b2();
  assert.equal(s.b2.key, true);
  s.b2.key = false;
  s.read = s.read.filter((x) => x !== "D05");
  for (const id of ["A", "B", "C"]) {
    const r = act(s, { type: "card", id });
    assert.equal(r.state.b2.key, false);
    assert.equal(r.state.b2.splice, true);
  }
  assert.ok(act(s, { type: "card", id: "B" }).message.includes("01:23"));
});
test("MF-04｜原音保留否定與警告，D04 不提前洩漏 D 或自動觸發", () => {
  assert.ok(!sourceDoc("D04").text.includes("D 權限"));
  assert.ok(!sourceDoc("D04").text.includes("TIMER"));
  assert.match(sourceDoc("D12").text, /不要重新接通通訊/);
  let s = b2();
  s.b2.splice = false;
  assert.equal(
    act(s, { type: "splice", id: "identity" }).state.b2.splice,
    false,
  );
  assert.match(
    act(s, { type: "splice", id: "identity" }).message,
    /不能證明當下在線/,
  );
  assert.equal(act(fresh(), { type: "read", id: "D10" }).state.read.length, 0);
});
test("MF-05｜16 組雙路供電僅 A/C 通、B/D 斷為解，切導引後終端仍有電", () => {
  const start = step(b2(), { type: "travel", floor: "B3" });
  let solutions = 0;
  for (let n = 0; n < 16; n++) {
    let s = structuredClone(start);
    (["A", "B", "C", "D"] as const).forEach(
      (k, i) => (s.b3.power[k] = !!(n & (1 << i))),
    );
    const r = act(s, { type: "checkIsolation" }).state;
    if (r.b3.isolated) {
      solutions++;
      assert.ok(terminalOn(r));
      assert.equal(guidanceOn(r), false);
    }
  }
  assert.equal(solutions, 1);
});
test("MF-06｜互鎖 D→A→B 中間狀態及任意可達栓態均可解；重複不死鎖", () => {
  let s = step(b2(), { type: "travel", floor: "B3" });
  for (const id of ["B", "D"] as const) s = step(s, { type: "switch", id });
  s = step(s, { type: "checkIsolation" });
  const seen = new Set<number>(),
    q = [s];
  while (q.length) {
    const x = q.shift()!;
    if (seen.has(x.b3.bolts)) continue;
    seen.add(x.b3.bolts);
    for (const id of ["A", "B", "C", "D"] as const) {
      const r = step(x, { type: "handle", id });
      if (!seen.has(r.b3.bolts)) q.push(r);
    }
  }
  assert.equal(seen.size, 16);
  s = step(s, { type: "handle", id: "D" });
  assert.equal(s.b3.bolts, 5);
  s = step(s, { type: "handle", id: "A" });
  assert.equal(s.b3.bolts, 6);
  s = step(s, { type: "handle", id: "B" });
  assert.equal(s.b3.bolts, 0);
  assert.ok(s.b3.hatch);
  assert.equal(step(s, { type: "handle", id: "C" }).b3.bolts, 0);
});
test("MF-07｜提早 K-CTRL 斷電可復原；接收不等於完成；備份與停用可交換", () => {
  for (const order of [
    ["backup", "request", "receipt"],
    ["request", "receipt", "backup"],
  ] as const) {
    let s = identity();
    s = step(s, { type: "cut" });
    s = step(s, { type: "backup" });
    assert.equal(s.b3.backup, false);
    s = step(s, { type: "restorePower" });
    s = step(s, { type: "request" });
    s = step(s, { type: "shutdown" });
    assert.equal(s.b3.controller, true);
    for (const type of order) s = step(s, { type });
    s = step(s, { type: "shutdown" });
    s = step(s, { type: "unlock" });
    assert.ok(exitReady(s));
    assert.ok(s.b3.disabled);
    assert.ok(s.b3.power.A && s.b3.power.C);
  }
});
test("MF-08｜可達供電與停機抽象狀態皆有恢復通關路徑", () => {
  const start = identity();
  const key = (s: State) =>
    JSON.stringify([
      s.b3.power,
      s.b3.controller,
      s.b3.backup,
      s.b3.requested,
      s.b3.disabled,
      s.b3.unlocked,
    ]);
  const q = [start],
    seen = new Set<string>();
  const actions: Action[] = [
    ...(["A", "B", "C", "D"] as const).map((id) => ({
      type: "switch" as const,
      id,
    })),
    ...(
      [
        "cut",
        "restorePower",
        "backup",
        "request",
        "receipt",
        "shutdown",
        "unlock",
      ] as const
    ).map((type) => ({ type })),
  ];
  while (q.length) {
    const s = q.shift()!,
      k = key(s);
    if (seen.has(k)) continue;
    seen.add(k);
    assert.equal(finish(s).floor, "end");
    for (const a of actions) {
      const n = step(s, a);
      if (!seen.has(key(n))) q.push(n);
    }
  }
  console.log("MF-08 reachable safety states:", seen.size);
  assert.ok(seen.size > 100);
});
test("MF-09｜身分鏈需多份原件，不讓醫療未具名或 D 權限替代林沐身分", () => {
  let s = hatch();
  ["M-042", "U-017-03", "H-017-03"].forEach(
    (id, index) => (s = step(s, { type: "identity", index, id })),
  );
  s = step(s, { type: "checkIdentity" });
  assert.equal(s.b3.verified, false);
  assert.equal(act(s, { type: "backup" }).state.b3.backup, false);
  assert.match(sourceDoc("D10").text, /未具名/);
  assert.match(sourceDoc("D11").text, /共用管理帳號/);
  assert.equal(identity().b3.verified, true);
});
test("MF-10｜損壞存檔、偽造前置與未知文件拒絕，備援讀回且保留原文", () => {
  const data = new Map<string, string>(),
    store: Store = {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => {
        data.set(k, v);
      },
    };
  const s = b2();
  assert.equal(save(s, store), "");
  assert.equal(save(identity(), store), "");
  data.set(KEY, "broken");
  const r = load(store);
  assert.ok(r.state?.b2.key);
  assert.equal(data.get(KEY + "-corrupt"), "broken");
  const bad = fresh();
  bad.b3.verified = true;
  assert.equal(restore(JSON.stringify(bad)), null);
  const badRead = fresh();
  badRead.read = ["constructor"];
  assert.equal(restore(JSON.stringify(badRead)), null);
});
test("MF-11｜配額滿匯出仍是最新進度；不寫原版或 B1 的存檔 key", () => {
  const writes: string[] = [];
  const store: Store = {
    getItem: () => null,
    setItem: (k) => {
      writes.push(k);
      throw new Error("quota");
    },
  };
  const s = identity();
  assert.match(save(s, store), /失敗/);
  assert.ok(restore(exportCurrent(s))?.b3.verified);
  assert.deepEqual(writes, [KEY]);
});
test("MF-12｜九個擴充房間有具名互動點，可走近座標在無障礙通路內", () => {
  assert.equal(Object.keys(spots).length, 9);
  for (const list of Object.values(spots)) {
    assert.equal(list.length, 3);
    assert.equal(new Set(list.map((s) => s.id)).size, 3);
    for (const p of list) {
      assert.ok(p.x >= 80 && p.x <= 440);
      assert.equal(p.y, 111);
    }
  }
});

test("MF-13｜釘選劇情原文、唯一流程節點及驗收表同步", () => {
  const raw = readFileSync(
    new URL("../Expansion/proposal.json", import.meta.url),
  );
  const blob = gitTextBlobSha1(raw);
  assert.equal(blob, "6fec278b1f1276ef9748f1be97d06980a9e3ccff");
  const flow = readFileSync(new URL("./flow.mmd", import.meta.url), "utf8");
  const verify = readFileSync(new URL("./Verify.md", import.meta.url), "utf8");
  const ids = [...flow.matchAll(/\b(MF_[A-Z0-9_]+)\[/g)].map((m) => m[1]);
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  for (const id of ids) assert.ok(verify.includes(id), id);
  const s = finish(identity());
  for (let i = 1; i <= 14; i++)
    assert.ok(canRead(s, "D" + String(i).padStart(2, "0")));
});
