import Phaser from "phaser";
import { UiFocus } from "../Game/src/focus.ts";
import {
  fresh,
  act,
  goal,
  circuits,
  circuitChecks,
  consumption,
  rooms,
  roomNames,
  loads,
  loadNames,
  valves,
  documents,
  hints,
  type State,
  type Circuit,
  type Room,
  type Load,
  type Valve,
  type Doc,
  type Puzzle,
  type Action,
} from "./model.ts";
import { load, save, exportCurrent } from "./storage.ts";
import { MaintenanceScene } from "./scenes.ts";
import "./style.css";

const store = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
};
const initial = load(store),
  app = document.querySelector<HTMLElement>("#app")!,
  focus = new UiFocus();
let state = initial.state || fresh(),
  hasSave = !!initial.state,
  started = false;
let mode: "menu" | "play" = "menu",
  panel = "",
  history: string[] = [],
  message = "",
  warning = initial.warning,
  selected: Circuit | null = null;
let selectedHint: Puzzle = "EP01",
  showSpots = false,
  audio: AudioContext | null = null;
let prefs = {
  volume: 0.35,
  mute: false,
  large: false,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
try {
  const p = JSON.parse(store.getItem("amber-expansion-b1-prefs") || "{}");
  for (const key of ["mute", "large", "reduced"] as const)
    if (typeof p[key] === "boolean") prefs[key] = p[key];
  if (typeof p.volume === "number" && Number.isFinite(p.volume))
    prefs.volume = Math.max(0, Math.min(1, p.volume));
} catch {}
const button = (label: string, action: string, extra = "") =>
  `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const disabled = (value: boolean) => (value ? "disabled" : "");
const world = new MaintenanceScene(() => state);
new Phaser.Game({
  type: Phaser.CANVAS,
  width: 960,
  height: 540,
  parent: "world",
  backgroundColor: "#14191f",
  scene: world,
  banner: false,
  audio: { noAudio: true },
  input: { keyboard: false },
  fps: { target: 30 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});

function persist() {
  warning = save(state, store);
  hasSave = true;
}
function sfx(kind = "switch") {
  if (prefs.mute || prefs.volume <= 0) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain(),
      t = audio.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(kind === "paper" ? 220 : 120, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.16);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.018 * prefs.volume, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(audio.destination);
    o.start(t);
    o.stop(t + 0.22);
  } catch {
    /* 所有狀態都有文字和圖示。 */
  }
}
function send(action: Action) {
  const wasDoor = state.door,
    wasWired = state.wired,
    result = act(state, action);
  state = result.state;
  if (!wasWired && state.wired) selected = null;
  message = result.message;
  persist();
  if (!wasDoor && state.door) {
    panel = "reveal";
    history = [];
  }
  render();
}
function open(id: string, origin?: string) {
  if (origin) focus.openFrom(origin);
  if (panel) history.push(panel);
  panel = id;
  message = "";
  if (id.startsWith("doc-")) {
    state = act(state, { type: "read", doc: id.slice(4) as Doc }).state;
    persist();
  }
  if (id === "trace") {
    const r = act(state, { type: "trace" });
    state = r.state;
    message = r.message;
    persist();
  }
  if (id === "hints")
    selectedHint = !state.wired
      ? "EP01"
      : state.water === "high"
        ? "EP02"
        : "EP03";
  render();
}
function close() {
  panel = history.pop() || "";
  message = "";
  render();
}
function move(room: Room) {
  panel = "";
  history = [];
  send({ type: "move", room });
}
function file(id: Doc) {
  return `<article class="paper"><small>現場記錄 · 可在筆記重看</small><h3>${documents[id].title}</h3><p>${documents[id].text}</p></article>`;
}
function circuitPanel() {
  return `<h2>五回路 · 插槽識別</h2><p>選一條線束，再選一個插槽。放錯可以直接移動，接頭不會消失。</p><div class="clue-shortcuts">${button("牆面工單", "open:doc-work")}${button("線束固定架", "open:doc-rack")}${button("接頭與維修圖", "open:doc-plugs")}</div><div class="plug-tray" aria-label="可選線束">${["門鎖", "照明", "泵浦", "排風", "通訊"].map((c) => button(`<span class="plug-symbol" aria-hidden="true">⊓</span>${c}`, `pick:${c}`, `aria-pressed="${selected === c}" class="${selected === c ? "selected" : ""}" ${disabled(state.wired)}`)).join("")}</div><div class="slots" aria-label="五個回路插槽">${state.slots.map((c, i) => button(`<small>0${i + 1}</small><strong>${c || "未接入"}</strong><span class="socket" aria-hidden="true"></span>`, `slot:${i}`, `aria-label="第 ${i + 1} 槽，${c || "空白"}${selected ? "，接入" + selected : ""}" ${disabled(state.wired)}`)).join("")}</div><p class="selection-status">${state.wired ? "五條回路已確認。分路供電面板已可操作。" : selected ? `手上拿著：${selected}線束。點選要接入的插槽。` : "先選線束，再放入插槽。"}</p>${state.wired ? button("操作分路供電", "open:power", 'class="primary"') : button("校驗接線並送電", "wire", 'class="primary"')}<details><summary>已觀察線索與校驗條件</summary>${
    ["work", "rack", "plugs"]
      .filter((id) => state.read.includes(id as Doc))
      .map((id) => file(id as Doc))
      .join("") || "尚未翻閱現場工單。"
  }${state.slots.every(Boolean) ? `<p>目前符合 ${circuitChecks(state.slots).filter(Boolean).length}／5 項條件。依原文逐項核對。</p>` : ""}</details>`;
}
function powerPanel() {
  return `<h2>有限的電力</h2><p>每次接通前都會計算負載。觀察銘牌、水位與止回閥，決定設備的先後順序。</p>${button("閱讀供電銘牌", "open:doc-capacity")}<div class="capacity"><div><strong>${consumption(state)}</strong><span>／4 格</span></div><div class="capacity-bars" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i < consumption(state) ? "used" : ""}"></i>`).join("")}</div></div><div class="load-list">${(Object.keys(loads) as Load[]).map((id) => `<div><span><strong>${loadNames[id]}</strong><small>${loads[id]} 格${id === "lock" ? " · 水位保護" : ""}</small></span>${button(`${state.power[id] ? "● 接通" : "○ 關閉"}`, `power:${id}`, `aria-label="${loadNames[id]}，${state.power[id] ? "接通" : "關閉"}，切換供電" aria-pressed="${state.power[id]}" ${disabled(!state.wired)}`)}</div>`).join("")}</div>${!state.wired ? "<p class=notice>先完成回路識別，分路開關才會解除鎖定。</p>" : ""}<div class="readings"><span>水位：${state.water === "safe" ? "安全線以下" : "高於安全線"}</span><span>止回閥：${state.checkClosed ? "閉合" : "開啟"}</span></div>${button("前往泵房", "move:pump")}`;
}
function pipeDiagram() {
  return `<svg class="pipe-diagram" viewBox="0 0 620 270" role="img" aria-label="水路圖：積水槽經 A 到泵浦，B 通排水井，D 通封存室${state.traceSeen ? "，新增 C 支路繞回入口" : "；另有未記錄的新增支路"}"><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10" fill="#9bb6aa"/></marker></defs><path d="M70 120H210 M300 120H530 M390 120V220H530"/><path class="${state.traceSeen ? "new-pipe" : "unknown-pipe"}" d="M365 120V40H170V120"/><path class="direction" d="M85 120H155 M400 120H493"/><rect x="200" y="95" width="108" height="50" rx="8"/><text x="215" y="125">泵浦</text><text x="10" y="153">積水槽</text><text x="525" y="110">排水井</text><text x="525" y="247">封存室</text><text x="123" y="111">A</text><text x="442" y="111">B</text><text x="423" y="214">D</text><text x="248" y="29">${state.traceSeen ? "C · 新增回流支路" : "未記錄的接頭"}</text></svg>`;
}
function valvePanel() {
  return `<h2>水流到了哪裡？</h2><p>圖上的箭頭與開關狀態都能重看。舊圖未必記錄了後來加裝的管線。</p>${pipeDiagram()}<div class="valves">${valves.map((id) => button(`<span class="valve-wheel ${state.valves[id] ? "open" : ""}" aria-hidden="true">⊕</span><strong>${id} 閥</strong><small>${state.valves[id] ? "開啟" : "關閉"}</small>`, `valve:${id}`, `aria-label="${id} 閥，${state.valves[id] ? "開啟" : "關閉"}，轉動閥門" aria-pressed="${state.valves[id]}"`)).join("")}</div><div class="clue-shortcuts">${button("閱讀舊管線圖", "open:doc-oldPipe")}${button("檢查排風機後的檢修窗", "open:trace")}</div>${button("啟動排水循環", "drain", 'class="primary"')}<p>泵浦：${state.power.pump ? "供電中" : "未供電"}　水位：${state.water === "high" ? "尚未下降" : "安全線以下"}</p>`;
}
function panelContent() {
  if (panel.startsWith("doc-"))
    return `<h2>翻閱現場記錄</h2>${file(panel.slice(4) as Doc)}`;
  switch (panel) {
    case "wiring":
      return circuitPanel();
    case "power":
      return powerPanel();
    case "valves":
      return valvePanel();
    case "pump":
      return `<h2>泵浦操作台</h2><div class="readings"><span>供電 ${state.power.pump ? "● 接通" : "○ 關閉"}</span><span>水位 ${state.water === "safe" ? "安全" : "高"}</span><span>止回閥 ${state.checkClosed ? "閉合" : "開啟"}</span></div><p>馬達轉動不代表水一定排往出口。先比較實際管線，再操作排水循環。</p>${button("觀察並調整四個閥門", "open:valves")}${button("啟動排水循環", "drain", 'class="primary"')}${button("閱讀止回閥維護牌", "open:doc-check")}${button("回配電室調整負載", "move:distribution")}`;
    case "trace":
      return `<h2>排風葉片後的檢修窗</h2>${state.traceSeen ? file("trace") + pipeDiagram() : `<div class="inspection-window">${state.power.fan ? "排風葉片擋住視線" : "內部沒有作業照明"}</div><p>檢修窗可從另一側看清接頭。先處理妨礙觀察的設備狀態。</p>`}${button("重新沿管線觀察", "trace")}${button("前往配電室", "move:distribution")}`;
    case "door":
      return `<h2>隔離門 · 通往封存層</h2><div class="door-readings"><span>水位感測器<strong>${state.water === "safe" ? "安全線以下" : "高於安全線"}</strong></span><span>門鎖供電<strong>${state.power.lock ? "接通" : "關閉"}</strong></span><span>止回閥<strong>${state.checkClosed ? "閉合" : "開啟"}</strong></span></div>${state.door ? file("lin") + button("重看這份撤離工單", "open:reveal") : `<p>觀察窗外的水位與門鎖連動。門內側似乎壓著一張紙，現在還看不清。</p>${button("嘗試開啟隔離門", "door", 'class="primary"')}`}${button("閱讀當年故障單與保持把手標牌", "open:doc-gateHistory")}${button("閱讀水位保護牌", "open:doc-sensor")}${button("返回配電室", "move:distribution")}`;
    case "notebook":
      return `<h2>林澄的調查筆記</h2>${button("取出今夜派工與安全處置單", "open:doc-intake")}<p class="inner-voice">${goal(state)}</p>${state.read.length ? state.read.map(file).join("") : "<p>先翻閱工單、銘牌與管線圖。筆記只保存你已觀察的內容。</p>"}`;
    case "hints":
      return `<h2>調查方向</h2><p>提示不扣資源，也不替你操作設備。</p><nav class="hint-tabs">${(["EP01", "EP02", "EP03"] as Puzzle[]).map((p, i) => button(["回路", "水路", "轉供"][i], `hintTab:${p}`, `aria-pressed="${selectedHint === p}"`)).join("")}</nav>${hints[
        selectedHint
      ]
        .slice(0, state.hints[selectedHint])
        .map(
          (t, i) =>
            `<article class="hint"><small>第 ${i + 1} 級</small><p>${t}</p></article>`,
        )
        .join(
          "",
        )}${state.hints[selectedHint] < 3 ? button(`查看第 ${state.hints[selectedHint] + 1} 級提示`, "hint", 'class="primary"') : "<p>三級提示均可重看。實際狀態仍由你調整。</p>"}`;
    case "settings":
      return `<h2>設定與進度</h2><div class="setting-list">${[
        ["mute", "靜音"],
        ["large", "加大文字"],
        ["reduced", "減少動態效果"],
      ]
        .map(
          ([id, label]) =>
            `<label><input type="checkbox" data-setting="${id}" ${prefs[id as keyof typeof prefs] ? "checked" : ""}>${label}</label>`,
        )
        .join(
          "",
        )}</div><label class="volume-setting">提示音音量<input type="range" min="0" max="1" step="0.05" value="${prefs.volume}" data-setting="volume" aria-label="提示音音量"></label><p>所有音訊都有文字替代。音效為低音量合成提示；無配音、無跳嚇、無閃爍。</p><p>本試玩使用獨立存檔，不會讀寫第零層原版進度。</p>${button("匯出目前 B1 進度", "export")}${initial.raw && initial.warning ? button("匯出無法讀取的原文", "exportRaw") : ""}${button("重新開始本層", "new")}${button("回到試玩主選單", "menu")}<p class="notice">${warning || "自動存檔可用。重新整理後可繼續本層。"}</p>`;
    case "reset":
      return `<h2>重新開始地下一層？</h2><p>只會覆寫這個瀏覽器的 B1 試玩進度。可以先匯出存檔。</p>${button("先匯出目前進度", "export")}${button("確認開始新的 B1 調查", "start", 'class="primary"')}`;
    case "reveal":
      return `<div class="story-reveal"><small>地下一層 · 被中斷的撤離</small><h2>她不是只在等待救援。</h2>${file("lin")}<p>林澄讀到她回泵房守住把手、等待對側清點的安排。他剛完成的程序，正是她當年替其他人爭取的路。今夜保持扣已修復，門能自己保持開啟；你不必再留一個人在泵房。</p><p class="inner-voice">這一層的工單證明她曾主動幫助撤離，尚不能確認她後來的去向。</p><div class="slice-end">地下一層三題已完成<br><small>本獨立試玩在此結束。地下二、三層與最終結局尚未製作。</small></div>${button("留下工單，繼續查看本層", "close", 'class="primary"')}${button("匯出本層完成進度", "export")}</div>`;
    default:
      return "";
  }
}
type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
const hotspots: Record<Room, Hotspot[]> = {
  distribution: [
    { id: "doc-work", label: "閱讀牆面回路工單", x: 13, y: 25, w: 14, h: 34 },
    { id: "wiring", label: "操作五回路插槽", x: 33, y: 30, w: 34, h: 43 },
    {
      id: "doc-rack",
      label: "查看線束固定架與接頭圖",
      x: 34,
      y: 76,
      w: 33,
      h: 11,
    },
    { id: "power", label: "操作分路供電面板", x: 75, y: 29, w: 15, h: 43 },
  ],
  pump: [
    { id: "doc-oldPipe", label: "閱讀舊管線圖", x: 12, y: 25, w: 15, h: 24 },
    { id: "trace", label: "檢查排風機後的檢修窗", x: 69, y: 20, w: 20, h: 27 },
    { id: "valves", label: "調整四個管線閥門", x: 29, y: 48, w: 52, h: 24 },
    { id: "pump", label: "查看泵浦操作台", x: 39, y: 53, w: 15, h: 17 },
    { id: "doc-check", label: "閱讀止回閥維護牌", x: 81, y: 55, w: 10, h: 20 },
  ],
  vestibule: [
    { id: "door", label: "檢查通往封存層的隔離門", x: 31, y: 22, w: 38, h: 58 },
    { id: "doc-sensor", label: "閱讀水位保護牌", x: 15, y: 31, w: 12, h: 29 },
    { id: "door", label: "查看隔離門水位感測器", x: 75, y: 29, w: 11, h: 43 },
  ],
};
function render() {
  const before = focus.capture(app),
    oldPanel = app.querySelector<HTMLElement>(".panel-body"),
    scroll = oldPanel?.scrollTop || 0;
  document.body.classList.toggle("large", prefs.large);
  document.body.classList.toggle("reduced", prefs.reduced);
  document
    .querySelector(".scene-frame")!
    .classList.toggle("menu-mode", mode === "menu");
  document.querySelector("#header")!.innerHTML =
    `<div class="brand"><small>黃燈之後 · 獨立擴充試玩</small><strong>B1<span>被中斷的撤離</span></strong></div><nav class="room-nav" aria-label="地下一層房間">${rooms.map((room, i) => button(`<small>0${i + 1}</small>${roomNames[room]}`, `move:${room}`, `aria-current="${state.room === room ? "location" : "false"}" ${disabled(mode !== "play")}`)).join("")}</nav><div class="tools">${button("筆記", "open:notebook", disabled(mode !== "play"))}${button("提示", "open:hints", disabled(mode !== "play"))}${button("設定", "open:settings")}</div>`;
  const index = rooms.indexOf(state.room);
  document.querySelector("#scene-ui")!.innerHTML =
    mode === "menu"
      ? `<section class="start-card"><small>三個房間 · 三個機關 · 獨立存檔</small><h1>被中斷的<br><span>撤離</span></h1><p>你是維修員林澄，因妹妹失蹤案申請今夜的停機與資料保全工作。手機收到以她名字傳來的語音；循著第零層線索，你來到這一層。</p><p>隔離門被積水封住。廣播要求原地等待，設備留下的痕跡卻指向另一種做法。</p><div>${hasSave ? button(state.door ? "繼續 · 重看撤離工單" : "繼續本層調查", "continue", 'class="primary"') : button("開始地下一層試玩", "start", 'class="primary"')}${hasSave ? button("開始新試玩", "new") : ""}</div><small>只製作地下一層，後續樓層與最終結局尚未製作。</small>${warning ? `<p class="notice">${warning}</p>` : ""}</section>`
      : `<div class="scene-label"><small>地下 1 層 / MAINTENANCE</small><h1>${roomNames[state.room]}</h1></div><div class="hotspots ${showSpots ? "reveal-spots" : ""}">${hotspots[state.room].map((s, i) => button(`<span class="inspect-dot" aria-hidden="true">＋</span><span class="hotspot-name">${s.label}</span>`, `inspect:${s.id}-${i}`, `class="hotspot" style="left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%" aria-label="${s.label}" title="${s.label}"`)).join("")}</div><div class="scene-exits">${index > 0 ? button(`← ${roomNames[rooms[index - 1]]}`, `move:${rooms[index - 1]}`) : "<span>來時的維修通道</span>"}${index < 2 ? button(`${roomNames[rooms[index + 1]]} →`, `move:${rooms[index + 1]}`) : button(state.door ? "隔離門 · 已放行 →" : "隔離門 · 保護鎖定", "inspect:door-exit")}</div><div class="radio-caption">${state.power.comm ? "廣播：請原地等待，保持通訊。" : state.wired ? "通訊已切斷 · 以現場設備讀數為準" : "供電中斷 · 設備等待辨認"}</div>`;
  document.querySelector("#footer")!.innerHTML =
    `<div class="objective"><small>${state.door ? "本層完成" : "林澄的調查"}</small><p>${mode === "play" ? goal(state) : "先用現場證據，驗證廣播的指示。"}</p></div><div class="equipment-state"><span>負載 <b>${consumption(state)}／4</b></span><span>水位 <b>${state.water === "safe" ? "安全" : "高"}</b></span>${button(showSpots ? "收起調查標記" : "顯示可調查處", "spots", `aria-pressed="${showSpots}"`)}</div><p class="feedback" role="status">${!panel ? warning || message : ""}</p>`;
  document.querySelector("#overlay")!.innerHTML = panel
    ? `<div class="shade"><section class="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" data-panel="${panel}" tabindex="-1"><header class="panel-top"><small>站內維修 · 地下一層</small>${button(history.length ? "返回上一頁 ×" : "關閉 ×", "close", 'aria-label="關閉面板或返回上一頁"')}</header><div class="panel-body">${panelContent()}</div><p class="panel-feedback" role="status">${warning || message}</p></section></div>`
    : "";
  if (panel) {
    app.querySelector(".panel-body h2")?.setAttribute("id", "panel-title");
    if (before.panel === panel)
      app.querySelector<HTMLElement>(".panel-body")!.scrollTop = scroll;
  }
  for (const id of ["header", "scene-ui", "footer"])
    document.getElementById(id)!.inert = !!panel;
  document
    .getElementById("world")!
    .setAttribute(
      "aria-label",
      `${roomNames[state.room]}。${state.power.light ? "照明供電" : "照明未恢復"}。水位${state.water === "safe" ? "安全" : "高"}。`,
    );
  focus.restore(
    app,
    before,
    `${mode}:${state.room}`,
    panel,
    mode === "play"
      ? [`move:${state.room}`, "open:notebook"]
      : ["continue", "start", "open:settings"],
  );
  world.redraw();
}
function download(raw: string, name: string) {
  const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-action]",
  );
  if (!target || target.disabled) return;
  const [action, value] = target.dataset.action!.split(":");
  sfx(action === "open" ? "paper" : "switch");
  if (action === "open") return open(value);
  if (action === "inspect") {
    const id = value.slice(0, value.lastIndexOf("-"));
    return open(id, target.dataset.action);
  }
  if (action === "close") return close();
  if (action === "move") return move(value as Room);
  if (action === "spots") {
    showSpots = !showSpots;
    render();
    return;
  }
  if (action === "start") {
    state = act(fresh(), { type: "read", doc: "intake" }).state;
    started = true;
    selected = null;
    mode = "play";
    panel = "doc-intake";
    history = [];
    message = "派工單說明今夜的安全條件。讀完後可關閉，開始調查配電室。";
    persist();
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "continue") {
    mode = "play";
    started = true;
    panel = state.door ? "reveal" : "";
    history = [];
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "new") return open("reset");
  if (action === "menu") {
    panel = "";
    history = [];
    mode = "menu";
    render();
    return;
  }
  if (action === "export") {
    download(exportCurrent(state), "黃燈之後-B1-獨立進度.json");
    message = "已送出目前記憶體進度的下載請求，請確認下載完成。";
    render();
    return;
  }
  if (action === "exportRaw") {
    if (initial.raw !== null)
      download(initial.raw, "黃燈之後-B1-無法讀取的原文.json");
    return;
  }
  if (action === "pick") {
    selected = value as Circuit;
    message = `已拿起${selected}線束，請選插槽。`;
    render();
    return;
  }
  if (action === "slot") {
    if (selected)
      send({ type: "place", circuit: selected, slot: Number(value) });
    else {
      message = "先從上方拿起一條線束。";
      render();
    }
    return;
  }
  if (action === "wire") return send({ type: "wire" });
  if (action === "power") return send({ type: "power", load: value as Load });
  if (action === "valve") return send({ type: "valve", valve: value as Valve });
  if (action === "trace" || action === "drain" || action === "door")
    return send({ type: action });
  if (action === "hintTab") {
    selectedHint = value as Puzzle;
    render();
    return;
  }
  if (action === "hint") return send({ type: "hint", puzzle: selectedHint });
});
app.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement,
    key = input.dataset.setting as keyof typeof prefs;
  if (!key) return;
  if (key === "volume")
    prefs.volume = Math.max(0, Math.min(1, Number(input.value)));
  else prefs[key] = input.checked;
  try {
    store.setItem("amber-expansion-b1-prefs", JSON.stringify(prefs));
  } catch {}
  render();
});
addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (panel) close();
    else open("settings");
  }
  if (panel && event.key === "Tab") {
    const controls = [
        ...app.querySelectorAll<HTMLElement>(
          ".panel button:not([disabled]),.panel input,.panel summary",
        ),
      ],
      first = controls[0],
      last = controls.at(-1);
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.classList.contains("panel"))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
addEventListener("pagehide", () => {
  if (started) persist();
});
render();
