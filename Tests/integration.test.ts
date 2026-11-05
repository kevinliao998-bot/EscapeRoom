import { test } from "node:test";
import assert from "node:assert/strict";
import {
  act,
  fresh,
  valid,
  story,
  type State,
  type Action,
} from "../Game/src/core.ts";
import { load, save, exportSave, SAVE, PREV } from "../Game/src/storage.ts";
import { maps, pathfind, tile, walkable } from "../Game/src/maps.ts";

class MemoryStorage {
  data = new Map<string, string>();
  rejectWrites = false;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.rejectWrites) throw new Error("模擬儲存配額已滿");
    this.data.set(key, value);
  }
}
const storageOf = (memory: MemoryStorage) => memory as unknown as Storage;
const action = (event: string | Action): Action =>
  typeof event === "string" ? { type: event } : event;
// 每個動作都經過實際 core → storage → restore，模擬關卡中斷後繼續。
function session(initial = fresh(), memory = new MemoryStorage()) {
  let state = initial;
  return {
    memory,
    get state() {
      return state;
    },
    run(...events: (string | Action)[]) {
      for (const event of events) {
        const before = state;
        state = act(state, action(event)).state;
        assert.ok(valid(state), `動作 ${JSON.stringify(event)} 產生可恢復狀態`);
        assert.equal(save(state, storageOf(memory)), "");
        const restored = load(storageOf(memory));
        assert.equal(restored.warning, "");
        assert.deepEqual(restored.state, state);
        state = restored.state!;
        const count =
          Number(state.card) +
          Number(state.pry) +
          Number(state.film === "inventory") +
          Number(state.battery === "inventory");
        assert.ok(count <= 4);
        if (before.scene !== state.scene) {
          const point = tile(state.position.x, state.position.y);
          assert.ok(
            walkable(state.scene, point.x, point.y),
            "切場後腳底落在可走格",
          );
          assert.ok(
            pathfind(state.scene, state.position, maps[state.scene].spawn)
              .length ||
              (point.x ===
                tile(maps[state.scene].spawn.x, maps[state.scene].spawn.y).x &&
                point.y ===
                  tile(maps[state.scene].spawn.x, maps[state.scene].spawn.y).y),
          );
        }
      }
      return state;
    },
  };
}
type Session = ReturnType<typeof session>;
function solveRecords(s: Session) {
  s.run(
    "card",
    "pry",
    "enter",
    "openBox",
    "power",
    { type: "wave", value: story.waveOrder },
    "impression",
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: story.correctConclusion },
  );
  assert.ok(s.state.records);
}
function solveRoute(s: Session) {
  s.run(...story.route.answer.map((value) => ({ type: "node", value })));
  assert.ok(s.state.door && s.state.checkpoint);
}

test("INT-01｜劇情答案串接機關、三場景與逐步存讀檔，可抵達結局甲", () => {
  const s = session();
  // 這些固定預期來自 docs/Puzzle-Spec.md 的校準、證據及路線規格。
  assert.deepEqual(story.waveOrder, ["long", "short", "double"]);
  assert.equal(story.correctConclusion, 1);
  assert.deepEqual(story.route.answer, [
    "entry",
    "junction",
    "service",
    "exit",
  ]);
  solveRecords(s);
  s.run("film", "battery", "platform", "mountFilm", "mountBattery");
  solveRoute(s);
  s.run({ type: "end", value: "A" });
  assert.equal(s.state.lastEnding, "A");
  assert.deepEqual(s.state.seenEndings, ["A"]);
  assert.deepEqual(
    JSON.parse(exportSave(s.state, storageOf(s.memory))),
    s.state,
  );
});

test("INT-02｜漏拿撬片、路線片及電池後，跨場景存讀檔仍能補拿與通關", () => {
  const s = session();
  s.run("card", "enter", "openBox", "power");
  assert.equal(s.state.box, false);
  assert.equal(s.state.power, false);
  s.run(
    "back",
    "pry",
    "enter",
    "openBox",
    "power",
    { type: "wave", value: story.waveOrder },
    "impression",
    { type: "link", value: 1 },
    { type: "link", value: 0 },
    { type: "conclude", value: story.correctConclusion },
    "platform",
  );
  assert.equal(s.state.film, "source");
  assert.equal(s.state.battery, "source");
  s.run("mountFilm", "mountBattery", { type: "node", value: "entry" });
  assert.equal(s.state.door, false);
  s.run(
    "back",
    "film",
    "film",
    "battery",
    "battery",
    "platform",
    "mountBattery",
    "mountFilm",
  );
  solveRoute(s);
  s.run({ type: "end", value: "B" });
  assert.equal(s.state.lastEnding, "B");
});

test("INT-03｜錯誤波形、過度推論與錯路線不破壞前置成果，重載後可重試", () => {
  const s = session();
  s.run("card", "pry", "enter", "openBox", "power", {
    type: "wave",
    value: ["short", "long", "double"],
  });
  assert.equal(s.state.broadcast, false);
  assert.ok(s.state.power && s.state.pry);
  s.run(
    { type: "wave", value: story.waveOrder },
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: 1 },
  );
  assert.equal(s.state.records, false);
  s.run("impression", { type: "conclude", value: 2 });
  assert.equal(s.state.records, false);
  assert.deepEqual(s.state.links, [0, 1]);
  s.run(
    { type: "conclude", value: 1 },
    "film",
    "battery",
    "platform",
    "mountFilm",
    "mountBattery",
    { type: "node", value: "entry" },
    { type: "node", value: "north" },
    { type: "node", value: "exit" },
  );
  assert.deepEqual(s.state.path, ["entry"]);
  s.run("takeFilm", "mountFilm");
  assert.deepEqual(s.state.path, []);
  solveRoute(s);
});

test("INT-04｜雙結局重載與重選保留筆記、提示及通關紀錄", () => {
  const s = session();
  solveRecords(s);
  s.run("film", "battery", "platform", "mountBattery", "mountFilm");
  solveRoute(s);
  s.run({ type: "read", value: "tag" }, { type: "hint", value: "P05" });
  for (const ending of ["B", "A", "B"]) {
    s.run({ type: "end", value: ending });
    assert.equal(s.state.lastEnding, ending);
    s.run("reselect");
    assert.equal(s.state.lastEnding, null);
    assert.equal(s.state.scene, "platform");
    assert.ok(s.state.read.includes("tag"));
    assert.equal(s.state.hints.P05, 1);
  }
  assert.deepEqual(s.state.seenEndings, ["B", "A"]);
});

test("INT-05｜未取得的關鍵文件不進入筆記；三級提示存讀檔不代解謎", () => {
  const s = session();
  for (const id of [
    "broadcast",
    "report",
    "log",
    "roster",
    "impression",
    "route",
    "routeSolved",
  ])
    s.run({ type: "read", value: id });
  assert.equal(s.state.read.length, 0);
  for (let n = 0; n < 5; n++) s.run({ type: "hint", value: "P01" });
  assert.equal(s.state.hints.P01, 3);
  assert.equal(s.state.card, false);
  assert.equal(s.state.door, false);
  solveRecords(s);
  s.run(
    { type: "read", value: "report" },
    { type: "read", value: "log" },
    { type: "hint", value: "P02" },
  );
  assert.ok(s.state.read.includes("report") && s.state.read.includes("log"));
  assert.equal(s.state.hints.P01, 3);
  assert.equal(s.state.hints.P02, 1);
});

test("INT-06｜主要存檔損壞時，備援可接回關卡且原文保留", () => {
  const s = session();
  solveRecords(s);
  const previous = JSON.parse(s.memory.getItem(PREV)!);
  s.memory.setItem(SAVE, "損壞的 JSON");
  const recovered = load(storageOf(s.memory));
  assert.ok(recovered.warning);
  assert.deepEqual(recovered.state, previous);
  assert.equal(s.memory.getItem(SAVE), "損壞的 JSON");
  const resumed = session(recovered.state!, s.memory);
  resumed.run(
    { type: "conclude", value: 1 },
    "film",
    "battery",
    "platform",
    "mountFilm",
    "mountBattery",
  );
  solveRoute(resumed);
  assert.equal(s.memory.getItem(SAVE + "-corrupt"), "損壞的 JSON");
});

test("INT-07｜儲存配額滿後匯出，必須包含尚未成功寫入的最新進度", () => {
  const memory = new MemoryStorage();
  const old = fresh();
  assert.equal(save(old, storageOf(memory)), "");
  const current = act(old, { type: "card" }).state;
  memory.rejectWrites = true;
  assert.ok(save(current, storageOf(memory)), "寫入失敗要有警告");
  assert.equal(load(storageOf(memory)).state?.card, false, "磁碟仍是舊進度");
  const exported = JSON.parse(exportSave(current, storageOf(memory)));
  assert.equal(exported.card, true, "匯出救援應保留剛取得的門禁卡");
  assert.deepEqual(exported, current);
});
