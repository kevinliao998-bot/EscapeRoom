import {
  type State,
  proposal,
  puzzle,
  sourceDoc,
  canRead,
  activePuzzle,
  terminalOn,
  guidanceOn,
  isolationReady,
  exitReady,
  switches,
} from "./model.ts";
import {
  documents as b1docs,
  circuits,
  loads,
  loadNames,
  consumption,
  valves,
  hints as b1hints,
} from "../Expansion/model.ts";
import { story } from "../Game/src/core.ts";
import type { Settings } from "../Game/src/audio.ts";
export const btn = (label: string, action: string, extra = "") =>
  `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
export const esc = (v: unknown) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const documentCard = (title: string, text: string) =>
  `<article class="document"><small>站務原件 · 僅供核對</small><h2>${esc(title)}</h2><p>${esc(text).replaceAll("\n", "<br>")}</p></article>`;
export const doc = (id: string) =>
  documentCard(sourceDoc(id).title, sourceDoc(id).text);
const bdoc = (id: keyof typeof b1docs) =>
  documentCard(b1docs[id].title, b1docs[id].text);
const mark = (yes: boolean) => (yes ? "已完成" : "待處理");
const docButton = (id: string) => btn(sourceDoc(id).title, "doc:" + id);
export function panelContent(
  id: string,
  s: State,
  settings: Settings,
  selected: string,
) {
  if (/^D\d\d$/.test(id))
    return canRead(s, id)
      ? doc(id)
      : "<h2>尚未解封</h2><p>先核對這一層的現場證據。</p>";
  switch (id) {
    case "intro":
      return `<h2>${s.floor === "B1" ? "工單不是一封即時求救" : s.floor === "B2" ? "被刪掉的七分鐘" : "最後一次復位"}</h2><p>${s.floor === "B1" ? "維修門後有排水與門禁兩套裝置。先在配電室辨認線束；泵房能驗證實際流向。今夜安全處置已完成，不需要你留在把手旁。" : s.floor === "B2" ? "工單證明林沐主動留守；還不清楚門為何重鎖。兩台備援時鐘偏差不同，不能直接按顯示時間排事件。" : "D 權限只說明執行資格，不等於有人當場刷卡。總控原件能回答觸發方式，也留下救援與移交資料。先隔離兩路導引。"}</p>${s.floor === "B1" ? doc("D01") : s.floor === "B3" ? doc("D13") : ""}`;
    case "b1docs":
      return (
        "<h2>回路工單與接頭圖</h2>" +
        bdoc("work") +
        bdoc("rack") +
        bdoc("plugs")
      );
    case "wiring":
      return `<h2>五回路插槽</h2><p>從工單、固定架與接頭圖找出全部約束。先選線束，再選插槽；移動不會遺失。</p>${btn("重看三份回路標記", "panel:b1docs")}<div class="button-row">${circuits.map((c) => btn(c, "select:" + c, `aria-pressed="${selected === c}" class="${selected === c ? "selected" : ""}" ${s.b1.wired ? "disabled" : ""}`)).join("")}</div><div class="circuit-row">${s.b1.slots.map((c, i) => btn(`${i + 1} · ${c || "空槽"}`, "place:" + i, s.b1.wired ? "disabled" : "")).join("")}</div>${btn(s.b1.wired ? "回路已辨認" : "送出接線校驗", "wire", 'class="primary"')}<p>初始恢復照明、通訊與排風。後續按設備需求切換分路。</p>`;
    case "power":
      return `<h2>現場供電 · ${consumption(s.b1)}／4 格</h2>${bdoc("capacity")}<div class="device-grid">${(Object.keys(loads) as (keyof typeof loads)[]).map((k) => btn(`${loadNames[k]} · ${loads[k]} 格 · ${s.b1.power[k] ? "接通" : "斷開"}`, "power:" + k, `aria-pressed="${s.b1.power[k]}"`)).join("")}</div>`;
    case "pipes":
      return (
        "<h2>實際管線與舊圖</h2>" +
        bdoc("oldPipe") +
        btn("停止排風後觀察檢修窗", "trace") +
        (s.b1.traceSeen
          ? bdoc("trace")
          : "<p>檢修窗需要照明；風機停轉後才能看清新增支路。</p>")
      );
    case "valves":
      return `<h2>泵房四閥 · 水位${s.b1.water === "high" ? "高" : "安全"}</h2><div class="pipe-diagram">積水槽 → A → 泵浦 → B → 排水井<br>　　　　　　　　　 ↘ C 支路／D 支路</div><div class="button-row">${valves.map((v) => btn(`${v} 閥 · ${s.b1.valves[v] ? "開" : "關"}`, "valve:" + v, `aria-pressed="${s.b1.valves[v]}"`)).join("")}</div>${btn("啟動一個排水循環", "drain", 'class="primary"')}${btn("比對舊圖及實際管線", "panel:pipes")}<p>沒有倒數；錯路只停止排水，不消耗物品或清除進度。</p>`;
    case "check":
      return bdoc("check");
    case "gateHistory":
      return doc("D02");
    case "gate":
      return `<h2>隔離門放行檢查</h2>${bdoc("sensor")}<ul><li>水位：${s.b1.water === "safe" ? "安全" : "高"}</li><li>泵浦：${s.b1.power.pump ? "運轉" : "停止"}</li><li>止回閥：${s.b1.checkClosed ? "閉合" : "開啟"}</li><li>照明／門鎖：${s.b1.power.light ? "亮" : "暗"}／${s.b1.power.lock ? "有電" : "無電"}</li></ul>${btn("操作隔離門", "gate", 'class="primary"')}${s.b1.door ? doc("D03") + btn("走入 B2 封存層", "travel:B2", 'class="primary"') : docButton("D02")}`;
    case "calibration":
      return `<h2>兩台備援時鐘</h2><article class="document"><h3>事故前同一次標準時脈測試</h3><p>標準 01:10；控制終端 01:12；監視錄影 01:09。事故期間未重置，偏差固定。</p><p>偏差＝設備顯示－標準；真實時間＝顯示－偏差。</p></article>${(["terminal", "cctv"] as const).map((k) => `<div class="offset"><span>${k === "terminal" ? "控制終端" : "監視錄影"}偏差：${s.b2[k] > 0 ? "+" : ""}${s.b2[k]} 分</span>${btn("減一分", "offset:" + k + ":-1")}${btn("加一分", "offset:" + k + ":1")}</div>`).join("")}${btn("以這組偏差比對事件", "panel:timeline")}`;
    case "timeline": {
      const events = puzzle("EP04").events!;
      return `<h2>事故事件時間線</h2><p>終端偏差 ${s.b2.terminal} 分；錄影偏差 ${s.b2.cctv} 分。選事件依真實先後排列。</p>${btn("重看標準時脈與偏差", "panel:calibration")}<div class="event-list">${[
        4, 1, 3, 0, 2,
      ]
        .map((i) => {
          const e = events[i],
            o = e.source === "控制終端" ? s.b2.terminal : s.b2.cctv;
          const t = Number(e.display.slice(3)) - o;
          return btn(
            `${e.source} ${e.display} → 01:${String(t).padStart(2, "0")} · ${e.event}`,
            "event:" + i,
            s.b2.events.includes(i) ? "disabled" : "",
          );
        })
        .join(
          "",
        )}</div><div class="draft" aria-label="事件排序草稿">${s.b2.events.map((i, j) => `<p>${j + 1}. ${events[i].event}</p>`).join("") || "尚未排序"}</div>${btn("清空事件草稿", "clearEvents")}${btn("確認校時與排序", "checkTime", 'class="primary"')}${s.b2.timeline ? "<p>已核對：01:17 斷電 → 01:19 切通訊 → 01:20 排水 → 01:22 放行 → 01:24 復位。</p>" + docButton("D04") : ""}`;
    }
    case "audio":
      return `<h2>原始錄音片段</h2>${
        !s.b2.timeline
          ? "<p>先在監控室建立可比對的校正時間線。</p>"
          : `<p>對照設備狀態與時間線排列；三聲只代表重播標記。</p>${puzzle(
              "EP05",
            )
              .clips!.map(
                (c) =>
                  `<article class="document"><h3>片段 ${c.id}</h3><p>「${c.quote}」</p><small>${c.evidence}</small></article>${btn("加入 " + c.id, "clip:" + c.id, s.b2.clips.includes(c.id) ? "disabled" : "")}`,
              )
              .join(
                "",
              )}<div class="draft">順序：${s.b2.clips.join(" → ") || "尚未選取"}</div>${btn("清空錄音草稿", "clearClips")}${btn("核對設備先後", "checkAudio", 'class="primary"')}${s.b2.audio ? btn("對照剪接廣播", "panel:splice") : ""}`
      }`;
    case "splice":
      return `<h2>同一句話，少掉了什麼？</h2>${!s.b2.audio ? "<p>先還原四段原始錄音的順序。</p>" : `<p>原音 B 與廣播保留相同中段。標線是可見的剪接接縫，靜音也可核對。</p><div class="wave-compare"><strong>原音 B</strong><div class="waveform"><span>不要</span><span>重新接通通訊</span><span>會把維修門鎖回去！</span></div><strong>廣播</strong><div class="waveform edited"><span>〔剪除〕</span><span>重新接通通訊。</span><span>〔剪除〕</span></div></div><p>哪一項可由這份對照支持？</p>${btn("否定詞與後半警告被剪除，指示反向", "splice:negation")}${btn("三聲證明林沐今晚在線", "splice:identity")}${btn("少掉的語音表示錄音者已死亡", "splice:death")}${s.b2.splice ? "<p>比對完成，保留原文與剪接版本。下一步到證物取件區。</p>" : ""}`}`;
    case "cards":
      return `<h2>證物保管格 · 憑證索引</h2><p>檢索發生在真實 01:24 的復位操作，需同時有「門鎖、導引」權限；不是拿卡指認某人。</p>${
        !s.b2.splice
          ? "<p>先核對事件時間線與剪接警告。</p>"
          : `<div class="event-list">${puzzle("EP06")
              .cards!.map((c) =>
                btn(
                  `${c.id} 格 · ${c.permissions.join("／")} · ${c.id === "B" ? "終端顯示 01:25 停用" : "在事故操作時段未停用"}`,
                  "card:" + c.id,
                ),
              )
              .join(
                "",
              )}</div>${s.b2.key ? doc("D05") + btn("持檢修鑰匙進入 B3", "travel:B3", 'class="primary"') : ""}`
      }`;
    case "grid":
      return `<h2>雙路導引隔離</h2>${doc("D13")}<div class="device-grid">${switches.map((k) => btn(`${k} · ${s.b3.power[k] ? "接通" : "斷開"} · ${puzzle("EP07").switches![k]}`, "switch:" + k, `aria-pressed="${s.b3.power[k]}"`)).join("")}</div><div class="draft">照明 ${s.b3.power.A ? "有電" : "無電"}／升降梯 ${s.b3.power.C ? "有電" : "無電"}／導引 ${guidanceOn(s) ? "仍有電" : "無電"}／檢修終端 ${terminalOn(s) ? "有電" : "無電"}</div>${btn("驗證隔離並解除工作井安全罩", "checkIsolation", 'class="primary"')}`;
    case "bolts":
      return `<h2>四根互鎖栓</h2><p>每次拉把手，與它相連的鎖栓會反轉。伸出／縮回均可觀察；沒有次數限制。</p><div class="bolt-row">${[1, 2, 3, 4].map((n) => `<span class="bolt ${s.b3.bolts & (1 << (n - 1)) ? "extended" : ""}">${n} · ${s.b3.bolts & (1 << (n - 1)) ? "伸出" : "縮回"}</span>`).join("")}</div><div class="device-grid">${switches.map((k) => btn(`${k} 把手 → ${puzzle("EP08").handles![k].join("、")} 栓`, "handle:" + k)).join("")}</div><p>${s.b3.hatch ? "四栓已縮回，通路保持開啟。" : isolationReady(s) ? "觀察孔已開，請操作把手。" : "先回配電觀察室隔離兩路導引。"}</p>${s.b3.hatch ? btn("查看救援與身分資料", "panel:records", 'class="primary"') : ""}`;
    case "records":
      return `<h2>她留下的，能證明什麼？</h2>${
        !s.b3.hatch
          ? "<p>先解除互鎖工作井，原始資料匣在安全罩後。</p>"
          : `<p>先逐份核對原件，不用聲音判斷生死。</p><div class="event-list">${["D07", "D08", "D09", "D10"].map(docButton).join("")}</div><h3>身分關聯副本</h3>${[
              "林沐對應哪張現場作業卡？",
              "泵房救援對應哪個個案？",
              "醫療回報對應哪個移交？",
            ]
              .map(
                (q, i) =>
                  `<p>${q}</p><div class="button-row">${[
                    ["D", "M-042", "R-0124-07"],
                    ["U-017-03", "T-017-R2", "Q-017"],
                    ["M-042", "H-017-03", "D"],
                  ][i]
                    .map((v) =>
                      btn(
                        v,
                        "identity:" + i + ":" + v,
                        `aria-pressed="${s.b3.identity[i] === v}" class="${s.b3.identity[i] === v ? "selected" : ""}"`,
                      ),
                    )
                    .join("")}</div>`,
              )
              .join(
                "",
              )}${btn("核對通知與修訂歷史", "panel:history")}${btn("交叉核對身分鏈", "checkIdentity", 'class="primary"')}<p>${s.b3.verified ? "關聯已核對；更正申請另存，不覆寫原名冊。" : "尚未確認。D 是權限索引，不是身分卡。"}</p>`
      }`;
    case "history":
      return `<h2>誰下了命令？通知何時送達？</h2>${!s.b3.hatch ? "<p>資料匣尚未解封。</p>" : `<div class="event-list">${["D06", "D11", "D12"].map(docButton).join("")}</div><p>請分清：自動排程、摘要剪接錯誤、人工刪改報告，是三件可分別核對的事。共用帳號不能指認個人。</p>`}`;
    case "controller":
      return `<h2>實體 K-CTRL 檢修分路</h2><p>此開關獨立於 A 照明與 C 升降梯。提前斷電不會抹除資料或停用排程，復電可補做。</p><div class="draft">K-CTRL ${s.b3.controller ? "接通" : "隔離"}；終端${terminalOn(s) ? "可讀" : "無電"}</div>${btn("實體隔離 K-CTRL", "cut")}${btn("恢復 K-CTRL 供電", "restorePower")}${btn("重看雙路分線", "panel:grid")}`;
    case "shutdown":
      return `<h2>安全停機 · R-0124-07</h2><p>檢修終端：${terminalOn(s) ? "供電中" : "暫時無電，可接回 A 與 K-CTRL"}。單純斷電不等於取消復位。</p><ul><li>自動復位來源原件：${s.read.includes("D06") ? "已核對" : "待查閱"}</li><li>原始身分鏈：${mark(s.b3.verified)}</li><li>唯讀備份：${mark(s.b3.backup)}</li><li>停用請求：${s.b3.requested ? "已接收" : "尚未送出"}</li><li>持久停用回報：${s.b3.disabled ? "執行完成" : "尚未完成"}</li></ul><div class="event-list">${btn("核對原始身分鏈", "panel:records")}${btn("核對復位與修訂歷史", "panel:history")}${btn("備份原始記錄，另存更正副本", "backup")}${btn("送出停用復位請求", "request")}${btn("查詢停用執行回報", "receipt")}${btn("執行安全停機", "shutdown", 'class="primary"')}${btn("實體隔離／恢復 K-CTRL", "panel:controller")}</div>${s.b3.backup ? docButton("D14") : ""}`;
    case "elevator":
      return `<h2>升降梯 · 最後離站檢查</h2><ul>${[
        ["證據鏈及備份", s.b3.verified && s.b3.backup],
        ["復位已停用，執行完成", s.b3.disabled],
        ["K-CTRL 已隔離", !s.b3.controller],
        ["保留照明及升降梯、導引無電", isolationReady(s)],
        ["B2 檢修旁路鑰匙", s.b2.key],
        ["駐停鎖已解除", s.b3.unlocked],
      ]
        .map(([t, v]) => `<li>${t}：${mark(!!v)}</li>`)
        .join(
          "",
        )}</ul>${btn("用旁路鑰匙解除駐停鎖", "unlock")}${btn("帶著證據搭乘升降梯離站", "exit", `class="primary" ${exitReady(s) ? "" : 'aria-describedby="exit-note"'}`)}<p id="exit-note">未完成時只拒絕放行，可返回補做；鑰匙不消耗。</p>`;
    case "stairs":
      return `<h2>維修通道 · 已完成的通路保持</h2><div class="event-list">${btn("返回第零層月台", "travel:L0")}${btn("B1 維修層", "travel:B1")}${btn("B2 封存層", "travel:B2")}${btn("B3 總控層", "travel:B3")}</div><p>進度和已讀文件跨層保留。未解開的門會說明前置條件。</p>`;
    case "journal":
      return `<h2>林澄的調查筆記</h2><small>只保留已讀文件及已完成的比對</small><div class="event-list">${s.read.map(docButton).join("")}${s.b1.read
        .filter((k) => !["intake", "gateHistory", "lin"].includes(k))
        .map((k) => btn(b1docs[k].title, "bdoc:" + k))
        .join(
          "",
        )}${s.base.read.map((k) => btn(story.documents[k as keyof typeof story.documents].title, "baseDoc:" + k)).join("")}</div>${s.b2.timeline ? '<article class="document"><h3>已核對的真實時間</h3><p>終端偏差 +2；錄影偏差 −1。01:17 斷電 → 01:19 切通訊 → 01:20 排水 → 01:22 放行 → 01:24 復位。</p></article>' : ""}${s.b2.splice ? '<article class="document"><h3>原音排序 C → A → D → B</h3><p>「不要」及後半警告被剪除；三聲只代表重播標記。</p></article>' : ""}`;
    case "hint": {
      const p = activePuzzle(s),
        n = s.hints[p] || 0,
        h =
          p.startsWith("EP0") && ["EP01", "EP02", "EP03"].includes(p)
            ? b1hints[p as keyof typeof b1hints]
            : puzzle(p).hints;
      return `<h2>調查方向 · ${p}</h2><p>提示不扣資源；最多三級，不自動操作機關。</p>${h
        .slice(0, n)
        .map((h, i) => `<p class="hint">${i + 1} · ${esc(h)}</p>`)
        .join("")}${n < 3 ? btn("查看下一級提示", "hint:" + p) : ""}`;
    }
    case "settings":
      return `<h2>設定與存檔</h2><div class="settings-grid">${(["large", "reduced", "subtitles", "mute"] as const).map((k, i) => `<label><input type="checkbox" data-setting="${k}" ${settings[k] ? "checked" : ""}>${["大字閱讀", "減少動態", "回放字幕", "全部靜音"][i]}</label>`).join("")}${(["master", "ambient", "effects", "voice"] as const).map((k, i) => `<label>${["總音量", "環境", "音效", "訊號標記"][i]}<input aria-label="${["總音量", "環境", "音效", "訊號標記"][i]}" data-setting="${k}" type="range" min="0" max="1" step="0.05" value="${settings[k]}"></label>`).join("")}</div><p>全部音訊資訊有文字。無配音、倒數或閃爍。整合進度與原版、B1 試玩存檔分開。</p>${btn("匯出目前整合進度", "export")}${btn("匯入整合 JSON 副本", "import")}${btn("匯出本機原文供排查", "raw")}${btn("返回整合主選單", "menu")}`;
    case "restart":
      return (
        "<h2>開始新的整合調查？</h2><p>只替換這個瀏覽器的整合進度；原版與獨立 B1 存檔保留。可先匯出。</p>" +
        btn("匯出目前進度", "export") +
        btn("確認開始新調查", "restart")
      );
    case "importConfirm":
      return (
        "<h2>匯入已驗證的整合進度？</h2><p>將替換目前整合進度。先匯出可保留現有進度，原版與獨立 B1 存檔不變。</p>" +
        btn("先匯出目前進度", "export") +
        btn("確認匯入此副本", "importApply")
      );
    default:
      if (id.startsWith("bdoc-"))
        return bdoc(id.slice(5) as keyof typeof b1docs);
      if (id.startsWith("baseDoc-")) {
        const d = story.documents[id.slice(8) as keyof typeof story.documents];
        return d ? documentCard(d.title, d.text) : "";
      }
      return "<h2>現場調查</h2>";
  }
}
