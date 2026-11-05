import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const sources = ["style.css", "scenes.ts"].map((path) =>
  readFileSync(new URL(path, import.meta.url), "utf8"),
);
const colors = new Set(
  sources.flatMap((s) =>
    [...s.matchAll(/#([0-9a-f]{6})(?:[0-9a-f]{2})?\b|0x([0-9a-f]{6})\b/gi)].map(
      (m) => "#" + (m[1] || m[2]).toUpperCase(),
    ),
  ),
);
const allowed = JSON.parse(
  readFileSync(
    new URL("../Game/public/art/palette.json", import.meta.url),
    "utf8",
  ),
);
assert.ok(colors.size <= 32);
for (const color of colors) assert.ok(allowed.includes(color), color);
function luminance(color) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb.reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
}
const pairs = [
  ["#E4E1D6", "#202B32"],
  ["#E4E1D6", "#2B3640"],
  ["#E4E1D6", "#3F5B57"],
  ["#9BB6AA", "#202B32"],
  ["#9BB6AA", "#263F3E"],
  ["#14191F", "#D8C9A0"],
  ["#263F3E", "#D8C9A0"],
  ["#F2A33A", "#14191F"],
];
for (const [fg, bg] of pairs) {
  const [lo, hi] = [luminance(fg), luminance(bg)].sort((a, b) => a - b),
    ratio = (hi + 0.05) / (lo + 0.05);
  assert.ok(ratio >= 4.5, `${fg}/${bg}: ${ratio}`);
}
console.log(
  `B1 來源色板 ${colors.size} 色，均在既有 18 色內；${pairs.length} 組宣告文字配色對比 ≥4.5:1。`,
);
console.log(
  "這不是全畫面截圖像素數或所有疊色位置的自動驗收；實際閱讀仍需 TI 檢查。",
);
