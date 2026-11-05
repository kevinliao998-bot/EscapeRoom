import Phaser from "phaser";
import {
  fresh,
  act,
  restore,
  sourceDoc,
  proposal,
  floorNames,
  roomNames,
  rooms,
  canRead,
  terminalOn,
  type State,
  type Action,
  type Floor,
} from "./model.ts";
import { load, save, exportCurrent, KEY } from "./storage.ts";
import { runPrologue } from "./prologue.ts";
import { Dungeon, spots } from "./world.ts";
import { panelContent, btn, esc } from "./panels.ts";
import { UiFocus } from "../Game/src/focus.ts";
import { Sound, defaults, type Settings } from "../Game/src/audio.ts";
import {
  type Circuit,
  type Load,
  type Valve,
  documents as b1docs,
} from "../Expansion/model.ts";
import "../Game/src/style.css";
import "./style.css";
const store = {
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => localStorage.setItem(k, v),
};
const loaded = load(store);
let state = loaded.state || fresh(),
  warning = loaded.warning,
  feedback = loaded.warning,
  settings: Settings = { ...defaults };
try {
  const v = JSON.parse(localStorage.getItem(KEY + "-settings") || "{}");
  for (const k of Object.keys(defaults) as (keyof Settings)[])
    if (
      typeof v[k] === typeof defaults[k] &&
      (typeof v[k] !== "number" ||
        (Number.isFinite(v[k]) && v[k] >= 0 && v[k] <= 1))
    )
      (settings[k] as unknown) = v[k];
} catch {}
const ui = document.querySelector<HTMLDivElement>("#ui")!,
  focus = new UiFocus(),
  sound = new Sound();
let panel = "",
  stack: string[] = [],
  selected = "",
  nearby = "",
  menu = false,
  pendingImport: State | null = null,
  world: Dungeon | null = null,
  game: Phaser.Game | null = null,
  cleanup: (() => void) | null = null;
function resize() {
  const z = Math.floor(Math.min(innerWidth / 480, innerHeight / 270));
  document.documentElement.style.setProperty("--zoom", String(Math.max(1, z)));
  document.body.classList.toggle("too-small", z < 1);
}
addEventListener("resize", resize);
resize();
function applySettings() {
  document.body.classList.toggle("large", settings.large);
  document.body.classList.toggle("reduced", settings.reduced);
  sound.settings = settings;
  try {
    store.setItem(KEY + "-settings", JSON.stringify(settings));
  } catch {}
}
applySettings();
function persist() {
  warning = save(state, store);
  if (warning) feedback = warning;
}
function download(raw: string, name: string) {
  const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function send(a: Action) {
  const r = act(state, a);
  state = r.state;
  if (state.floor === "end") {
    panel = "";
    stack = [];
    menu = false;
  }
  if (r.message) feedback = r.message;
  persist();
  render();
  world?.refresh();
}
function recordPanelRead(id: string) {
  const docs: Record<string, (keyof typeof b1docs)[]> = {
    b1docs: ["work", "rack", "plugs"],
    power: ["capacity"],
    pipes: ["oldPipe"],
    check: ["check"],
    gate: ["sensor"],
  };
  for (const doc of docs[id] || [])
    state = act(state, { type: "b1", action: { type: "read", doc } }).state;
  if (id === "grid" || (id === "intro" && state.floor === "B3"))
    state = act(state, { type: "read", id: "D13" }).state;
}
function open(id: string) {
  focus.openFrom("spot:" + id);
  stack = [];
  panel = id;
  feedback = "";
  recordPanelRead(id);
  if (id === "b1docs")
    for (const doc of ["work", "rack", "plugs"] as const)
      state = act(state, { type: "b1", action: { type: "read", doc } }).state;
  if (id === "gateHistory")
    state = act(state, { type: "read", id: "D02" }).state;
  if (id === "gate" && state.b1.door)
    state = act(state, { type: "read", id: "D03" }).state;
  if (/^D\d\d$/.test(id)) {
    if (!canRead(state, id)) {
      feedback = "這份文件尚未解封。先核對現場機關。";
      panel = "";
    } else if (
      state.floor === "B3" &&
      id !== "D13" &&
      !state.read.includes(id) &&
      !terminalOn(state)
    ) {
      feedback = "檢修終端暫時無電，接回 A 與 K-CTRL。已讀副本仍可在筆記重看。";
      panel = "";
    } else state = act(state, { type: "read", id }).state;
  }
  persist();
  render();
  sound.play(
    id === "valves"
      ? "water"
      : /^D/.test(id) || id === "records"
        ? "paper"
        : "metal",
  );
}
function endCard() {
  return `<section class="ending"><small>原始記錄已保全 · 外部受理</small><h2>${proposal.ending.title}</h2><p>簽領單、連續影像、救援與醫療移交，把林沐與匿名個案連在一起。當年把手故障，她留下讓人群通過；自動復位覆寫了放行。更正申請與原件分開保存，外部單位已受理重新核對，尚未完成官方認定。</p><p>今晚收到的是舊工單補送。廣播不再重播；照明仍亮，升降梯帶你回到地面。</p><blockquote>${esc(proposal.ending.closingLine)}</blockquote>${btn("回到總控，重看證據", "travel:B3", 'class="primary"')}${btn("匯出通關進度", "export")}${btn("主選單", "menu")}</section>`;
}
function render() {
  if (state.floor === "L0") return;
  const before = focus.capture(ui),
    old = ui.querySelector(".panel-body"),
    scroll = old?.scrollTop || 0;
  const list = state.floor === "end" ? [] : rooms[state.floor];
  const index = list.indexOf(state.room as never);
  const backdrop = panel ? "inert" : "";
  const gameUI = `<div class="play-ui" ${backdrop}><aside class="inventory" aria-label="四格隨身物品"><small>隨身</small>${[
    ["卡", state.base.card, "門禁卡"],
    ["撬", state.base.pry, "撬片"],
    ["匙", state.b2.key, "同組檢修旁路鑰匙"],
    ["證", state.b3.backup, "唯讀證據包"],
  ]
    .map(([t, own, label]) =>
      btn(
        own
          ? t === "卡" || t === "撬"
            ? `<img src="${import.meta.env.BASE_URL}art/${t === "卡" ? "card" : "pry"}.png" alt="" width="16" height="16">`
            : t === "匙"
              ? '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h6v6H6v2h6v2h2v2h-4v-2H4V8H2zm2 2v2h2V4z"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3 1h8l3 3v11H3zm2 3v1h5V4zm0 4v1h6V8zm0 3v1h6v-1z"/></svg>'
          : "·",
        "item:" + t,
        `class="slot ${own ? "owned" : ""}" aria-label="${label}，${own ? "已取得" : "未取得"}" title="${label}"`,
      ),
    )
    .join(
      "",
    )}</aside><header class="location"><small>${state.floor}</small><h2>${roomNames[state.room] || "離站"}</h2></header><nav class="top-actions">${btn("筆記", "panel:journal")}${btn("提示", "panel:hint")}${btn("設定", "panel:settings")}</nav><div class="spots">${(spots[state.room] || []).map((p) => `<button class="spot" data-action="spot:${p.id}" aria-label="靠近並調查${p.label}" title="${p.label}" style="left:${p.x}px;top:${p.y}px"><i></i><span class="spot-label">${p.label}</span></button>`).join("")}</div><footer class="status campaign-status">${btn("◀ 上一室", "room:" + list[(index + 2) % 3])}<span id="near-label">${nearby ? "E · " + esc(nearby) : "方向鍵行走 · E 調查"}</span>${btn("下一室 ▶", "room:" + list[(index + 1) % 3])}${btn("樓層通道", "panel:stairs")}</footer></div>`;
  ui.innerHTML =
    state.floor === "end" && !menu
      ? endCard()
      : menu
        ? `<section class="opening"><small>整合主線 · L0 → B1 → B2 → B3</small><h2>黃燈之後</h2><p>繼續追查已讀原件，找出廣播、撤離與復位之間的矛盾。</p>${btn("繼續調查", "continue", 'class="primary"')}${btn("開始新調查", "panel:restart")}${btn("匯出目前進度", "export")}${btn("匯入整合 JSON", "import")}${warning ? `<p class="warning">${esc(warning)}</p>` : ""}</section>`
        : gameUI;
  if (feedback && !panel && !menu)
    ui.insertAdjacentHTML(
      "beforeend",
      `<div class="toast" role="status">${esc(feedback)}</div>`,
    );
  if (panel)
    ui.insertAdjacentHTML(
      "beforeend",
      `<div class="panel-shade"><section class="panel" data-panel="${panel}" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="panel-title"><div class="panel-top"><small>站務檔案 · ${state.floor}</small>${btn(stack.length ? "返回上一頁" : "關閉 ×", "close", 'aria-label="關閉或返回面板"')}</div><div class="panel-body">${panelContent(panel, state, settings, selected)}</div><p class="panel-feedback" role="status">${esc(feedback || warning)}</p></section></div>`,
    );
  const title = ui.querySelector(".panel-body h2");
  if (panel)
    for (const el of ui.children)
      if (el instanceof HTMLElement && !el.classList.contains("panel-shade"))
        el.inert = true;
  if (title) title.id = "panel-title";
  if (before.panel === panel && old)
    ui.querySelector(".panel-body")!.scrollTop = scroll;
  focus.restore(
    ui,
    before,
    state.floor + ":" + state.room + (menu ? ":menu" : ""),
    panel,
    ["panel:stairs", "continue", "travel:B3"],
  );
  applySettings();
}
async function mount(resume = false) {
  panel = "";
  stack = [];
  selected = "";
  menu = false;
  nearby = "";
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  if (game) {
    const oldGame = game;
    game = null;
    world = null;
    await new Promise<void>((resolve) => {
      oldGame.events.once(Phaser.Core.Events.DESTROY, resolve);
      oldGame.destroy(true);
    });
  }
  document.querySelector("#world")!.replaceChildren();
  ui.innerHTML = "";
  if (state.floor === "L0") {
    cleanup = runPrologue({
      state: state.base,
      settings,
      save: (b) => {
        state.base = b;
        persist();
      },
      settingsChanged: (v) => {
        settings = { ...v };
        applySettings();
      },
      export: () => download(exportCurrent(state), "黃燈之後-整合存檔.json"),
      restart: () => {
        state = fresh();
      },
      descend: () => {
        cleanup = null;
        state = act(state, { type: "travel", floor: "B1" }).state;
        state = act(state, { type: "read", id: "D01" }).state;
        persist();
        void mount(true);
      },
      resume,
      readIntake: () => {
        state = act(state, { type: "read", id: "D01" }).state;
        persist();
      },
      hasIntake: () => state.read.includes("D01"),
    });
    return;
  }
  world = new Dungeon({
    state: () => state,
    paused: () => !!panel || menu || state.floor === "end",
    inspect: open,
    nearby: (l) => {
      nearby = l;
      const el = document.querySelector("#near-label");
      if (el) el.textContent = l ? "E · " + l : "方向鍵行走 · E 調查";
    },
  });
  game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: 480,
    height: 270,
    parent: "world",
    backgroundColor: "#14191F",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scene: [world],
    audio: { noAudio: true },
    banner: false,
    scale: { mode: Phaser.Scale.NONE },
  });
  render();
  if (!resume && state.floor !== "end") menu = true;
  if (!state.read.includes("D01"))
    state = act(state, { type: "read", id: "D01" }).state;
  if (resume && state.floor !== "end") {
    panel = "intro";
    recordPanelRead(panel);
    persist();
  }
  render();
}
const file = document.createElement("input");
file.type = "file";
file.accept = "application/json,.json";
file.hidden = true;
document.body.append(file);
file.addEventListener("change", async () => {
  const f = file.files?.[0];
  if (!f) return;
  const raw = await f.text();
  pendingImport = restore(raw);
  if (!pendingImport) {
    feedback = "此 JSON 不是有效整合存檔，目前進度未改動。";
    render();
  } else {
    panel = "importConfirm";
    stack = [];
    render();
  }
  file.value = "";
});
ui.addEventListener("click", (e) => {
  if (state.floor === "L0") return;
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el) return;
  const [a, v, w] = el.dataset.action!.split(":");
  sound.play(
    ["valve", "drain"].includes(a)
      ? "water"
      : ["power", "switch", "handle", "cut", "unlock"].includes(a)
        ? "metal"
        : "paper",
  );
  if (a === "close") {
    panel = stack.pop() || "";
    feedback = "";
    render();
    return;
  }
  if (a === "spot") {
    world?.goto(v);
    return;
  }
  if (a === "panel") {
    if (panel) stack.push(panel);
    panel = v;
    feedback = "";
    recordPanelRead(v);
    if (v === "b1docs")
      for (const doc of ["work", "rack", "plugs"] as const)
        state = act(state, { type: "b1", action: { type: "read", doc } }).state;
    persist();
    render();
    return;
  }
  if (a === "doc") {
    const previous = [...stack, panel];
    open(v);
    if (panel) {
      stack = previous;
      render();
    }
    return;
  }
  if (a === "bdoc" || a === "baseDoc") {
    stack.push(panel);
    panel = a + "-" + v;
    render();
    return;
  }
  if (a === "room") {
    state = act(state, { type: "room", room: v }).state;
    panel = "";
    stack = [];
    feedback = "";
    persist();
    render();
    world?.refresh();
    return;
  }
  if (a === "travel") {
    const result = act(state, { type: "travel", floor: v as Floor });
    const changed = state.floor !== result.state.floor;
    state = result.state;
    feedback = result.message;
    persist();
    if (changed) void mount(true);
    else render();
    return;
  }
  if (a === "menu") {
    menu = true;
    panel = "";
    render();
    return;
  }
  if (a === "continue") {
    menu = false;
    render();
    return;
  }
  if (a === "restart") {
    state = fresh();
    persist();
    void mount();
    return;
  }
  if (a === "export") {
    download(exportCurrent(state), "黃燈之後-整合存檔.json");
    feedback = "已送出目前記憶體進度的下載請求。";
    render();
    return;
  }
  if (a === "raw") {
    try {
      download(
        JSON.stringify(
          {
            current: store.getItem(KEY),
            previous: store.getItem(KEY + "-previous"),
            corrupt: store.getItem(KEY + "-corrupt"),
          },
          null,
          2,
        ),
        "黃燈之後-整合原文-排查.json",
      );
    } catch {
      feedback = "瀏覽器拒絕讀取原文。";
    }
    render();
    return;
  }
  if (a === "import") {
    file.click();
    return;
  }
  if (a === "importApply") {
    if (pendingImport) {
      state = pendingImport;
      pendingImport = null;
      persist();
      void mount(true);
    }
    return;
  }
  if (a === "item") {
    feedback =
      v === "匙" && state.b2.key
        ? "同組檢修鑰匙供 B3 工作井與升降梯使用，不會消耗。"
        : "道具隨調查保留；對應設備有具名操作按鈕。";
    render();
    return;
  }
  if (a === "select") {
    selected = v;
    render();
    return;
  }
  if (a === "place") {
    if (selected)
      send({
        type: "b1",
        action: {
          type: "place",
          circuit: selected as Circuit,
          slot: Number(v),
        },
      });
    return;
  }
  if (["wire", "trace", "drain", "gate"].includes(a)) {
    send({
      type: "b1",
      action: {
        type: a === "gate" ? "door" : (a as "wire" | "trace" | "drain"),
      },
    });
    return;
  }
  if (a === "power") {
    send({ type: "b1", action: { type: "power", load: v as Load } });
    return;
  }
  if (a === "valve") {
    send({ type: "b1", action: { type: "valve", valve: v as Valve } });
    return;
  }
  if (a === "offset") {
    send({
      type: "offset",
      device: v as "terminal" | "cctv",
      value: state.b2[v as "terminal"] + Number(w),
    });
    return;
  }
  if (a === "event") {
    send({ type: "event", index: Number(v) });
    return;
  }
  if (["clip", "card", "splice"].includes(a)) {
    send({ type: a as "clip" | "card" | "splice", id: v });
    return;
  }
  if (["switch", "handle"].includes(a)) {
    send({ type: a as "switch" | "handle", id: v as "A" | "B" | "C" | "D" });
    return;
  }
  if (a === "identity") {
    send({ type: "identity", index: Number(v), id: w });
    return;
  }
  if (a === "hint") {
    send({ type: "hint", id: v });
    return;
  }
  if (
    [
      "clearEvents",
      "checkTime",
      "clearClips",
      "checkAudio",
      "checkIsolation",
      "checkIdentity",
      "backup",
      "request",
      "receipt",
      "shutdown",
      "cut",
      "restorePower",
      "unlock",
      "exit",
    ].includes(a)
  )
    send({ type: a } as Action);
});
ui.addEventListener("change", (e) => {
  if (state.floor === "L0") return;
  const el = e.target as HTMLInputElement,
    k = el.dataset.setting as keyof Settings;
  if (!k) return;
  const before = focus.capture(ui);
  if (["large", "reduced", "subtitles", "mute"].includes(k))
    (settings[k] as boolean) = el.checked;
  else (settings[k] as number) = Number(el.value);
  applySettings();
  render();
  focus.restore(ui, before, state.floor + ":" + state.room, panel, [
    "panel:settings",
  ]);
});
addEventListener("keydown", (e) => {
  if (state.floor === "L0") return;
  if (e.key === "Escape") {
    e.preventDefault();
    if (panel) {
      panel = stack.pop() || "";
      feedback = "";
    } else panel = "settings";
    render();
  }
  if (panel && e.key === "Tab") {
    const els = [
        ...ui.querySelectorAll<HTMLElement>(
          ".panel button:not([disabled]),.panel input",
        ),
      ],
      first = els[0],
      last = els.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.classList.contains("panel"))
    ) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
addEventListener("pagehide", persist);
void mount();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    cleanup?.();
    game?.destroy(true);
  });
