import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 只驗證未實作擴充版的內容與設計規則，不冒充遊戲操作測試。
const proposal = JSON.parse(readFileSync(new URL("../content/expanded-story-proposal.json", import.meta.url), "utf8"));
const puzzle = (id: string) => proposal.puzzles.find((p: { id: string }) => p.id === id);
const minutes = (s: string) => s.split(":").map(Number).reduce((h, m) => h * 60 + m);
function permutations<T>(xs: T[]): T[][] {
  if (!xs.length) return [[]];
  return xs.flatMap((x, i) => permutations(xs.filter((_, n) => n !== i)).map(rest => [x, ...rest]));
}

test("擴充提案與短版分開：四層、九題、唯一編號、每題三級提示", () => {
  assert.equal(proposal.status, "proposal");
  assert.deepEqual(proposal.layers.map((v: { id: string }) => v.id), ["L0", "B1", "B2", "B3"]);
  assert.deepEqual(proposal.puzzles.map((v: { id: string }) => v.id), Array.from({ length: 9 }, (_, i) => `EP0${i + 1}`));
  for (const p of proposal.puzzles) assert.equal(p.hints.length, 3, p.id);
  assert.match(proposal.versionBoundary, /不替換短版/);
});

test("EP01：枚舉 120 種五回路排列，線索只有一解", () => {
  const p = puzzle("EP01");
  const valid = permutations<string>(p.slots).filter(a => {
    const at = (name: string) => a.indexOf(name);
    return at("照明") < at("通訊") && at("通訊") < at("排風") &&
      at("門鎖") === at("泵浦") + 1 && Math.abs(at("通訊") - at("泵浦")) === 2 && at("排風") !== 4;
  });
  assert.deepEqual(valid, [p.solution]);
});

test("EP02／03：水路通向排水井，四格電力不能同時排水及開門", () => {
  assert.deepEqual(puzzle("EP02").solution, { A: "開", B: "開", C: "關", D: "關" });
  const { capacity, loads } = puzzle("EP03");
  assert.equal(loads["應急照明"] + loads["泵浦"], capacity);
  assert.ok(loads["應急照明"] + loads["門鎖"] <= capacity);
  assert.ok(loads["應急照明"] + loads["門鎖"] + loads["泵浦"] > capacity);
  assert.match(puzzle("EP03").solution[2], /止回閥/);
});

test("EP04：原始顯示依來源校正，五件事件落在同一條七分鐘時間線", () => {
  const p = puzzle("EP04"), c = p.calibration;
  assert.equal(minutes(c.terminalDisplay) - minutes(c.standard), c.terminalOffsetMinutes);
  assert.equal(minutes(c.cctvDisplay) - minutes(c.standard), c.cctvOffsetMinutes);
  for (const e of p.events) {
    const offset = e.source === "控制終端" ? c.terminalOffsetMinutes : c.cctvOffsetMinutes;
    assert.equal(minutes(e.display) - offset, minutes(e.corrected), e.event);
  }
  assert.deepEqual(p.events.map((e: { corrected: string }) => e.corrected), ["01:17", "01:19", "01:20", "01:22", "01:24"]);
});

test("EP05：錄音依校正時間排列，剪接字句確實出自原文", () => {
  const p = puzzle("EP05");
  const ordered = [...p.clips].sort((a, b) => minutes(a.correctedTime.slice(0, 5)) - minutes(b.correctedTime.slice(0, 5)));
  assert.deepEqual(ordered.map(v => v.id), p.solution);
  const warning = p.clips.find((v: { id: string }) => v.id === "B").quote;
  assert.match(warning, /不要重新接通通訊/);
  assert.ok(warning.includes(p.editedBroadcast.replace("。", "")));
});

test("EP06：依兩項權限及校正後停用時間排除卡片，唯一 D", () => {
  const p = puzzle("EP06");
  const valid = p.cards.filter((c: { permissions: string[]; deactivationCorrectedTime?: string }) =>
    ["門鎖", "導引系統"].every(v => c.permissions.includes(v)) &&
    (!c.deactivationCorrectedTime || minutes(c.deactivationCorrectedTime) > minutes(p.operationCorrectedTime)));
  assert.deepEqual(valid.map((c: { id: string }) => c.id), [p.solution]);
  const b = p.cards.find((v: { id: string }) => v.id === "B");
  assert.equal(minutes(b.deactivationTerminalDisplay) - puzzle("EP04").calibration.terminalOffsetMinutes, minutes(b.deactivationCorrectedTime));
  assert.equal(p.scheduleId, proposal.recordedHypothesis.scheduleId);
});

test("EP07：枚舉 16 組開關，僅 A/C 開且 B/D 關能保光、保梯、停導引", () => {
  const valid = Array.from({ length: 16 }, (_, n) => [0, 1, 2, 3].map(bit => Boolean(n & (1 << bit))))
    .filter(([a, b, c, d]) => a && c && !((a && b) || (c && d)));
  assert.deepEqual(valid, [[true, false, true, false]]);
  assert.deepEqual(puzzle("EP07").solution, { A: "接通", B: "斷開", C: "接通", D: "斷開" });
  assert.equal(proposal.powerBoundary.inspectionTerminal, "A && K-CTRL");
  assert.equal(proposal.powerBoundary.elevator, "C");
});

test("EP08：搜尋鎖栓狀態，最短為三步且接受 A/B/D 任意順序", () => {
  const p = puzzle("EP08");
  const mask = (values: number[]) => values.reduce((n, v) => n | (1 << (v - 1)), 0);
  const start = mask(p.initialExtended);
  const toggle = (n: number, h: string) => n ^ mask(p.handles[h]);
  const queue: [number, number][] = [[start, 0]], visited = new Set([start]);
  let shortest = -1;
  while (queue.length) {
    const [state, steps] = queue.shift()!;
    if (state === 0) { shortest = steps; break; }
    for (const h of Object.keys(p.handles)) {
      const next = toggle(state, h);
      if (!visited.has(next)) { visited.add(next); queue.push([next, steps + 1]); }
    }
  }
  assert.equal(shortest, 3);
  for (const order of permutations<string>(p.solutionOneOfShortest)) assert.equal(order.reduce(toggle, start), 0);
  assert.equal(toggle(toggle(start, "C"), "C"), start);
});

type State = Record<string, boolean>;
const model = puzzle("EP09").safetyModel;
function apply(state: State, action: string): State {
  const { requires, sets } = model.rules[action];
  return Object.entries(requires).every(([key, value]) => state[key] === value) ? { ...state, ...sets } : { ...state };
}
const exitReady = (state: State) => Object.entries(model.exitRequires).every(([key, value]) => state[key] === value);

test("EP09：備份與停用可交換先後，接收指令不等於完成", () => {
  for (const actions of [
    ["backup", "requestDisable", "receiveCompletion", "safeShutdown", "unlock"],
    ["requestDisable", "receiveCompletion", "backup", "safeShutdown", "unlock"],
  ]) assert.ok(exitReady(actions.reduce(apply, model.initial)));
  const received = ["backup", "requestDisable", "safeShutdown", "unlock"].reduce(apply, model.initial);
  assert.equal(received.controllerOn, true);
  assert.equal(exitReady(received), false);
});

test("EP09：提前實體斷電可復原，缺少任一離站條件均不能離站", () => {
  const cut = apply(model.initial, "physicalCut");
  assert.equal(cut.controllerOn, false);
  assert.equal(exitReady(apply(cut, "unlock")), false);
  const recovered = ["restore", "requestDisable", "receiveCompletion", "backup", "safeShutdown", "unlock"].reduce(apply, cut);
  assert.ok(exitReady(recovered));
  for (const key of Object.keys(model.exitRequires)) assert.equal(exitReady({ ...recovered, [key]: !recovered[key] }), false, key);
  assert.equal(apply(recovered, "restore").resetDisabled, true, "正式停用應跨復電保留");
});

test("EP09：窮舉可達設計狀態，解鎖不能繞過備份、停用、主控隔離、照明及備援", () => {
  for (const lightingPower of [true, false]) for (const backupPower of [true, false]) for (const key of [true, false]) {
    const queue: State[] = [{ ...model.initial, lightingPower, backupPower, key }], seen = new Set<string>();
    while (queue.length) {
      const state = queue.shift()!, encoded = JSON.stringify(state);
      if (seen.has(encoded)) continue;
      seen.add(encoded);
      if (state.unlocked) assert.ok(state.backup && state.resetDisabled && !state.controllerOn && state.lightingPower && state.backupPower && state.key);
      for (const action of model.actions) queue.push(apply(state, action));
    }
  }
});

test("每個因果結論均引用現存文件，文件原文與閱讀版同步", () => {
  const ids = proposal.documents.map((d: { id: string }) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 14);
  const md = readFileSync(new URL("../docs/Expanded-Story-Evidence.md", import.meta.url), "utf8");
  for (const d of proposal.documents) {
    assert.ok(proposal.layers.some((l: { id: string }) => l.id === d.layer));
    for (const field of ["text", "unlock", "supports", "doesNotProve"]) {
      assert.ok(d[field].length > 0, `${d.id}.${field}`);
      assert.ok(md.includes(d[field]), `${d.id}.${field} 與閱讀版不同步`);
    }
  }
  for (const claim of proposal.claims) {
    assert.ok(claim.evidence.length >= 2, claim.id);
    for (const id of claim.evidence) assert.ok(ids.includes(id), `${claim.id} 引用不存在的 ${id}`);
  }
});

test("敘事界線：原音晚於工單建立、早於封存，今晚送達分開記錄", () => {
  const accident = proposal.timeline.filter((v: { era: string }) => v.era === "事故當晚");
  const times = accident.map((v: { time: string }) => minutes(v.time));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  const created = accident.find((v: { event: string }) => v.event.includes("建立 Q-017"));
  const sealed = accident.find((v: { event: string }) => v.event.includes("錄音封存"));
  const warning = puzzle("EP05").clips.find((v: { id: string }) => v.id === "B");
  assert.ok(minutes(created.time) < minutes(warning.correctedTime));
  assert.ok(minutes(warning.correctedTime) < minutes(sealed.time));
  assert.deepEqual(proposal.timeline.filter((v: { era: string }) => v.era === "今晚").map((v: { time: string }) => v.time), ["01:16", "01:17"]);
  assert.ok(proposal.ending.stages.some((s: string) => s.includes("不覆寫原始名冊")));
});

test("EP06 的前置文件不直接洩漏憑證答案，正確檢索後才出現完整欄位", () => {
  const before = proposal.documents.find((d: { id: string }) => d.id === "D04");
  const after = proposal.documents.find((d: { id: string }) => d.id === "D05");
  assert.ok(!before.text.includes("憑證索引 D"));
  assert.match(before.text, /索引欄缺頁/);
  assert.match(after.unlock, /EP06 正確/);
  assert.match(after.text, /當次使用 D 權限/);
});
