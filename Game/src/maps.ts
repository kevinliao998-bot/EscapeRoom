import type { SceneId } from "./core.ts";
export interface Spot {
  id: string;
  label: string;
  x: number;
  y: number;
  art?: string;
  w?: number;
  h?: number;
}
export const maps: Record<
  SceneId,
  {
    name: string;
    subtitle: string;
    spawn: { x: number; y: number };
    spots: Spot[];
  }
> = {
  corridor: {
    name: "迴圈走廊",
    subtitle: "有些細節變了。也有東西一直沒變。",
    spawn: { x: 104, y: 151 },
    spots: [
      { id: "clock", label: "時鐘", x: 232, y: 55 },
      { id: "sign", label: "站名牌", x: 328, y: 55 },
      { id: "water", label: "地面水漬", x: 344, y: 159 },
      {
        id: "dispenser",
        label: "飲水機內側標籤",
        x: 136,
        y: 111,
        art: "dispenser",
        w: 32,
        h: 48,
      },
      { id: "cardSlot", label: "牆腳檢修槽", x: 184, y: 111 },
      {
        id: "cart",
        label: "清潔推車",
        x: 88,
        y: 207,
        art: "cart",
        w: 32,
        h: 32,
      },
      { id: "endDoor", label: "盡頭門", x: 424, y: 143 },
    ],
  },
  office: {
    name: "站務室",
    subtitle: "記錄能互相印證，也能互相否定。",
    spawn: { x: 104, y: 199 },
    spots: [
      { id: "back", label: "返回走廊", x: 88, y: 215 },
      {
        id: "console",
        label: "廣播控制台／電池倉",
        x: 152,
        y: 111,
        art: "console",
        w: 48,
        h: 48,
      },
      { id: "sticker", label: "牆上校準貼紙", x: 216, y: 95 },
      {
        id: "cabinet",
        label: "紀錄櫃／維修簿夾層",
        x: 280,
        y: 111,
        art: "cabinet",
        w: 32,
        h: 48,
      },
      {
        id: "powerBox",
        label: "檢修盒",
        x: 360,
        y: 111,
        art: "panel",
        w: 32,
        h: 32,
      },
      { id: "platformDoor", label: "往月台", x: 424, y: 215 },
    ],
  },
  platform: {
    name: "月台",
    subtitle: "別看站名。跟著仍然供電的燈。",
    spawn: { x: 104, y: 199 },
    spots: [
      { id: "back", label: "返回站務室", x: 88, y: 215 },
      {
        id: "lightbox",
        label: "指示燈箱",
        x: 152,
        y: 127,
        art: "lightbox",
        w: 32,
        h: 48,
      },
      {
        id: "routeMap",
        label: "路線圖定位槽",
        x: 280,
        y: 127,
        art: "map",
        w: 48,
        h: 48,
      },
      { id: "maintenanceDoor", label: "維修門", x: 424, y: 143 },
    ],
  },
};
export const tile = (x: number, y: number) => ({
  x: Math.floor(x / 16),
  y: Math.floor((y - 7) / 16),
});
export const center = (p: { x: number; y: number }) => ({
  x: p.x * 16 + 8,
  y: p.y * 16 + 15,
});
export function walkable(scene: SceneId, x: number, y: number) {
  if (x < 4 || x > 27 || y < 6 || y > 13) return false;
  return !maps[scene].spots.some(
    (s) => s.art && tile(s.x, s.y).x === x && tile(s.x, s.y).y === y,
  );
}
export function approach(s: Spot) {
  return s.id === "clock" || s.id === "sign" || s.id === "sticker"
    ? { x: tile(s.x, s.y).x, y: 6 }
    : tile(s.x, s.y);
}
export function near(scene: SceneId, p: { x: number; y: number }, s: Spot) {
  const a = tile(p.x, p.y),
    b = approach(s);
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
}
export function pathfind(
  scene: SceneId,
  from: { x: number; y: number },
  to: { x: number; y: number },
  adjacent = false,
) {
  const start = tile(from.x, from.y),
    end = tile(to.x, to.y);
  const key = (p: { x: number; y: number }) => p.x + "," + p.y;
  const q = [start],
    prev = new Map<string, { x: number; y: number } | null>([
      [key(start), null],
    ]);
  let found: typeof start | null = null;
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    if (Math.abs(p.x - end.x) + Math.abs(p.y - end.y) <= (adjacent ? 1 : 0)) {
      found = p;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (walkable(scene, n.x, n.y) && !prev.has(key(n))) {
        prev.set(key(n), p);
        q.push(n);
      }
    }
  }
  if (!found) return [];
  const result: (typeof from)[] = [];
  for (
    let p: typeof start | null = found;
    p && key(p) !== key(start);
    p = prev.get(key(p)) || null
  )
    result.unshift(center(p));
  return result;
}
