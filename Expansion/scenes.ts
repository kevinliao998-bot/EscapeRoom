import Phaser from "phaser";
import { type State, type Room, roomNames } from "./model.ts";

// 原創程式向量繪圖，未讀取參考截圖或任何第三方圖像。
const box = (x: number, y: number, w: number, h: number, fill = "#2B3640") =>
  `<rect x="${x + 7}" y="${y + 9}" width="${w}" height="${h}" fill="#14191F" opacity=".65"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#5C6C7A" stroke-width="2"/><path d="M${x + 5} ${y + 5}H${x + w - 5}" stroke="#8C9BA3"/>`;
const text = (
  x: number,
  y: number,
  value: string,
  size = 18,
  color = "#E4E1D6",
) =>
  `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" fill="${color}">${value}</text>`;
const pipe = (d: string, color = "#5C6C7A") =>
  `<path d="${d}" stroke="#14191F" stroke-width="16" fill="none"/><path d="${d}" stroke="${color}" stroke-width="11" fill="none"/><path d="${d}" stroke="#8C9BA3" stroke-width="2" fill="none"/>`;
function shell(room: Room) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#14191F"/><path d="M60 60H900V375H60Z" fill="#263F3E"/><path d="M0 0L60 60V375L0 540Z M960 0L900 60V375L960 540Z" fill="#202B32"/><path d="M60 375H900L960 540H0Z" fill="#2B3640"/><path d="M0 0H960L900 60H60Z" fill="#202B32"/>${Array.from({ length: 15 }, (_, i) => `<path d="M${60 + i * 60} 62V372" stroke="#3F5B57" opacity=".55"/>`).join("")}${[125, 190, 255, 320].map((y) => `<path d="M60 ${y}H900" stroke="#3F5B57" opacity=".6"/>`).join("")}<path d="M60 373H900" stroke="#6E8F86" stroke-width="4"/>${[0, 160, 320, 480, 640, 800, 960].map((x) => `<path d="M480 350L${x} 540" stroke="#45545F" opacity=".5"/>`).join("")}${[410, 465, 530].map((y) => `<path d="M0 ${y}H960" stroke="#45545F" opacity=".5"/>`).join("")}${[170, 640].map((x) => `<rect x="${x}" y="48" width="150" height="12" fill="#14191F"/><rect x="${x + 4}" y="51" width="142" height="4" fill="#9BB6AA"/>`).join("")}<path d="M58 86H904" stroke="#5C6C7A" stroke-width="9"/><path d="M62 83H898" stroke="#8C9BA3" stroke-width="2"/>${text(72, 106, roomNames[room], 13, "#9BB6AA")}`;
}
export function artwork(room: Room) {
  let svg = shell(room);
  if (room === "distribution") {
    svg +=
      box(130, 140, 126, 174, "#A8996F") +
      `<rect x="143" y="153" width="100" height="147" fill="#D8C9A0"/>${text(153, 183, "回路工單", 16, "#14191F")}<path d="M154 200H230 M154 212H226 M154 224H230 M154 248H223 M154 260H229" stroke="#756C52" stroke-width="3"/>`;
    svg +=
      box(320, 158, 320, 238) +
      text(345, 185, "迴路識別 / SERVICE 05", 14, "#9BB6AA");
    for (let i = 0; i < 5; i++)
      svg +=
        `<path d="M${359 + i * 57} 86V207" fill="none" stroke="#14191F" stroke-width="13"/><path d="M${359 + i * 57} 86V207" fill="none" stroke="${i % 2 ? "#6E8F86" : "#8C9BA3"}" stroke-width="5"/>` +
        box(342 + i * 57, 216, 36, 104, "#202B32") +
        text(353 + i * 57, 344, String(i + 1), 16, "#9BB6AA");
    svg +=
      box(721, 157, 132, 227) +
      text(738, 184, "分路供電", 16) +
      `<rect x="739" y="199" width="94" height="32" fill="#14191F"/>${text(752, 222, "MAX 4", 16, "#9BB6AA")}`;
    for (let i = 0; i < 5; i++)
      svg += `<rect x="740" y="${247 + i * 23}" width="50" height="9" fill="#45545F"/><rect x="805" y="${243 + i * 23}" width="18" height="17" fill="#6E8F86"/>`;
    svg +=
      box(329, 412, 310, 45, "#45545F") +
      `<path d="M340 458V511 M623 458V511" stroke="#202B32" stroke-width="10"/>` +
      text(358, 440, "線束固定架 · 接頭與維修圖", 16);
  } else if (room === "pump") {
    svg +=
      box(115, 136, 140, 124, "#A8996F") +
      text(133, 161, "舊管線圖", 16, "#14191F") +
      `<path d="M137 217H173V183H229 M173 217V241H227" stroke="#3F5B57" stroke-width="4" fill="none"/>`;
    svg +=
      pipe("M153 378V322H383") +
      pipe("M499 290H612V190H790") +
      pipe("M610 291H754V384") +
      pipe("M611 292V343H350V292H390", "#6E8F86");
    svg +=
      `<ellipse cx="443" cy="377" rx="100" ry="24" fill="#14191F"/>` +
      box(374, 275, 139, 92, "#45545F") +
      `<circle cx="443" cy="312" r="40" fill="#202B32" stroke="#8C9BA3" stroke-width="3"/><circle cx="443" cy="312" r="20" fill="#3F5B57" stroke="#6E8F86" stroke-width="2"/>${text(411, 318, "P-03", 18)}`;
    svg +=
      box(667, 111, 180, 125, "#202B32") +
      `<circle cx="757" cy="171" r="43" fill="#14191F" stroke="#5C6C7A" stroke-width="3"/><path d="M727 147L784 192 M729 196L786 148 M756 131V210" stroke="#45545F" stroke-width="15"/>${text(682, 254, "檢修窗 / 排風葉片", 14, "#9BB6AA")}`;
    for (const [x, y, letter] of [
      [300, 323, "A"],
      [610, 266, "B"],
      [350, 343, "C"],
      [753, 344, "D"],
    ] as const)
      svg += `<circle cx="${x}" cy="${y}" r="18" fill="#263F3E" stroke="#9BB6AA" stroke-width="3"/><path d="M${x - 12} ${y}H${x + 12} M${x} ${y - 12}V${y + 12}" stroke="#8C9BA3" stroke-width="3"/>${text(x - 5, y - 27, letter, 16)}`;
    svg +=
      box(92, 380, 199, 80, "#202B32") +
      `<rect x="103" y="391" width="176" height="44" fill="#2B3640"/>${text(123, 417, "積水槽", 16, "#9BB6AA")}` +
      box(775, 297, 90, 95, "#A8996F") +
      text(785, 324, "止回閥", 16, "#14191F") +
      text(785, 347, "維護牌", 16, "#14191F");
  } else {
    svg +=
      box(300, 108, 360, 323, "#14191F") +
      box(311, 120, 166, 300, "#45545F") +
      box(483, 120, 166, 300, "#45545F");
    svg += `<path d="M333 145V394 M453 145V394 M506 145V394 M626 145V394" stroke="#5C6C7A" stroke-width="3"/><path d="M458 260V302 M503 260V302" stroke="#9BB6AA" stroke-width="7"/><rect x="370" y="76" width="220" height="25" fill="#202B32"/>${text(404, 94, "往封存層 / B2", 15, "#9BB6AA")}`;
    svg +=
      box(144, 171, 112, 142, "#A8996F") +
      text(157, 198, "水位保護", 16, "#14191F") +
      `<path d="M160 220H240 M160 233H234 M160 246H239 M160 274H236" stroke="#756C52" stroke-width="3"/>`;
    svg +=
      box(723, 153, 88, 232, "#202B32") +
      `<rect x="743" y="184" width="47" height="150" fill="#14191F"/><path d="M735 273H798" stroke="#D8C9A0" stroke-width="2"/>${text(714, 410, "水位感測器", 14, "#9BB6AA")}`;
    svg += `<path d="M290 441H673" stroke="#D8C9A0" stroke-width="4"/><path d="M290 447H673" stroke="#756C52" stroke-width="2"/>`;
  }
  return svg + "</svg>";
}
export class MaintenanceScene extends Phaser.Scene {
  getState: () => State;
  constructor(getState: () => State) {
    super("b1");
    this.getState = getState;
  }
  preload() {
    for (const room of ["distribution", "pump", "vestibule"] as Room[]) {
      // Phaser 3 的 SVG data loader 以 atob 取得文字。數字實體避免中文經 Latin-1 損壞。
      const asciiSvg = Array.from(artwork(room), (c) =>
        c.codePointAt(0)! > 127 ? `&#${c.codePointAt(0)};` : c,
      ).join("");
      const base64 = btoa(asciiSvg);
      this.load.svg(room, "data:image/svg+xml;base64," + base64);
    }
  }
  create() {
    this.redraw();
  }
  redraw() {
    if (!this.sys.isActive()) return;
    const s = this.getState();
    this.children.removeAll(true);
    this.add.image(0, 0, s.room).setOrigin(0);
    const g = this.add.graphics();
    if (!s.power.light) g.fillStyle(0x14191f, 0.28).fillRect(0, 0, 960, 540);
    if (s.room === "distribution") {
      for (let i = 0; i < 5; i++)
        g.fillStyle(s.wired ? 0x9bb6aa : 0x45545f).fillRect(
          351 + i * 57,
          232,
          18,
          7,
        );
    } else if (s.room === "pump") {
      g.fillStyle(0x6e8f86, 0.32).fillRect(
        104,
        s.water === "high" ? 394 : 424,
        174,
        s.water === "high" ? 40 : 10,
      );
      if (s.traceSeen) g.lineStyle(3, 0xd8c9a0).strokeCircle(350, 343, 24);
      g.fillStyle(s.power.pump ? 0xf2a33a : 0x5c6c7a).fillCircle(443, 312, 5);
    } else {
      const high = s.water === "high";
      g.fillStyle(0x6e8f86).fillRect(
        747,
        high ? 210 : 296,
        39,
        high ? 117 : 31,
      );
      if (high) g.fillStyle(0x6e8f86, 0.16).fillRect(70, 431, 820, 70);
      if (s.door) {
        g.fillStyle(0x14191f).fillRect(411, 125, 138, 294);
        g.fillStyle(0xf2a33a).fillRect(417, 414, 127, 4);
        g.fillStyle(0xd8c9a0).fillRect(449, 226, 62, 93);
        g.lineStyle(2, 0x756c52)
          .lineBetween(458, 249, 500, 249)
          .lineBetween(458, 264, 496, 264)
          .lineBetween(458, 297, 498, 297);
      }
      g.fillStyle(s.power.lock ? 0xf2a33a : 0x5c6c7a).fillRect(672, 250, 7, 15);
    }
  }
}
