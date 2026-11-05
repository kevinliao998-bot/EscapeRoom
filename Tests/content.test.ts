import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { story } from "../Game/src/core.ts";
test("劇情三場景、四件物品、五題三級提示與唯一流程 ID", () => {
  assert.equal(Object.keys(story.items).length, 4);
  assert.equal(Object.keys(story.hints).length, 5);
  assert.ok(Object.values(story.hints).every((h) => h.length === 3));
  for (let i = 1; i < 4; i++) {
    const a = story.snapshots[i - 1],
      b = story.snapshots[i];
    assert.equal(
      Object.keys(a).filter(
        (k) => a[k as keyof typeof a] !== b[k as keyof typeof b],
      ).length,
      1,
    );
  }
  const f = readFileSync(new URL("../docs/flow.mmd", import.meta.url), "utf8"),
    ids = [...f.matchAll(/\b(V2_[A-Z_]+)(?:\[|\{)/g)].map((m) => m[1]);
  assert.equal(ids.length, 13);
  assert.equal(new Set(ids).size, 13);
  const verify = readFileSync(new URL("../Verify.md", import.meta.url), "utf8");
  for (let n = 1; n <= 16; n++)
    assert.ok(verify.includes("V2_" + String(n).padStart(2, "0")));
});
test("琥珀供電節點只有一條無迴圈的入口到出口路線", () => {
  const paths: string[][] = [];
  function dfs(path: string[]) {
    const at = path.at(-1)!;
    if (at === "exit") {
      paths.push(path);
      return;
    }
    for (const edge of story.route.edges)
      if (edge.includes(at)) {
        const n = edge.find((n) => n !== at)!;
        if (
          !path.includes(n) &&
          story.route.nodes.find((v) => v.id === n)!.powered
        )
          dfs([...path, n]);
      }
  }
  dfs(["entry"]);
  assert.deepEqual(paths, [story.route.answer]);
});
