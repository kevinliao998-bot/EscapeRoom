import Phaser from "phaser";
import { story, fresh, act, copy, type State, type Action } from "./core.ts";
import { maps, type Spot } from "./maps.ts";
import { load, save, exportSave, exportRecovery } from "./storage.ts";
import { Sound, defaults, type Settings } from "./audio.ts";
import { Station } from "./world.ts";
import { UiFocus } from "./focus.ts";
import "./style.css";
import { localizeMarkup, translateText } from "./i18n.ts";
const initial = load();
let leaving = false,
  storageWarning = initial.warning;
let state = initial.state || fresh(),
  hasSave = !!initial.state,
  mode: "menu" | "opening" | "play" | "end" = "menu",
  panel = "",
  selected = "",
  wave: string[] = [],
  linkStart = "",
  feedback = initial.warning,
  nearby: Spot | null = null;
const ui = document.querySelector<HTMLDivElement>("#ui")!,
  sound = new Sound(),
  uiFocus = new UiFocus();
let settings: Settings = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem("amber-v2-settings") || "{}");
  settings = {
    ...defaults,
    ...saved,
    language: saved.language === "en" ? "en" : "zh-Hant",
  };
} catch {}
sound.settings = settings;
const base = import.meta.env.BASE_URL;
const btn = (text: string, action: string, extra = "") =>
  `<button type="button" data-action="${action}" ${extra}>${text}</button>`;
const doc = (id: string) => {
  const d = story.documents[id as keyof typeof story.documents];
  return `<article class="document"><small>站務檔案 · 已讀可在筆記重看</small><h2>${d.title}</h2><p>${d.text.replaceAll("\n", "<br>")}</p></article>`;
};
const itemIcon = (id: string) =>
  `<img src="${base}art/${id}.png" alt="" width="16" height="16">`;
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
  document.documentElement.lang = settings.language === "en" ? "en" : "zh-Hant";
  sound.settings = settings;
  try {
    localStorage.setItem("amber-v2-settings", JSON.stringify(settings));
  } catch {}
}
applySettings();
function persist() {
  const warning = save(state);
  storageWarning = warning;
  hasSave = true;
  if (warning) feedback = warning;
}
function download(raw: string, filename: string) {
  const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function send(a: Action) {
  const result = act(state, a);
  state = result.state;
  if (result.message) feedback = result.message;
  persist();
  if (state.lastEnding) mode = "end";
  render();
  world.redraw();
}
function activePuzzle() {
  return !state.card
    ? "P01"
    : !state.power
      ? "P02"
      : !state.broadcast
        ? "P03"
        : !state.records
          ? "P04"
          : "P05";
}
function ownership(id: string) {
  return id === "card"
    ? state.card
    : id === "pry"
      ? state.pry
      : state[id as "film" | "battery"] === "inventory";
}
function inventory() {
  return Object.entries(story.items)
    .map(
      ([id, label]) =>
        `<button class="slot ${selected === id ? "selected" : ""} ${ownership(id) ? "owned" : ""}" data-action="item:${id}" aria-label="${label}${ownership(id) ? "，在背包" : (id === "film" || id === "battery") && state[id] === "device" ? "，已安裝" : "，尚未取得"}" title="${label}">${ownership(id) ? itemIcon(id) : `<span class="empty">${(id === "film" || id === "battery") && state[id] === "device" ? "↗" : "·"}</span>`}<span class="slot-name">${ownership(id) ? label : ""}</span></button>`,
    )
    .join("");
}
function menu() {
  return `<div class="menu"><div class="edition">第零層 · 維修紀錄 017</div><h1>黃燈<br><span>之後</span></h1><div class="title-line"></div><p class="tagline">聲音會帶錯路。<br>燈，不會。</p><div class="menu-actions">${hasSave ? btn(state.lastEnding ? "繼續 · 重看結局" : "繼續調查", "continue", 'class="primary"') : btn("進入第零層", "start", 'class="primary"')}${hasSave ? btn("重新開始", "new") : ""}${state.checkpoint ? btn("回到最後選擇前", "reselect") : ""}${btn("設定與輔助", "settings")}${btn("素材與製作說明", "credits")}</div><p class="menu-note">三場景解謎 · 無倒數 · 可隨時保存<br>方向鍵／WASD 移動　E 調查　點地面亦可行走</p>${feedback ? `<p class="warning">${feedback}</p>` : ""}</div><div class="menu-stamp">站內維修頻道<br><strong>01:17</strong><br>連線待確認</div>`;
}
function opening() {
  return `<section class="opening"><small>站內維修終端</small><h2>01:17</h2><div class="message-card"><span>顯示名稱：${story.opening.sender}</span><br><small>頻道：${story.opening.channel}</small><blockquote>「${story.opening.message}」</blockquote></div><p>${story.opening.context}</p>${btn("收起手機，開始調查", "begin", 'class="primary"')}<small>所有聲音線索均有文字版本。你可以靜音遊玩。</small></section>`;
}
function ending() {
  const e = story.endings[state.lastEnding!];
  return `<section class="ending"><small>維修紀錄 · ${state.lastEnding === "A" ? "已離站" : "回放未停止"}</small><h2>${e.title}</h2><p>${e.text.replaceAll("\n", "<br><br>")}</p><div class="button-row">${btn("繼續 · 返回主選單", "menu", 'class="primary"')}${btn("回到最後選擇前", "reselect")}</div><small>通關紀錄已保留。可重新選擇另一個結局。</small></section>`;
}
function content() {
  switch (panel) {
    case "settings":
      return `<h2>設定與輔助</h2><div class="settings-grid"><label>遊戲語言<select data-setting="language" aria-label="遊戲語言"><option value="zh-Hant" ${settings.language === "zh-Hant" ? "selected" : ""}>繁體中文</option><option value="en" ${settings.language === "en" ? "selected" : ""}>英文</option></select></label>${[
        ["large", "大字閱讀（24 px）"],
        ["reduced", "減少動態效果"],
        ["subtitles", "顯示音訊回放字幕"],
        ["mute", "全部靜音"],
      ]
        .map(
          ([id, l]) =>
            `<label><input type="checkbox" data-setting="${id}" ${settings[id as keyof Settings] ? "checked" : ""}> ${l}</label>`,
        )
        .join("")}${[
        ["master", "總音量"],
        ["ambient", "環境"],
        ["effects", "音效"],
        ["voice", "訊號標記"],
      ]
        .map(
          ([id, l]) =>
            `<label>${l}<input type="range" min="0" max="1" step="0.05" value="${settings[id as keyof Settings]}" data-setting="${id}" aria-label="${l}"></label>`,
        )
        .join(
          "",
        )}</div><p>無頻閃、抖鏡或驚嚇。廣播以字幕敘事與合成標記呈現；沒有配音音檔。音訊字幕關閉後，筆記仍保留完整可讀線索。</p>${btn("試聽柔和提示音", "testSound")}<p class="warning" role="status">${storageWarning}</p><p>「匯出存檔」保留目前進度；「本機原檔」僅供排查損壞資料，兩者不會互相覆寫。</p>${btn("匯出存檔", "export")}${btn("匯出本機原檔（排查用）", "exportRecovery")}${btn("回主選單", "menu")}`;
    case "credits":
      return `<h2>原創與來源</h2><p>原創站內像素場景、角色、四件物品與合成音效：專案團隊／Codex 輔助製作。只參考俯視像素技法，未取用參考遊戲素材。</p><p>Fusion Pixel Font 12px 繁體：TakWolf 與上游貢獻者，版本 2026.10.25，SIL OFL 1.1；完整上游授權隨專案提供。Phaser 3.90.0，MIT。</p><p>劇情依團隊確認版《黃燈之後》。15–20 分鐘為設計目標，仍待新玩家盲測。詳見專案 Credits.md、Verify.md。</p>`;
    case "newConfirm":
      return `<h2>重新開始？</h2><p>將以新的調查覆寫這個瀏覽器的 v2 進度。你可以先匯出存檔；舊版封存不受影響。</p>${btn("先匯出存檔", "export")}${btn("確認開始新的調查", "start", 'class="primary"')}`;
    case "journal":
      return `<h2>調查筆記</h2><small>林澄 · 僅記錄已取得的證據</small><div class="notebook">${state.read.length ? state.read.map((id) => doc(id)).join("") : "<p>還沒有記下線索。靠近物件後按 E 調查。</p>"}</div>`;
    case "hint": {
      const p = activePuzzle(),
        n = state.hints[p] || 0;
      return `<h2>調查方向 · ${p}</h2><p>提示不扣資源，也不會替你解題。</p>${Array.from({ length: n }, (_, i) => `<p class="hint"><small>第 ${i + 1} 級</small><br>${story.hints[p as keyof typeof story.hints][i]}</p>`).join("")}${n < 3 ? btn(`查看第 ${n + 1} 級提示`, "hintNext") : ""}`;
    }
    case "dispenser":
      return doc("tag") + "<p>〔水滴〕 → 右側牆腳檢修槽 → 〔卡片〕</p>";
    case "clock":
      return `<h2>場景中的時鐘</h2><p class="clock-face">${story.snapshots[state.loop].clock}</p><p>指針停得太安靜。你把這個時間記在心裡。</p>`;
    case "sign":
      return `<h2>壓克力站名牌</h2><p>第零層 ${story.snapshots[state.loop].arrow === "right" ? "→" : "←"}</p><p>站名不變，箭頭卻不一定指向同一邊。</p>`;
    case "water":
      return `<h2>地面水漬</h2><p>水漬輪廓 ${story.snapshots[state.loop].water}。一條微光沿地面接縫延伸。</p><p>它不是腳印，也不是開門密碼。</p>`;
    case "cardSlot":
      return `<h2>牆腳檢修槽</h2><p>${state.card ? "卡片已在你的背包。" : "槽口露出一角卡片，位置與標籤圖示一致。"}</p>${!state.card ? btn("拿取門禁卡", "card", 'class="primary"') : ""}`;
    case "cart":
      return `<h2>清潔推車</h2><p>${state.pry ? "你已取走撬片。" : "推車上放著一片薄金屬撬片，沒有被藏起來。"}</p>${!state.pry ? btn("拿取撬片", "pry", 'class="primary"') : ""}`;
    case "endDoor":
      return `<h2>走廊盡頭的門</h2><p>${state.card ? "門禁卡的形狀與讀卡口吻合。" : "門禁燈未啟動。你可以穿門試試，也可以繼續檢查走廊。"}</p>${btn(state.card ? "使用門禁卡，進入站務室" : "穿過盡頭門", "enter", 'class="primary"')}`;
    case "powerBox":
      return `<h2>檢修盒</h2><div class="mechanism">${state.box ? "盒蓋已開啟" : "盒蓋卡住，邊緣有一道窄縫"}<br>${state.power ? "● 備用電源供電中" : "○ 備用電源尚未接通"}</div>${!state.box ? btn("以撬片打開盒蓋", "openBox") : !state.power ? btn("啟動備用電源", "power", 'class="primary"') : ""}`;
    case "sticker":
      return doc("sticker");
    case "console":
      return `<h2>廣播控制台</h2>${!state.power ? "<p>沒有電。需要先打開檢修盒恢復備用供電。</p>" : `<p>依牆貼校準三組波形；先觀察長度與段數。</p><div class="wave-options">${["short", "double", "long"].map((id) => btn(story.waves[id as keyof typeof story.waves], "wave:" + id)).join("")}</div><div class="wave-draft">${wave.length ? wave.map((id) => story.waves[id as keyof typeof story.waves]).join(" ／ ") : "尚未選擇"}</div><div class="button-row">${btn("移除最後一組", "waveUndo")}${btn("清空本次草稿", "waveClear")}${btn("確認校準", "waveCheck", 'class="primary"')}</div>`}${state.broadcast ? doc("broadcast") + btn("重播三聲標記", "broadcast") : ""}${state.records ? `<h3>彈出的電池倉</h3><p>${state.battery === "source" ? "電池可帶往月台。" : "電池已領取。"}</p>${state.battery === "source" ? btn("取走電池", "battery", 'class="primary"') : ""}` : ""}`;
    case "cabinet":
      return `<h2>紀錄櫃 · 交叉比對</h2>${
        !state.broadcast
          ? "<p>電子櫃鎖尚未解除。先校準廣播控制台。</p>"
          : `${doc("report")}${doc("log")}${doc("roster")}${btn(state.impression ? "再次查看簽名壓痕" : "以側光檢視刮除處", "impression")}${state.impression ? doc("impression") : ""}<h3>選起點，再選對應證據</h3><div class="evidence-grid">${[
              ["report-time", "報告 · 01:17"],
              ["log-time", "維修簿 · 凌晨一點十七分"],
              ["report-person", "官方 · 林沐從未進站"],
              [
                "roster-person",
                state.impression ? "名冊壓痕 · 林沐" : "名冊 · 簽名遭刮除",
              ],
            ]
              .map(([id, l]) =>
                btn(
                  l,
                  "endpoint:" + id,
                  `class="${linkStart === id ? "selected" : ""}"`,
                ),
              )
              .join(
                "",
              )}</div><p>同一分鐘：${state.links.includes(0) ? "已驗證" : "尚未連線"}　人員紀錄矛盾：${state.links.includes(1) ? "已驗證" : "尚未連線"}</p><h3>證據能支持什麼？</h3>${story.conclusions.map((c, i) => btn(c, "conclude:" + i, 'class="conclusion"')).join("")}${state.records ? `<h3>維修簿夾層已開啟</h3><p>${state.film === "source" ? "薄薄的透明路線片滑出；電池倉也已彈開。" : "透明路線片已領取。"}</p>${state.film === "source" ? btn("取走透明路線片", "film", 'class="primary"') : ""}` : ""}`
      }`;
    case "lightbox":
      return `<h2>月台指示燈箱</h2><p>${state.battery === "device" ? "● 供電穩定。琥珀燈指出連續路線。" : "○ 電池槽空著。燈箱需要可攜電源。"}</p>${state.battery === "device" ? btn("取回電池", "takeBattery") : state.battery === "inventory" ? btn("裝入電池", "mountBattery", 'class="primary"') : "<p>電池仍在站務室控制台的彈出倉內。</p>"}`;
    case "routeMap":
      return `<h2>路線圖 · 供電校正</h2><p>${state.film === "device" ? "路線片已對齊定位槽。" : state.film === "inventory" ? "透明片與唯一定位槽吻合。" : "透明路線片仍在維修簿夾層。"}</p>${state.film === "device" ? btn("取回路線片", "takeFilm") : state.film === "inventory" ? btn("覆上透明路線片", "mountFilm", 'class="primary"') : ""}<p class="audio-caption">廣播：「北站，回聲站。」<br>〔站名與燈號不符〕</p><div class="route-board"><svg viewBox="0 0 370 160" aria-hidden="true">${story.route.edges
        .map(([a, b]) => {
          const n = story.route.nodes.find((n) => n.id === a)!,
            m = story.route.nodes.find((n) => n.id === b)!;
          return `<path d="M${n.x},${n.y} L${m.x},${m.y}"/>`;
        })
        .join(
          "",
        )}</svg>${story.route.nodes.map((n) => `<button data-action="node:${n.id}" class="node ${state.battery === "device" && n.powered ? "powered" : ""} ${state.path.includes(n.id) ? "connected" : ""}" style="left:${(n.x / 370) * 100}%;top:${(n.y / 160) * 100}%" aria-label="${n.label}，${state.battery === "device" && n.powered ? "供電" : "未供電"}">${state.battery === "device" && n.powered ? "●" : "○"}<span>${n.label}</span></button>`).join("")}</div><p>目前：${state.path.length ? state.path.map((id) => story.route.nodes.find((n) => n.id === id)!.label).join(" → ") : "尚未連線"}<br>● 供電　○ 未供電　${state.door ? "維修門已開啟" : ""}</p>${btn("清除本次路線", "clearPath")}`;
    case "maintenanceDoor":
      return `<h2>黃線之後</h2>${state.door ? `${doc("routeSolved")}<p>維修簿記載如何隔離導引支路、停止重播。另一端仍傳來熟悉的聲音。門已經打開；選擇權在你。</p><div class="choice-cards">${btn("執行斷路程序，帶著紀錄離站", "ending:A", 'class="primary"')}${btn("回應廣播中的聲音", "ending:B")}</div>` : "<p>門閂尚未解鎖。先完成燈箱與路線圖校正。</p>"}`;
    default:
      return "";
  }
}
function render() {
  const focusBefore = uiFocus.capture(ui),
    oldBody = ui.querySelector(".panel-body"),
    scroll = oldBody?.scrollTop || 0,
    oldPanel = focusBefore.panel;
  const playing = mode === "play";
  ui.innerHTML = localizeMarkup(`${playing ? `<aside class="inventory" aria-label="四格隨身物品"><small>隨身</small>${inventory()}</aside><header class="location"><small>第零層</small><h2>${maps[state.scene].name}</h2></header><nav class="top-actions">${btn("筆記", "journal")}${btn("提示", "hint")}</nav><footer class="status"><span id="near-label">${nearby ? `E · ${nearby.label}` : maps[state.scene].subtitle}</span>${btn("設定", "settings")}</footer><div class="spots">${maps[state.scene].spots.map((s) => `<button class="spot" style="left:${s.x}px;top:${s.y}px" data-action="spot:${s.id}" aria-label="靠近並調查${s.label}" title="${s.label}"><i></i></button>`).join("")}</div>` : ""}${mode === "menu" ? menu() : mode === "opening" ? opening() : mode === "end" ? ending() : ""}${feedback && playing ? `<div class="toast" role="status">${feedback}</div>` : ""}${leaving ? '<div class="end-fade" aria-label="回放時間 01:17">01:17</div>' : ""}${panel ? `<div class="panel-shade"><section class="panel" role="dialog" aria-modal="true" aria-label="調查面板" data-panel="${panel}" tabindex="-1"><div class="panel-top"><small>站務維修 · ${panel === "journal" ? "筆記" : "近景閱讀"}</small>${btn("關閉 ×", "close", 'aria-label="關閉面板"')}</div><div class="panel-body">${content()}</div><p class="panel-feedback" role="status">${feedback}</p></section></div>` : ""}`, settings.language);
  document.body.classList.toggle("panel-open", !!panel || !playing);
  applySettings();
  if (panel) {
    const body = ui.querySelector(".panel-body")!;
    if (oldPanel === panel) body.scrollTop = scroll;
    const heading = body.querySelector("h2");
    if (heading) {
      heading.id = "panel-title";
      ui.querySelector(".panel")!.setAttribute("aria-labelledby", heading.id);
    }
  }
  uiFocus.restore(
    ui,
    focusBefore,
    `${mode}:${state.scene}`,
    panel,
    playing
      ? ["spot:back", "settings"]
      : ["begin", "continue", "start", "menu"],
  );
}
function inspect(s: Spot) {
  if (s.id === "back") {
    send({ type: "back" });
    panel = "";
    render();
    return;
  }
  if (s.id === "platformDoor") {
    send({ type: "platform" });
    panel = "";
    render();
    return;
  }
  uiFocus.openFrom(`spot:${s.id}`);
  panel = s.id;
  feedback = "";
  selected = "";
  for (const id of s.id === "dispenser"
    ? ["tag"]
    : s.id === "sticker"
      ? ["sticker"]
      : s.id === "cabinet" && state.broadcast
        ? ["report", "log", "roster"]
        : [])
    state = act(state, { type: "read", value: id }).state;
  persist();
  sound.play(
    s.id === "water"
      ? "water"
      : [
            "powerBox",
            "endDoor",
            "maintenanceDoor",
            "console",
            "lightbox",
          ].includes(s.id)
        ? "metal"
        : "paper",
  );
  if (s.id === "routeMap" && settings.subtitles) sound.play("voice");
  render();
}
const world = new Station({
  getState: () => state,
  isPaused: () => mode !== "play" || !!panel,
  inspect,
  position: (x, y) => {
    state.position = { x, y };
    persist();
  },
  nearby: (s) => {
    nearby = s;
    const el = document.querySelector("#near-label");
    if (el) el.textContent = translateText(s ? `E · ${s.label}` : maps[state.scene].subtitle, settings.language);
  },
});
const game = new Phaser.Game({
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
  input: { keyboard: true },
  scale: { mode: Phaser.Scale.NONE },
});
ui.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!b) return;
  const [a, v] = b.dataset.action!.split(":");
  sound.play("paper");
  if (a === "close") {
    panel = "";
    feedback = "";
    render();
    return;
  }
  if (a === "spot") {
    const s = maps[state.scene].spots.find((s) => s.id === v)!;
    world.goto(s);
    return;
  }
  if (a === "start") {
    state = fresh();
    wave = [];
    mode = "opening";
    panel = "";
    hasSave = true;
    persist();
    world.redraw();
    render();
    return;
  }
  if (a === "new") {
    panel = "newConfirm";
    render();
    return;
  }
  if (a === "begin") {
    mode = "play";
    panel = "";
    sound.play("ambient");
    feedback = "靠近物件按 E；也可點擊物件，自動走近調查。";
    persist();
    render();
    return;
  }
  if (a === "continue") {
    mode = state.lastEnding ? "end" : "play";
    feedback = "";
    render();
    return;
  }
  if (a === "menu") {
    if (mode === "end" && state.lastEnding === "B" && !settings.reduced) {
      leaving = true;
      render();
      setTimeout(() => {
        leaving = false;
        mode = "menu";
        panel = "";
        feedback = "";
        render();
      }, 1000);
    } else {
      mode = "menu";
      panel = "";
      feedback = "";
      render();
    }
    return;
  }
  if (a === "reselect") {
    panel = "";
    mode = "play";
    send({ type: "reselect" });
    return;
  }
  if (["settings", "journal", "hint", "credits"].includes(a)) {
    panel = a;
    feedback = "";
    render();
    return;
  }
  if (a === "hintNext") {
    send({ type: "hint", value: activePuzzle() });
    return;
  }
  if (a === "testSound") {
    sound.play("metal");
    return;
  }
  if (a === "broadcast") {
    sound.marker();
    feedback = settings.subtitles
      ? story.documents.broadcast.text
      : "訊號重播中；完整字幕保留於調查筆記。";
    render();
    return;
  }
  if (a === "export") {
    download(
      exportSave(state),
      settings.language === "en"
        ? "After-the-Yellow-Light-v2-save.json"
        : "黃燈之後-v2-存檔.json",
    );
    feedback = "已送出目前進度的下載請求；請確認檔案已保存。";
    render();
    return;
  }
  if (a === "exportRecovery") {
    const result = exportRecovery();
    if (result.raw !== null)
      download(
        result.raw,
        settings.language === "en"
          ? "After-the-Yellow-Light-v2-recovery-data.json"
          : "黃燈之後-v2-本機原檔-排查用.json",
      );
    feedback =
      result.warning ||
      "已送出本機原檔的下載請求；這是排查資料，請另行匯出目前進度。";
    render();
    return;
  }
  if (a === "item") {
    selected = ownership(v) ? (selected === v ? "" : v) : "";
    feedback = selected
      ? `已選擇${story.items[v as keyof typeof story.items]}。靠近對應設備後可直接安裝／使用。`
      : "這格物品目前不在背包。";
    render();
    return;
  }
  if (a === "wave") {
    if (wave.length < 3) wave.push(v);
    render();
    return;
  }
  if (a === "waveUndo") {
    wave.pop();
    render();
    return;
  }
  if (a === "waveClear") {
    wave = [];
    render();
    return;
  }
  if (a === "waveCheck") {
    send({ type: "wave", value: wave });
    if (state.broadcast && settings.subtitles) sound.marker();
    return;
  }
  if (a === "endpoint") {
    if (!linkStart) {
      linkStart = v;
      feedback = "再選一項可印證的證據。";
      render();
      return;
    }
    const i = story.links.findIndex(
      (pair) => pair.includes(linkStart) && pair.includes(v) && linkStart !== v,
    );
    if (i >= 0) {
      send({ type: "link", value: i });
      feedback =
        i === 0
          ? "同一分鐘：兩種時間寫法相符。時間本身不證明造假。"
          : "林沐簽名與官方否認互相矛盾；仍需側光確認。";
    } else feedback = "這兩項尚不足以互相印證；已確認的連線保留。";
    linkStart = "";
    render();
    return;
  }
  if (a === "conclude") {
    send({ type: "conclude", value: Number(v) });
    return;
  }
  if (a === "node") {
    send({ type: "node", value: v });
    return;
  }
  if (a === "ending") {
    panel = "";
    if (v === "B") sound.marker();
    send({ type: "end", value: v });
    return;
  }
  const before = state.scene;
  send({ type: a });
  if (state.scene !== before) {
    panel = "";
    nearby = null;
    sound.play("ambient");
    render();
  }
});
ui.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement,
    key = el.dataset.setting as keyof Settings;
  if (!key) return;
  if (key === "language") {
    settings.language = el.value === "en" ? "en" : "zh-Hant";
    applySettings();
    render();
    return;
  }
  if (["large", "reduced", "subtitles", "mute"].includes(key))
    (settings[key] as boolean) = el.checked;
  else (settings[key] as number) = Number(el.value);
  applySettings();
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    if (panel) {
      panel = "";
      feedback = "";
      render();
    } else if (mode === "play") {
      panel = "settings";
      render();
    }
  }
  if (panel && e.key === "Tab") {
    const els = [
      ...ui.querySelectorAll<HTMLElement>(
        '.panel button,.panel input,.panel [tabindex="0"]',
      ),
    ];
    if (!els.length) return;
    const first = els[0],
      last = els.at(-1)!;
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.classList.contains("panel"))
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
addEventListener("pagehide", () => {
  if (hasSave && mode !== "menu") persist();
});
render();

void document.fonts.ready.then(() => {
  if (world.sys.isActive()) world.redraw();
});

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true));
