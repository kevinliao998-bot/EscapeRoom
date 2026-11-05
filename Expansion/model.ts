import proposal from "./proposal.json" with { type: "json" };
export { proposal };
export const circuits = ["照明", "通訊", "排風", "泵浦", "門鎖"] as const;
export type Circuit = (typeof circuits)[number];
export const rooms = ["distribution", "pump", "vestibule"] as const;
export type Room = (typeof rooms)[number];
export const roomNames: Record<Room, string> = {
  distribution: "配電室",
  pump: "泵房",
  vestibule: "隔離門前廳",
};
export const loads = { light: 1, comm: 1, fan: 1, pump: 3, lock: 2 } as const;
export type Load = keyof typeof loads;
export const loadNames: Record<Load, string> = {
  light: "應急照明",
  comm: "通訊",
  fan: "排風",
  pump: "泵浦",
  lock: "門鎖",
};
export type Valve = "A" | "B" | "C" | "D";
export const valves: Valve[] = ["A", "B", "C", "D"];
const sourceDocument = (id: string) =>
  proposal.documents.find((d) => d.id === id)!;
export const documents = {
  intake: {
    title: sourceDocument("D01").title,
    text: sourceDocument("D01").text,
  },
  gateHistory: {
    title: sourceDocument("D02").title,
    text: sourceDocument("D02").text,
  },
  work: {
    title: "回路工單 · 牆面副本",
    text: "照明在通訊左側，排風在通訊右側。左右不要求相鄰。五條回路各使用一次。",
  },
  rack: {
    title: "線束固定架 · 相鄰標記",
    text: "門鎖線束緊接在泵浦線束右側。固定架不允許兩者中間再插入其他回路。",
  },
  plugs: {
    title: "接頭與維修圖",
    text: "通訊與泵浦之間恰好隔一個插槽。排風插頭的限位片無法接入第五槽。",
  },
  capacity: {
    title: "供電銘牌 · 上限 4 格",
    text: "應急照明 1 格／通訊 1 格／排風 1 格／泵浦 3 格／門鎖 2 格。作業時保留應急照明。水位高於安全線時，門鎖保護禁止接通。",
  },
  oldPipe: {
    title: "舊管線圖",
    text: "A：積水槽至泵浦入口。B：泵浦出口至排水井。D：泵浦出口至封存室，正常排水時保持關閉。這張圖沒有記載新增支路；檢修窗可追蹤實際流向。",
  },
  trace: {
    title: "檢修窗 · 新增的 C 支路",
    text: "C 從泵浦出口繞回入口。新增接頭與固定扣的批次不同於舊管；泵浦運轉時，這條開啟的支路會讓水回流。這只能證明管線被改接，不能推定改接者或動機。",
  },
  check: {
    title: "止回閥維護牌",
    text: "停止泵浦後，止回閥自動閉合，避免積水倒流。確認水位仍在安全線以下，再將供電轉給門鎖。已完成的排水不需要反覆重做。",
  },
  sensor: {
    title: "隔離門 · 水位保護",
    text: "水位高於安全線，禁止接通門鎖。水位安全後，先停泵確認止回閥閉合，再保留照明、接通門鎖。超載或保護拒絕不會消耗物品。",
  },
  lin: {
    title: "隔離門內側 · 林沐署名工單",
    text: sourceDocument("D03").text,
  },
} as const;
export type Doc = keyof typeof documents;
export type Puzzle = "EP01" | "EP02" | "EP03";
export const hints = Object.fromEntries(
  proposal.puzzles
    .filter((p) => ["EP01", "EP02", "EP03"].includes(p.id))
    .map((p) => [p.id, p.hints]),
) as Record<Puzzle, string[]>;
export interface State {
  schema: 1;
  room: Room;
  slots: (Circuit | null)[];
  wired: boolean;
  power: Record<Load, boolean>;
  valves: Record<Valve, boolean>;
  water: "high" | "safe";
  checkClosed: boolean;
  traceSeen: boolean;
  door: boolean;
  read: Doc[];
  hints: Record<Puzzle, number>;
}
export function fresh(): State {
  return {
    schema: 1,
    room: "distribution",
    slots: [null, null, null, null, null],
    wired: false,
    power: { light: false, comm: false, fan: false, pump: false, lock: false },
    valves: { A: true, B: true, C: true, D: true },
    water: "high",
    checkClosed: true,
    traceSeen: false,
    door: false,
    read: [],
    hints: { EP01: 0, EP02: 0, EP03: 0 },
  };
}
export function consumption(s: State) {
  return (Object.keys(loads) as Load[]).reduce(
    (sum, id) => sum + (s.power[id] ? loads[id] : 0),
    0,
  );
}
export function circuitChecks(slots: (Circuit | null)[]) {
  const i = (name: Circuit) => slots.indexOf(name);
  const complete =
    slots.length === 5 &&
    circuits.every((c) => slots.includes(c)) &&
    new Set(slots).size === 5;
  return [
    complete && i("照明") < i("通訊") && i("通訊") < i("排風"),
    complete && i("門鎖") === i("泵浦") + 1,
    complete && Math.abs(i("通訊") - i("泵浦")) === 2,
    complete && i("排風") !== 4,
    complete,
  ];
}
export function waterRoute(s: State) {
  return s.valves.A && s.valves.B && !s.valves.C && !s.valves.D;
}
export type Action =
  | { type: "move"; room: Room }
  | { type: "place"; circuit: Circuit; slot: number }
  | { type: "wire" }
  | { type: "power"; load: Load }
  | { type: "valve"; valve: Valve }
  | { type: "trace" }
  | { type: "drain" }
  | { type: "door" }
  | { type: "read"; doc: Doc }
  | { type: "hint"; puzzle: Puzzle };
export function act(
  input: State,
  action: Action,
): { state: State; message: string } {
  const s = structuredClone(input);
  let message = "";
  const read = (id: Doc) => {
    if (!s.read.includes(id)) s.read.push(id);
  };
  switch (action.type) {
    case "move":
      s.room = action.room;
      break;
    case "read":
      if (
        (action.doc === "trace" && !s.traceSeen) ||
        (action.doc === "lin" && !s.door)
      )
        break;
      read(action.doc);
      break;
    case "place":
      if (
        s.wired ||
        !circuits.includes(action.circuit) ||
        !Number.isInteger(action.slot) ||
        action.slot < 0 ||
        action.slot > 4
      )
        break;
      s.slots = s.slots.map((c) => (c === action.circuit ? null : c));
      s.slots[action.slot] = action.circuit;
      message = `已將${action.circuit}接到第 ${action.slot + 1} 槽。尚未送電。`;
      break;
    case "wire":
      if (s.wired) {
        message = "五條回路已確認，原接線保留。";
        break;
      }
      if (!circuitChecks(s.slots).every(Boolean)) {
        message =
          "回路尚未通過校驗。接線草稿與已讀工單保留；核對固定架、接頭與維修圖。";
        break;
      }
      s.wired = true;
      s.power.light = s.power.comm = s.power.fan = true;
      message =
        "回路辨認完成。照明、通訊與排風恢復，負載 3／4 格。泵房與門鎖仍待處理。";
      break;
    case "power": {
      if (!s.wired) {
        message = "先辨認五條回路，才能操作供電分路。";
        break;
      }
      const id = action.load;
      if (!s.power[id]) {
        if (id === "lock" && s.water !== "safe") {
          message =
            "水位感測器保護：高於安全線，門鎖拒絕接通。已完成的回路保留。";
          break;
        }
        if ((id === "pump" || id === "lock") && !s.power.light) {
          message = "作業保護：先保留應急照明，再啟動設備。";
          break;
        }
        if (id === "lock" && (!s.checkClosed || s.power.pump)) {
          message = "先停止泵浦，確認止回閥閉合後，再轉供門鎖。";
          break;
        }
        if (consumption(s) + loads[id] > 4) {
          message = `超載保護：目前 ${consumption(s)} 格，加上${loadNames[id]} ${loads[id]} 格將超過上限 4 格。開關未接通，其他進度保留。`;
          break;
        }
      } else if (id === "light" && (s.power.pump || s.power.lock)) {
        message = "作業期間必須保留應急照明；先停止泵浦或門鎖供電。";
        break;
      }
      s.power[id] = !s.power[id];
      s.checkClosed = !s.power.pump;
      message = `${loadNames[id]}已${s.power[id] ? "接通" : "關閉"}。總負載 ${consumption(s)}／4 格。${id === "pump" && !s.power.pump ? "止回閥已閉合，排水成果保留。" : ""}`;
      break;
    }
    case "valve":
      s.valves[action.valve] = !s.valves[action.valve];
      message = `${action.valve} 閥已${s.valves[action.valve] ? "開啟" : "關閉"}。`;
      break;
    case "trace":
      if (!s.power.light) {
        message = "檢修窗內太暗。先恢復應急照明。";
        break;
      }
      if (s.power.fan) {
        message = "排風機仍在運轉，擋住檢修窗的觀察角度。先到配電室停止排風。";
        break;
      }
      s.traceSeen = true;
      read("trace");
      message =
        "沿新增接頭追到 C 支路：出口繞回入口。流向與固定扣記錄已寫入筆記。";
      break;
    case "drain":
      if (!s.power.pump || !s.power.light) {
        message = "泵浦尚未取得作業供電。檢查銘牌與四格負載上限。";
        break;
      }
      if (!s.valves.A || !s.valves.B) {
        message =
          "積水槽到排水井之間有閥門關閉，尚未形成完整通路。水位未降，其他進度保留。";
        break;
      }
      if (s.valves.D) {
        message = "封存室支路仍開著，排水保護拒絕啟動。先核對 D 閥與舊圖。";
        break;
      }
      if (s.valves.C) {
        message = "泵浦有運轉，水位卻不下降。有水回到入口；比對舊圖與檢修窗。";
        break;
      }
      s.water = "safe";
      message =
        "水位降至安全線。接下來要停泵、確認止回閥，再把電力轉給隔離門。";
      break;
    case "door":
      if (s.door) {
        read("lin");
        message = "隔離門已放行，署名工單仍留在門內側。";
        break;
      }
      if (s.water !== "safe") {
        message = "觀察窗外的積水仍高於安全線，門無法放行。";
        break;
      }
      if (!s.power.lock || !s.power.light || s.power.pump || !s.checkClosed) {
        message =
          "門鎖尚未完成安全轉供：確認停泵、止回閥及應急照明，再接通門鎖。";
        break;
      }
      s.door = true;
      read("lin");
      message = "隔離門鬆開。門內側有林沐署名的撤離工單。";
      break;
    case "hint":
      s.hints[action.puzzle] = Math.min(3, s.hints[action.puzzle] + 1);
      break;
  }
  return { state: s, message };
}
export function goal(s: State) {
  if (s.door) return "地下一層完成。林沐曾幫助他人撤離，後續去向仍未確認。";
  if (!s.wired)
    return "隔離門被積水封住。先用工單、固定架與接頭，辨認五條回路。";
  if (s.water === "high")
    return "泵浦為何排不掉水？驗證管線流向，找出正確的排水通路。";
  return "水退了。讓排水成果留下，再把有限電力轉給隔離門。";
}
export function restore(raw: string): State | null {
  try {
    const s = JSON.parse(raw) as State;
    if (
      !s ||
      s.schema !== 1 ||
      !rooms.includes(s.room) ||
      !Array.isArray(s.slots) ||
      s.slots.length !== 5
    )
      return null;
    if (
      s.slots.some((c) => c !== null && !circuits.includes(c)) ||
      new Set(s.slots.filter(Boolean)).size !== s.slots.filter(Boolean).length
    )
      return null;
    if (
      ["wired", "checkClosed", "traceSeen", "door"].some(
        (k) => typeof s[k as keyof State] !== "boolean",
      )
    )
      return null;
    if (
      !s.power ||
      !s.valves ||
      (Object.keys(loads) as Load[]).some(
        (id) => typeof s.power[id] !== "boolean",
      ) ||
      valves.some((id) => typeof s.valves[id] !== "boolean")
    )
      return null;
    if (
      (s.water !== "high" && s.water !== "safe") ||
      consumption(s) > 4 ||
      s.checkClosed === s.power.pump
    )
      return null;
    if (
      s.wired
        ? !circuitChecks(s.slots).every(Boolean)
        : Object.values(s.power).some(Boolean) ||
          s.water === "safe" ||
          s.traceSeen ||
          s.door
    )
      return null;
    if (
      ((s.power.pump || s.power.lock) && !s.power.light) ||
      (s.power.lock && (s.water !== "safe" || s.power.pump))
    )
      return null;
    if (s.door && s.water !== "safe") return null;
    if (
      !Array.isArray(s.read) ||
      new Set(s.read).size !== s.read.length ||
      s.read.some(
        (d) =>
          !Object.hasOwn(documents, d) ||
          (d === "trace" && !s.traceSeen) ||
          (d === "lin" && !s.door),
      )
    )
      return null;
    if (
      !s.hints ||
      (["EP01", "EP02", "EP03"] as Puzzle[]).some(
        (p) =>
          !Number.isInteger(s.hints[p]) || s.hints[p] < 0 || s.hints[p] > 3,
      )
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
