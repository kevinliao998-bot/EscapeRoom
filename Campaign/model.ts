import {
  fresh as baseFresh,
  act as baseAct,
  valid as baseValid,
  type State as Base,
  type Action as BaseAction,
} from "../Game/src/core.ts";
import {
  fresh as b1Fresh,
  act as b1Act,
  restore as b1Restore,
  proposal,
  type State as B1,
  type Action as B1Action,
} from "../Expansion/model.ts";
export { proposal };
export type Floor = "L0" | "B1" | "B2" | "B3" | "end";
export type Switch = "A" | "B" | "C" | "D";
export const switches: Switch[] = ["A", "B", "C", "D"];
export const floorNames = {
  L0: "第零層 · 她在呼救",
  B1: "維修層 · 被中斷的撤離",
  B2: "封存層 · 被刪掉的七分鐘",
  B3: "總控層 · 最後一次復位",
  end: "黃燈之後",
};
export const rooms = {
  B1: ["distribution", "pump", "vestibule"],
  B2: ["monitor", "recording", "evidence"],
  B3: ["observation", "interlock", "control"],
} as const;
export const roomNames: Record<string, string> = {
  distribution: "配電室",
  pump: "泵房",
  vestibule: "隔離門前廳",
  monitor: "監控室",
  recording: "錄音保管室",
  evidence: "證物取件區",
  observation: "配電觀察室",
  interlock: "互鎖工作井",
  control: "總控終端",
};
export interface State {
  schema: 1;
  floor: Floor;
  room: string;
  base: Base;
  b1: B1;
  b2: {
    terminal: number;
    cctv: number;
    events: number[];
    timeline: boolean;
    clips: string[];
    audio: boolean;
    splice: boolean;
    key: boolean;
  };
  b3: {
    power: Record<Switch, boolean>;
    controller: boolean;
    isolated: boolean;
    bolts: number;
    hatch: boolean;
    identity: string[];
    verified: boolean;
    backup: boolean;
    requested: boolean;
    disabled: boolean;
    unlocked: boolean;
    exited: boolean;
  };
  read: string[];
  hints: Record<string, number>;
}
export const puzzle = (id: string) =>
  proposal.puzzles.find((p) => p.id === id)!;
export const sourceDoc = (id: string) =>
  proposal.documents.find((d) => d.id === id)!;
export function fresh(): State {
  return {
    schema: 1,
    floor: "L0",
    room: "distribution",
    base: baseFresh(),
    b1: b1Fresh(),
    b2: {
      terminal: 0,
      cctv: 0,
      events: [],
      timeline: false,
      clips: [],
      audio: false,
      splice: false,
      key: false,
    },
    b3: {
      power: { A: true, B: true, C: true, D: true },
      controller: true,
      isolated: false,
      bolts: 8,
      hatch: false,
      identity: ["", "", ""],
      verified: false,
      backup: false,
      requested: false,
      disabled: false,
      unlocked: false,
      exited: false,
    },
    read: [],
    hints: {},
  };
}
export const terminalOn = (s: State) => s.b3.power.A && s.b3.controller;
export const guidanceOn = (s: State) =>
  (s.b3.power.A && s.b3.power.B) || (s.b3.power.C && s.b3.power.D);
export const isolationReady = (s: State) =>
  s.b3.power.A && s.b3.power.C && !s.b3.power.B && !s.b3.power.D;
export const exitReady = (s: State) =>
  s.b3.hatch &&
  s.b3.verified &&
  s.b3.backup &&
  s.b3.disabled &&
  !s.b3.controller &&
  isolationReady(s) &&
  s.b2.key &&
  s.b3.unlocked;
export function canTravel(s: State, f: Floor) {
  return (
    f === "L0" ||
    (f === "B1" && s.base.door) ||
    (f === "B2" && s.base.door && s.b1.door) ||
    (f === "B3" && s.base.door && s.b1.door && s.b2.key) ||
    (f === "end" && exitReady(s))
  );
}
export function canRead(s: State, id: string) {
  if (id === "D01") return true;
  if (id === "D02") return s.base.door;
  if (id === "D03") return s.b1.door;
  if (id === "D07") return s.b1.door;
  if (id === "D04") return s.b2.timeline;
  if (id === "D05") return s.b2.key;
  if (id === "D13") return s.b2.key;
  if (["D06", "D08", "D09", "D10", "D11", "D12"].includes(id))
    return s.b3.hatch;
  if (id === "D14") return s.b3.backup && s.b3.verified;
  return false;
}
export type Action =
  | { type: "base"; action: BaseAction }
  | { type: "b1"; action: B1Action }
  | { type: "travel"; floor: Floor }
  | { type: "room"; room: string }
  | { type: "read"; id: string }
  | { type: "hint"; id: string }
  | { type: "offset"; device: "terminal" | "cctv"; value: number }
  | { type: "event"; index: number }
  | { type: "clearEvents" }
  | { type: "checkTime" }
  | { type: "clip"; id: string }
  | { type: "clearClips" }
  | { type: "checkAudio" }
  | { type: "splice"; id: string }
  | { type: "card"; id: string }
  | { type: "switch"; id: Switch }
  | { type: "checkIsolation" }
  | { type: "handle"; id: Switch }
  | { type: "identity"; index: number; id: string }
  | { type: "checkIdentity" }
  | {
      type:
        | "backup"
        | "request"
        | "receipt"
        | "shutdown"
        | "cut"
        | "restorePower"
        | "unlock"
        | "exit";
    };
export function act(
  input: State,
  a: Action,
): { state: State; message: string } {
  const s = structuredClone(input);
  let message = "";
  const fail = (m: string) => {
    message = m;
  };
  const read = (id: string) => {
    if (canRead(s, id) && !s.read.includes(id)) s.read.push(id);
  };
  if (a.type === "base") {
    if (s.floor === "L0" && a.action.type !== "end") {
      const r = baseAct(s.base, a.action);
      s.base = r.state;
      message = r.message;
    }
    return { state: s, message };
  }
  if (a.type === "b1") {
    if (s.floor === "B1") {
      const r = b1Act(s.b1, a.action);
      s.b1 = r.state;
      message = r.message;
      if (s.b1.door) read("D03");
    }
    return { state: s, message };
  }
  if (a.type === "travel") {
    if (canTravel(s, a.floor)) {
      s.floor = a.floor;
      if (a.floor === "B1") s.room = s.b1.room;
      else if (a.floor === "B2") s.room = "monitor";
      else if (a.floor === "B3") s.room = "observation";
      message = "通路保持開啟。已完成的機關與筆記保留。";
    } else fail("先完成這一層的通路。門旁的檢查表列出尚未完成的條件。");
    return { state: s, message };
  }
  if (a.type === "room") {
    if (
      s.floor !== "L0" &&
      s.floor !== "end" &&
      (rooms[s.floor] as readonly string[]).includes(a.room)
    ) {
      s.room = a.room;
      if (s.floor === "B1") s.b1.room = a.room as B1["room"];
    }
    return { state: s, message };
  }
  if (a.type === "read") {
    if (canRead(s, a.id)) {
      read(a.id);
    } else fail("這份原始文件尚未解封，不會提前寫入筆記。");
    return { state: s, message };
  }
  if (a.type === "hint") {
    if (proposal.puzzles.some((p) => p.id === a.id))
      s.hints[a.id] = Math.min(3, (s.hints[a.id] || 0) + 1);
    return { state: s, message };
  }
  if (s.floor === "B2") {
    switch (a.type) {
      case "offset":
        if (Number.isInteger(a.value) && Math.abs(a.value) <= 5)
          s.b2[a.device] = a.value;
        break;
      case "event":
        if (
          Number.isInteger(a.index) &&
          a.index >= 0 &&
          a.index < 5 &&
          !s.b2.events.includes(a.index)
        )
          s.b2.events.push(a.index);
        break;
      case "clearEvents":
        s.b2.events = [];
        break;
      case "checkTime":
        if (
          s.b2.terminal === 2 &&
          s.b2.cctv === -1 &&
          JSON.stringify(s.b2.events) === "[0,1,2,3,4]"
        ) {
          s.b2.timeline = true;
          read("D04");
          message =
            "時間線吻合。放行先成功，兩分鐘後才被復位覆寫。校時與排序已存入筆記。";
        } else
          fail(
            "時鐘偏差或事件順序尚未吻合。草稿保留；偏差＝設備顯示－標準時間，真實時間＝顯示－偏差。",
          );
        break;
      case "clip":
        if (
          s.b2.timeline &&
          ["A", "B", "C", "D"].includes(a.id) &&
          !s.b2.clips.includes(a.id)
        )
          s.b2.clips.push(a.id);
        break;
      case "clearClips":
        s.b2.clips = [];
        break;
      case "checkAudio":
        if (!s.b2.timeline) fail("先建立校正時間線。");
        else if (s.b2.clips.join("") === "CADB") {
          s.b2.audio = true;
          message = "設備狀態與事件先後吻合。還要指出廣播捨棄了哪一段語境。";
        } else
          fail(
            "順序尚未吻合。比較排風、泵浦、水位與門閂；三聲不是時間或身分證明。草稿保留。",
          );
        break;
      case "splice":
        if (s.b2.audio && a.id === "negation") {
          s.b2.splice = true;
          message =
            "原句的「不要」與後半警告被刪除，剩下相反指令。證物櫃的檢索條件已解封。";
        } else
          fail(
            s.b2.audio
              ? "這份比對只能證明指令被反向；三聲是重播標記，不能證明當下在線或生死。已還原的錄音順序保留。"
              : "先還原錄音；波形接縫與原句可靜音對照。",
          );
        break;
      case "card":
        if (!s.b2.timeline || !s.b2.splice) fail("先完成時間線及剪接比對。");
        else if (a.id === "D") {
          s.b2.key = true;
          read("D05");
          message =
            "D 當時有兩項權限且有效。領取同組檢修旁路鑰匙與唯讀副本；不能據此指認操作者。工作井可通往 B3。";
        } else
          fail(
            a.id === "B"
              ? "B 的終端停用時間 01:25，減去偏差後是 01:23，早於操作。證物與其他線索保留。"
              : "權限未同時包含門鎖與導引。請重新檢索，不消耗卡片。",
          );
        break;
    }
  }
  if (s.floor === "B3") {
    switch (a.type) {
      case "switch":
        s.b3.power[a.id] = !s.b3.power[a.id];
        s.b3.unlocked = false;
        message =
          !s.b3.power.B && guidanceOn(s)
            ? "主電導引支路已隔離，備援導引仍有電。"
            : !s.b3.power.A
              ? "照明與檢修終端暫停，可手動接回 A；資料不會消失。"
              : !s.b3.power.C
                ? "升降梯備援斷開；離站前需接回 C。"
                : "分線狀態已更新。";
        break;
      case "checkIsolation":
        if (isolationReady(s)) {
          s.b3.isolated = true;
          message = "雙路導引已隔離，照明與升降梯仍有電。工作井安全罩解除。";
        } else
          fail("目標：導引完全無電，同時保留照明與升降梯。核對另一側支路。");
        break;
      case "handle":
        if (!s.b3.isolated || !isolationReady(s))
          fail("先隔離雙路導引並保留 A/C。");
        else if (s.b3.hatch)
          message = "安全罩已鎖定開啟，通路保持，不再反轉已解開的鎖栓。";
        else {
          const h = puzzle("EP08").handles as Record<string, number[]>;
          for (const n of h[a.id]) s.b3.bolts ^= 1 << (n - 1);
          if (s.b3.bolts === 0) {
            s.b3.hatch = true;
            message =
              "四栓全縮回，維修井保持開啟。原始影像與救援移交資料可查。";
          } else
            message =
              "連動把手已反轉相連鎖栓。觀察孔顯示目前位置；可任意重複操作。";
        }
        break;
      case "identity":
        if (
          s.b3.hatch &&
          Number.isInteger(a.index) &&
          a.index >= 0 &&
          a.index < 3
        )
          s.b3.identity[a.index] = a.id;
        break;
      case "checkIdentity":
        if (!s.b3.hatch || !terminalOn(s))
          fail("先打開工作井，並恢復 A 與 K-CTRL。");
        else if (
          ["D07", "D08", "D09", "D10", "D11", "D12"].some(
            (id) => !s.read.includes(id),
          )
        )
          fail(
            "先查閱簽領、連續影像、救援、醫療、修訂及離線佇列原件，再核對關聯。",
          );
        else if (s.b3.identity.join("|") === "M-042|U-017-03|H-017-03") {
          s.b3.verified = true;
          message =
            "多份來源建立身分關聯。醫療原件未具名；更正仍須外部受理，不能由廣播或共用帳號定罪。";
        } else
          fail(
            "編號關聯尚未吻合；對照卡號、現場個案與醫療移交，不將 D 權限當作林沐身分。",
          );
        break;
      case "backup":
        if (!s.b3.hatch || !terminalOn(s))
          fail("檢修終端無電或尚未解封。可接回 A 與 K-CTRL。");
        else if (!s.read.includes("D06"))
          fail(
            "先查閱 R-0124-07 設定與觸發回報，確認自動復位的來源，再保存完整證據。",
          );
        else if (!s.b3.verified)
          fail("先核對原始證據鏈，避免帶出未經交叉比對的身分結論。");
        else {
          s.b3.backup = true;
          read("D14");
          message = "原始資料唯讀備份完成，更正申請另存副本。原件不覆寫。";
        }
        break;
      case "request":
        if (!s.b3.hatch || !terminalOn(s)) fail("先解封並恢復檢修終端供電。");
        else {
          s.b3.requested = true;
          message = "R-0124-07：指令已接收，尚未完成。請查詢執行回報。";
        }
        break;
      case "receipt":
        if (terminalOn(s) && s.b3.hatch && s.b3.requested) {
          s.b3.disabled = true;
          message =
            "R-0124-07：執行完成，停用設定已寫入持久儲存。復電不重新啟動。";
        } else fail("尚無可讀的完成回報；恢復終端供電並先送出停用指令。");
        break;
      case "shutdown":
        if (s.b3.hatch && terminalOn(s) && s.b3.backup && s.b3.disabled) {
          s.b3.controller = false;
          s.b3.unlocked = false;
          message = "安全停機完成，僅隔離 K-CTRL；照明和升降梯分線保留。";
        } else
          fail(
            "安全停機拒絕：先完成記錄備份及停用完成回報。實體斷電仍可復電，不會代替停用。",
          );
        break;
      case "cut":
        s.b3.controller = false;
        s.b3.unlocked = false;
        message =
          "K-CTRL 已實體隔離。未完成的資料操作可復電補做；單純斷電不取消排程。";
        break;
      case "restorePower":
        s.b3.controller = true;
        s.b3.unlocked = false;
        message = "K-CTRL 已復電。已完成備份與持久停用保留，駐停鎖需重新核對。";
        break;
      case "unlock":
        if (
          s.b3.hatch &&
          s.b3.verified &&
          s.b3.backup &&
          s.b3.disabled &&
          !s.b3.controller &&
          isolationReady(s) &&
          s.b2.key
        ) {
          s.b3.unlocked = true;
          message = "B2 的同組旁路鑰匙解除升降梯駐停鎖。可帶著證據離站。";
        } else
          fail(
            "升降梯尚未通過全部離站條件。查核備份、完成回報、K-CTRL、照明、備援與雙路隔離。",
          );
        break;
      case "exit":
        if (exitReady(s)) {
          s.b3.exited = true;
          s.floor = "end";
          message = "證據已保全。";
        } else fail("離站條件尚未齊全，已得證據保留。");
        break;
    }
  }
  return { state: s, message };
}
export function activePuzzle(s: State) {
  if (s.floor === "B1")
    return !s.b1.wired ? "EP01" : s.b1.water === "high" ? "EP02" : "EP03";
  if (s.floor === "B2")
    return !s.b2.timeline ? "EP04" : !s.b2.splice ? "EP05" : "EP06";
  return !s.b3.isolated ? "EP07" : !s.b3.hatch ? "EP08" : "EP09";
}
export function restore(raw: string): State | null {
  try {
    const s = JSON.parse(raw) as State;
    const n = fresh();
    if (
      !s ||
      s.schema !== 1 ||
      !Object.hasOwn(floorNames, s.floor) ||
      !baseValid(s.base) ||
      s.base.lastEnding !== null ||
      !b1Restore(JSON.stringify(s.b1)) ||
      !s.b2 ||
      !s.b3
    )
      return null;
    for (const k of ["timeline", "audio", "splice", "key"] as const)
      if (typeof s.b2[k] !== "boolean") return null;
    for (const k of [
      "controller",
      "isolated",
      "hatch",
      "verified",
      "backup",
      "requested",
      "disabled",
      "unlocked",
      "exited",
    ] as const)
      if (typeof s.b3[k] !== "boolean") return null;
    if (!s.b3.power || switches.some((k) => typeof s.b3.power[k] !== "boolean"))
      return null;
    if (
      !["terminal", "cctv"].every(
        (k) =>
          Number.isInteger(s.b2[k as "terminal"]) &&
          Math.abs(s.b2[k as "terminal"]) <= 5,
      ) ||
      !Array.isArray(s.b2.events) ||
      s.b2.events.some((x) => !Number.isInteger(x) || x < 0 || x > 4) ||
      new Set(s.b2.events).size !== s.b2.events.length
    )
      return null;
    if (
      !Array.isArray(s.b2.clips) ||
      s.b2.clips.some((x) => !["A", "B", "C", "D"].includes(x)) ||
      new Set(s.b2.clips).size !== s.b2.clips.length
    )
      return null;
    if (
      !Number.isInteger(s.b3.bolts) ||
      s.b3.bolts < 0 ||
      s.b3.bolts > 15 ||
      !Array.isArray(s.b3.identity) ||
      s.b3.identity.length !== 3 ||
      s.b3.identity.some((x) => typeof x !== "string")
    )
      return null;
    if (
      (s.b1.wired && !s.base.door) ||
      (s.b2.timeline && !s.b1.door) ||
      (s.b2.audio && !s.b2.timeline) ||
      (s.b2.splice && !s.b2.audio) ||
      (s.b2.key && !s.b2.splice) ||
      (s.b3.isolated && !s.b2.key) ||
      (s.b3.hatch && (!s.b3.isolated || s.b3.bolts !== 0)) ||
      (s.b3.verified &&
        (!s.b3.hatch ||
          s.b3.identity.join("|") !== "M-042|U-017-03|H-017-03")) ||
      (s.b3.backup && !s.b3.verified) ||
      (s.b3.disabled && !s.b3.requested) ||
      (s.b3.unlocked && !exitReady(s)) ||
      (s.b3.exited && (!s.b3.backup || !s.b3.disabled || !s.b3.verified))
    )
      return null;
    if (!canTravel(s, s.floor)) return null;
    if (
      s.floor !== "L0" &&
      s.floor !== "end" &&
      !(rooms[s.floor] as readonly string[]).includes(s.room)
    )
      return null;
    if (
      !Array.isArray(s.read) ||
      new Set(s.read).size !== s.read.length ||
      s.read.some((id) => !canRead(s, id))
    )
      return null;
    if (s.b3.backup && !s.read.includes("D06")) return null;
    if (
      !s.hints ||
      Object.entries(s.hints).some(
        ([id, v]) =>
          !proposal.puzzles.some((p) => p.id === id) ||
          !Number.isInteger(v) ||
          v < 0 ||
          v > 3,
      )
    )
      return null;
    return { ...n, ...s };
  } catch {
    return null;
  }
}
