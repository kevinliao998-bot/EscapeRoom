import story from "../../content/story.json" with { type: "json" };
export { story };
export type SceneId = "corridor" | "office" | "platform";
export type Place = "source" | "inventory" | "device";
export interface State {
  revision: string;
  scene: SceneId;
  loop: number;
  card: boolean;
  pry: boolean;
  box: boolean;
  power: boolean;
  broadcast: boolean;
  impression: boolean;
  links: number[];
  records: boolean;
  film: Place;
  battery: Place;
  path: string[];
  door: boolean;
  read: string[];
  hints: Record<string, number>;
  position: { x: number; y: number };
  lastEnding: "A" | "B" | null;
  seenEndings: string[];
  checkpoint: State | null;
}
export interface Action {
  type: string;
  value?: unknown;
}
export function fresh(): State {
  return {
    revision: story.revision,
    scene: "corridor",
    loop: 0,
    card: false,
    pry: false,
    box: false,
    power: false,
    broadcast: false,
    impression: false,
    links: [],
    records: false,
    film: "source",
    battery: "source",
    path: [],
    door: false,
    read: [],
    hints: {},
    position: { x: 104, y: 151 },
    lastEnding: null,
    seenEndings: [],
    checkpoint: null,
  };
}
export const copy = (s: State): State => structuredClone(s);
export function act(
  input: State,
  a: Action,
): { state: State; message: string } {
  const s = copy(input);
  let message = "";
  const say = (m: string) => (message = m);
  const read = (id: string) => {
    if (!s.read.includes(id)) s.read.push(id);
  };
  const at = (where: SceneId) => s.scene === where && !s.lastEnding;
  switch (a.type) {
    case "read":
      if (typeof a.value === "string" && a.value in story.documents) {
        const gates: Record<string, boolean> = {
          broadcast: s.broadcast,
          report: s.broadcast,
          log: s.broadcast,
          roster: s.broadcast,
          impression: s.impression,
          route: s.records,
          routeSolved: s.door,
        };
        if (gates[a.value] !== false) read(a.value);
      }
      break;
    case "card":
      if (at("corridor")) {
        s.card = true;
        say("取得門禁卡。圖示的位置沒有改變。");
      }
      break;
    case "pry":
      if (at("corridor")) {
        s.pry = true;
        say("取得撬片。邊緣薄而結實。");
      }
      break;
    case "enter":
      if (at("corridor")) {
        if (s.card) {
          s.scene = "office";
          s.position = { x: 104, y: 199 };
          say("門禁燈亮起。這一次，門後不再是同一條走廊。");
        } else {
          const changed = s.loop < 3;
          s.loop = Math.min(3, s.loop + 1);
          s.position = { x: 104, y: 151 };
          say(
            changed
              ? "你又回到走廊。門禁燈未啟動；有一樣細節變了。"
              : "這次細節不再變化。門禁燈未啟動；不變的標籤仍在原處。",
          );
        }
      }
      break;
    case "back":
      if (at("office")) {
        s.scene = "corridor";
        s.position = { x: 392, y: 151 };
      } else if (at("platform")) {
        s.scene = "office";
        s.position = { x: 392, y: 199 };
      }
      break;
    case "openBox":
      if (at("office")) {
        if (s.pry) s.box = true;
        else say("邊緣需要一片薄而結實的工具；可以返回走廊。");
      }
      break;
    case "power":
      if (at("office") && s.box) {
        s.power = true;
        say("備用電源已接通。控制台顯示三段波形。");
      }
      break;
    case "wave":
      if (at("office") && s.power) {
        if (JSON.stringify(a.value) === JSON.stringify(story.waveOrder)) {
          s.broadcast = true;
          read("broadcast");
          say("校準完成。相同的三聲標記，出現了兩次。");
        } else say("波形次序尚未吻合。電源與線索均保留。");
      }
      break;
    case "impression":
      if (at("office") && s.broadcast) {
        s.impression = true;
        read("impression");
      }
      break;
    case "link":
      if (
        at("office") &&
        s.broadcast &&
        [0, 1].includes(a.value as number) &&
        !s.links.includes(a.value as number)
      )
        s.links.push(a.value as number);
      break;
    case "conclude":
      if (at("office") && s.broadcast) {
        if (
          s.impression &&
          s.links.length === 2 &&
          a.value === story.correctConclusion
        ) {
          s.records = true;
          read("log");
          read("report");
          read("roster");
          say("比對完成。維修簿夾層鬆開，控制台電池倉彈出。");
        } else
          say(
            s.impression
              ? "這些證據不能支持這個結論；已確認的連線保留。"
              : "還需要側光檢查名冊的刮除處。",
          );
      }
      break;
    case "film":
    case "battery":
      if (at("office") && s.records && s[a.type] === "source") {
        s[a.type] = "inventory";
        say(`取得${story.items[a.type]}。`);
      }
      break;
    case "platform":
      if (at("office")) {
        if (s.records) {
          s.scene = "platform";
          s.position = { x: 104, y: 199 };
          read("route");
        } else say("月台門尚未解鎖；先完成站務紀錄比對。");
      }
      break;
    case "mountFilm":
      if (at("platform") && s.film === "inventory") s.film = "device";
      break;
    case "mountBattery":
      if (at("platform") && s.battery === "inventory") s.battery = "device";
      break;
    case "takeFilm":
      if (at("platform") && s.film === "device") {
        s.film = "inventory";
        s.path = [];
      }
      break;
    case "takeBattery":
      if (at("platform") && s.battery === "device") {
        s.battery = "inventory";
        s.path = [];
      }
      break;
    case "clearPath":
      s.path = [];
      break;
    case "node":
      if (at("platform")) {
        if (s.film !== "device" || s.battery !== "device")
          say("先把電池裝進燈箱，路線片放入圖面定位槽。");
        else if (a.value === story.route.answer[s.path.length]) {
          s.path.push(a.value as string);
          if (s.path.length === story.route.answer.length) {
            s.door = true;
            read("routeSolved");
            s.checkpoint = { ...copy(s), checkpoint: null };
            say("琥珀燈連成黃線。維修門已開啟；選擇前進度已保存。");
          }
        } else say("這個節點未供電或不與前一點相鄰。正確前綴保留。");
      }
      break;
    case "hint":
      if (typeof a.value === "string" && a.value in story.hints)
        s.hints[a.value] = Math.min(3, (s.hints[a.value] || 0) + 1);
      break;
    case "end":
      if (at("platform") && s.door && (a.value === "A" || a.value === "B")) {
        s.lastEnding = a.value;
        if (!s.seenEndings.includes(a.value)) s.seenEndings.push(a.value);
      }
      break;
    case "reselect":
      if (s.checkpoint) {
        const n = copy(s.checkpoint);
        n.checkpoint = copy(s.checkpoint);
        n.seenEndings = [...s.seenEndings];
        n.lastEnding = null;
        return { state: n, message: "回到維修門前。你可以重新選擇。" };
      }
      break;
  }
  return { state: s, message };
}
export function valid(s: unknown, depth = 0): s is State {
  if (!s || typeof s !== "object" || depth > 1) return false;
  const v = s as State;
  if (
    v.revision !== story.revision ||
    !["corridor", "office", "platform"].includes(v.scene) ||
    !Number.isInteger(v.loop) ||
    v.loop < 0 ||
    v.loop > 3
  )
    return false;
  for (const k of [
    "card",
    "pry",
    "box",
    "power",
    "broadcast",
    "impression",
    "records",
    "door",
  ] as const)
    if (typeof v[k] !== "boolean") return false;
  if (
    !Array.isArray(v.links) ||
    new Set(v.links).size !== v.links.length ||
    v.links.some((n) => ![0, 1].includes(n))
  )
    return false;
  if (
    (v.box && !v.pry) ||
    (v.power && !v.box) ||
    (v.broadcast && !v.power) ||
    (v.impression && !v.broadcast) ||
    (v.links.length && !v.broadcast) ||
    (v.records && (!v.impression || v.links.length !== 2))
  )
    return false;
  if (
    !["source", "inventory", "device"].includes(v.film) ||
    !["source", "inventory", "device"].includes(v.battery) ||
    (!v.records && (v.film !== "source" || v.battery !== "source"))
  )
    return false;
  if (
    !Array.isArray(v.path) ||
    v.path.length > 4 ||
    v.path.some((p, i) => p !== story.route.answer[i]) ||
    (v.path.length > 0 && (v.film !== "device" || v.battery !== "device"))
  )
    return false;
  if (v.door && (!v.records || v.film === "source" || v.battery === "source"))
    return false;
  if (
    !Array.isArray(v.read) ||
    v.read.some((k) => !(k in story.documents)) ||
    !v.hints ||
    typeof v.hints !== "object" ||
    Object.entries(v.hints).some(
      ([k, n]) => !(k in story.hints) || !Number.isInteger(n) || n < 0 || n > 3,
    )
  )
    return false;
  if (
    !v.position ||
    !Number.isFinite(v.position.x) ||
    !Number.isFinite(v.position.y) ||
    v.position.x < 48 ||
    v.position.x > 464 ||
    v.position.y < 7 ||
    v.position.y > 263
  )
    return false;
  if (
    (v.scene !== "corridor" && !v.card) ||
    (v.scene === "platform" && !v.records)
  )
    return false;
  if (
    ![null, "A", "B"].includes(v.lastEnding) ||
    !Array.isArray(v.seenEndings) ||
    v.seenEndings.some((e) => !["A", "B"].includes(e)) ||
    (v.lastEnding && !v.door)
  )
    return false;
  if (
    v.checkpoint !== null &&
    (!valid(v.checkpoint, depth + 1) ||
      !v.checkpoint.door ||
      v.checkpoint.checkpoint !== null ||
      v.checkpoint.lastEnding !== null)
  )
    return false;
  // 存檔根層的開門進度必須保有有效的選擇前快照。
  if (depth === 0 && v.door && !v.checkpoint) return false;
  return true;
}
export function serialize(s: State) {
  return JSON.stringify(s);
}
export function restore(raw: string): State | null {
  try {
    const v = JSON.parse(raw);
    return valid(v) ? v : null;
  } catch {
    return null;
  }
}
export function modelKey(s: State) {
  return JSON.stringify([
    s.scene,
    s.loop,
    s.card,
    s.pry,
    s.box,
    s.power,
    s.broadcast,
    s.impression,
    [...s.links].sort(),
    s.records,
    s.film,
    s.battery,
    s.path,
    s.door,
  ]);
}
export const actions: Action[] = [
  "card",
  "pry",
  "enter",
  "back",
  "openBox",
  "power",
  "impression",
  "film",
  "battery",
  "platform",
  "mountBattery",
  "mountFilm",
  "takeBattery",
  "takeFilm",
  "clearPath",
]
  .map<Action>((type) => ({ type }))
  .concat([
    { type: "wave", value: story.waveOrder },
    { type: "link", value: 0 },
    { type: "link", value: 1 },
    { type: "conclude", value: 1 },
    ...story.route.answer.map((value) => ({ type: "node", value })),
  ]);
