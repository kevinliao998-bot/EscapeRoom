import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { restore } from "../Campaign/model.ts";
const file = process.argv[2];
assert.ok(file, "請指定實際下載檔案");
const bytes = readFileSync(file), state = restore(bytes.toString("utf8"));
assert.ok(state, "下載的 JSON 必須通過實際遊戲讀檔驗證");
console.log(JSON.stringify({file, bytes: bytes.length, sha256:createHash("sha256").update(bytes).digest("hex"),
  floor:state.floor, room:state.room, baseDoor:state.base.door, b1Door:state.b1.door,
  b2:state.b2, b3:state.b3, documents:state.read}, null, 2));
