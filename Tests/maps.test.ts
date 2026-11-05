import { test } from "node:test";
import assert from "node:assert/strict";
import {
  maps,
  walkable,
  tile,
  pathfind,
  approach,
  center,
} from "../Game/src/maps.ts";
for (const [scene, m] of Object.entries(maps))
  test(`${m.name}：所有必要互動點、返回門與地面可達`, () => {
    const id = scene as keyof typeof maps;
    if (id === "corridor") assert.equal(walkable(id, 14, 13), false);
    if (id === "office") assert.equal(walkable(id, 14, 12), false);
    assert.ok(
      walkable(id, tile(m.spawn.x, m.spawn.y).x, tile(m.spawn.x, m.spawn.y).y),
    );
    for (const s of m.spots) {
      const dest = center(approach(s));
      const path = pathfind(id, m.spawn, dest, true);
      assert.ok(
        path.length || Math.abs(m.spawn.x - dest.x) < 17,
        `${s.id} 無法接近`,
      );
      for (const p of path) {
        const t = tile(p.x, p.y);
        assert.ok(walkable(id, t.x, t.y));
      }
    }
    for (let y = 6; y <= 13; y++)
      for (let x = 4; x <= 27; x++)
        if (walkable(id, x, y))
          assert.ok(
            pathfind(id, m.spawn, center({ x, y })).length ||
              JSON.stringify(tile(m.spawn.x, m.spawn.y)) ===
                JSON.stringify({ x, y }),
          );
  });
