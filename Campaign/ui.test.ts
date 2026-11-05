import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Script } from "node:vm";
import ts from "typescript";
import * as model from "./model.ts";
import * as storage from "./storage.ts";
import * as panels from "./panels.ts";
import * as base from "../Game/src/core.ts";
import { maps } from "../Game/src/maps.ts";
import * as b1model from "../Expansion/model.ts";
import { spots } from "./world-data.ts";
import { prologue, b1, b2, identity, finish, step } from "./test-progress.ts";

// 執行真實 main/prologue 及其事件處理，僅替代瀏覽器容器、焦點及 Phaser。
// 檢查產出的 HTML 與儲存副作用；CSS、真實選檔、讀屏另以正式瀏覽器複驗。
function page(initial: model.State, options: { failSave?: boolean } = {}) {
  type Listener = { fn: (event: any) => unknown; signal?: AbortSignal };
  class Surface {
    innerHTML = "";
    textContent = "";
    scrollTop = 0;
    id = "";
    value = "";
    type = "";
    accept = "";
    hidden = false;
    children: Surface[] = [];
    files: { text(): Promise<string> }[] = [];
    listeners = new Map<string, Listener[]>();
    classList = {
      toggle() {},
      contains() {
        return false;
      },
    };
    addEventListener(
      type: string,
      fn: Listener["fn"],
      opts?: { signal?: AbortSignal },
    ) {
      this.listeners.set(type, [
        ...(this.listeners.get(type) || []),
        { fn, signal: opts?.signal },
      ]);
    }
    async emit(type: string, event: unknown) {
      for (const listener of this.listeners.get(type) || [])
        if (!listener.signal?.aborted) await listener.fn(event);
    }
    insertAdjacentHTML(_position: string, html: string) {
      this.innerHTML += html;
    }
    replaceChildren() {
      this.innerHTML = "";
    }
    setAttribute() {}
    querySelector(selector: string): Surface | null {
      if (
        selector === ".panel-body" &&
        this.innerHTML.includes('class="panel-body"')
      )
        return body;
      if (
        selector === ".panel-body h2" &&
        this.innerHTML.includes('class="panel-body"')
      )
        return heading;
      if (selector === ".panel" && this.innerHTML.includes('class="panel"'))
        return dialog;
      if (selector === "h2") return heading;
      return null;
    }
    querySelectorAll() {
      return [];
    }
    click() {}
  }
  const ui = new Surface(),
    body = new Surface(),
    heading = new Surface(),
    dialog = new Surface(),
    world = new Surface(),
    window = new Surface();
  let file: Surface;
  const values = new Map([[storage.KEY, JSON.stringify(initial)]]);
  const document = {
    querySelector: (selector: string) =>
      selector === "#ui" ? ui : selector === "#world" ? world : null,
    createElement: (tag: string) => {
      const el = new Surface();
      if (tag === "input") file = el;
      return el;
    },
    body: { classList: { toggle() {} }, append() {} },
    documentElement: { style: { setProperty() {} } },
    fonts: { ready: Promise.resolve() },
  };
  class FakeGame {
    listener?: () => void;
    events = {
      once: (_event: string, fn: () => void) => {
        this.listener = fn;
      },
    };
    destroy() {
      this.listener?.();
    }
  }
  class FakeStation {
    sys = { isActive: () => false };
    host: any;
    constructor(host: any) {
      this.host = host;
    }
    redraw() {}
    goto(spot: unknown) {
      this.host.inspect(spot);
    }
  }
  class FakeDungeon {
    host: any;
    constructor(host: any) {
      this.host = host;
    }
    refresh() {}
    goto(id: string) {
      this.host.inspect(id);
    }
  }
  const modules: Record<string, unknown> = {
    phaser: {
      Game: FakeGame,
      CANVAS: 1,
      Core: { Events: { DESTROY: "destroy" } },
      Scale: { NONE: 0 },
    },
    "./model.ts": model,
    "./storage.ts": storage,
    "./panels.ts": panels,
    "./world.ts": { Dungeon: FakeDungeon, spots },
    "../Game/src/core.ts": base,
    "../Game/src/maps.ts": { maps },
    "../Expansion/model.ts": b1model,
    "../Game/src/world.ts": { Station: FakeStation },
    "../Game/src/focus.ts": {
      UiFocus: class {
        capture(root: Surface) {
          return {
            panel: root.innerHTML.match(/data-panel="([^"]+)"/)?.[1] || "",
          };
        }
        openFrom() {}
        restore() {}
      },
    },
    "../Game/src/audio.ts": {
      defaults: {
        large: false,
        reduced: true,
        subtitles: true,
        mute: true,
        master: 0.45,
        ambient: 0.2,
        effects: 0.35,
        voice: 0.4,
      },
      Sound: class {
        play() {}
        marker() {}
      },
    },
  };
  function execute(name: string) {
    const ref = process.env.CAMPAIGN_UI_BASELINE_REF;
    if (ref) assert.match(ref, /^[a-f0-9]{40}$/);
    const original = ref
      ? execFileSync("git", ["show", `${ref}:Campaign/${name.slice(2)}`], {
          cwd: new URL("../", import.meta.url),
          encoding: "utf8",
        })
      : readFileSync(new URL(name, import.meta.url), "utf8");
    const source = original
      .replaceAll("import.meta.env.BASE_URL", '"/"')
      .replaceAll("import.meta.hot", "false");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    const exports: Record<string, any> = {};
    new Script(output, { filename: name }).runInNewContext({
      exports,
      require: (id: string) => {
        if (id.endsWith(".css")) return {};
        assert.ok(id in modules, `未明列的測試模組：${id}`);
        return modules[id];
      },
      document,
      window,
      HTMLElement: Surface,
      AbortController,
      innerWidth: 1920,
      innerHeight: 1080,
      addEventListener: window.addEventListener.bind(window),
      localStorage: {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, value: string) => {
          if (options.failSave) throw new Error("quota");
          values.set(k, value);
        },
      },
      URL,
      Blob,
      setTimeout: () => 0,
    });
    return exports;
  }
  modules["./prologue.ts"] = execute("./prologue.ts");
  execute("./main.ts");
  const settle = async () => {
    for (let n = 0; n < 8; n++) await Promise.resolve();
  };
  return {
    html: () => ui.innerHTML,
    saved: () => values.get(storage.KEY),
    async click(action: string) {
      assert.ok(
        ui.innerHTML.includes(`data-action="${action}"`),
        `畫面缺少操作 ${action}`,
      );
      const target = {
        dataset: { action },
        closest() {
          return this;
        },
      };
      await ui.emit("click", { target });
      await settle();
    },
    async choose(raw: string | (() => Promise<string>)) {
      file!.files = [{ text: typeof raw === "string" ? async () => raw : raw }];
      file!.value = "test.json";
      await file!.emit("change", { target: file! });
      await settle();
      assert.equal(file!.value, "", "重選同一檔案仍須觸發 change");
    },
  };
}

async function door(state: model.State) {
  const view = page(step(state, { type: "travel", floor: "L0" }));
  await view.click("continue");
  await view.click("spot:maintenanceDoor");
  return view.html();
}
const rejected = /此 JSON 不是有效整合存檔，目前進度未改動/;

test("UI-16-01｜首次下樓維持未解狀態，不提前揭露後段身分或受理", async () => {
  const html = await door(prologue());
  assert.match(html, /仍有積水/);
  assert.match(html, /尚不足以回答妹妹的去向/);
  assert.doesNotMatch(html, /匿名個案|外部單位已受理/);
});
test("UI-16-02｜排水放行後回訪與讀檔，門文案反映安全水位及保持通路", async () => {
  const html = await door(model.restore(JSON.stringify(b1()))!);
  assert.match(html, /積水已排除/);
  assert.match(html, /隔離門已放行/);
  assert.doesNotMatch(html, /仍有積水/);
  assert.match(html, /尚不足以回答妹妹的去向/);
});
test("UI-16-03｜身分已核對但未離站，不提前宣稱外部受理", async () => {
  const html = await door(identity());
  assert.match(html, /已核對.*身分關聯/);
  assert.doesNotMatch(html, /尚不足以回答妹妹的去向|外部單位已受理/);
});
test("UI-16-04｜通關讀檔後回訪維修門，保留證據與官方尚待認定的邊界", async () => {
  const html = await door(model.restore(JSON.stringify(finish(identity())))!);
  assert.match(html, /原始證據已保全/);
  assert.match(html, /外部單位已受理/);
  assert.match(html, /尚未完成官方認定/);
  assert.doesNotMatch(html, /仍有積水|尚不足以回答妹妹的去向/);
});
test("UI-17-01｜主選單拒絕無效檔並提供狀態提示，不覆寫既有進度", async () => {
  const view = page(b2()),
    before = view.saved();
  await view.click("import");
  await view.choose('{"schema":1,"b3":{"verified":true}}');
  assert.match(view.html(), rejected);
  assert.match(view.html(), /role="status"/);
  assert.doesNotMatch(view.html(), /匯入已驗證/);
  assert.equal(view.saved(), before);
});
test("UI-17-02｜無效後重選合法檔，確認頁清除舊錯誤；取消不替換進度", async () => {
  const view = page(b2()),
    before = view.saved();
  await view.click("import");
  await view.choose("not json");
  await view.click("import");
  await view.choose(JSON.stringify(finish(identity())));
  assert.match(view.html(), /匯入已驗證的整合進度/);
  assert.doesNotMatch(view.html(), rejected);
  assert.equal(view.saved(), before);
  await view.click("close");
  assert.equal(view.saved(), before);
});
test("UI-17-03｜已保全證據後匯回較早 B2，介紹與存檔不殘留上一局完成訊息", async () => {
  const view = page(identity());
  await view.click("continue");
  await view.click("room:control");
  await view.click("spot:shutdown");
  await view.click("backup");
  assert.match(view.html(), /原始資料唯讀備份完成/);
  await view.click("request");
  await view.click("receipt");
  await view.click("shutdown");
  await view.click("close");
  await view.click("spot:elevator");
  await view.click("unlock");
  await view.click("exit");
  assert.match(view.html(), /證據已保全/);
  await view.click("menu");
  await view.click("import");
  const earlier = b2();
  await view.choose(JSON.stringify(earlier));
  await view.click("importApply");
  assert.match(view.html(), /被刪掉的七分鐘/);
  assert.doesNotMatch(view.html(), /證據已保全|原始資料唯讀備份完成/);
  const restored = model.restore(view.saved()!);
  assert.equal(restored?.floor, "B2");
  assert.equal(restored?.b3.backup, false);
});
test("UI-17-04｜檔案讀取失敗可見且不覆寫進度，再選同檔可恢復", async () => {
  const view = page(b2()),
    before = view.saved();
  await view.click("import");
  await view.choose(async () => {
    throw new Error("read failed");
  });
  assert.match(view.html(), /無法讀取.*目前進度未改動/);
  assert.equal(view.saved(), before);
  await view.click("import");
  await view.choose(JSON.stringify(b2()));
  assert.match(view.html(), /匯入已驗證/);
  assert.doesNotMatch(view.html(), /無法讀取/);
});
test("UI-17-05｜匯入清除暫時錯誤，但保留真正的儲存失敗警告", async () => {
  const view = page(b2(), { failSave: true });
  await view.click("import");
  await view.choose("invalid");
  await view.click("import");
  await view.choose(JSON.stringify(b2()));
  await view.click("importApply");
  assert.doesNotMatch(view.html(), rejected);
  assert.match(view.html(), /本機儲存失敗/);
});
test("UI-17-06｜舊檔案晚完成讀取，不得覆寫較新的合法確認結果", async () => {
  const view = page(b2());
  await view.click("import");
  let completeOld!: (raw: string) => void;
  const old = view.choose(
    () =>
      new Promise<string>((resolve) => {
        completeOld = resolve;
      }),
  );
  await view.click("import");
  await view.choose(JSON.stringify(b2()));
  completeOld("invalid");
  await old;
  assert.match(view.html(), /匯入已驗證/);
  assert.doesNotMatch(view.html(), rejected);
});
test("UI-17-07｜拒絕無效檔後匯入通關檔，套用與重載皆保留結局及證據", async () => {
  const view = page(b2());
  await view.click("import");
  await view.choose("invalid");
  await view.click("import");
  await view.choose(JSON.stringify(finish(identity())));
  await view.click("importApply");
  assert.match(view.html(), new RegExp(model.proposal.ending.title));
  assert.doesNotMatch(view.html(), rejected);
  const state = model.restore(view.saved()!)!;
  assert.equal(state.floor, "end");
  assert.ok(state.b3.backup && state.b3.exited);
  assert.match(page(state).html(), new RegExp(model.proposal.ending.title));
});
