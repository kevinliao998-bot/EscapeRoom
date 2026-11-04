// TI 的唯讀核對器；不重新產生或覆寫 MW 的素材清單。
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
// Li 修復後的 main-v2；可傳入另一個完整提交 SHA，核對對應版本。
const baseline = process.argv[2] || "996a07d68aa996ca93f879e6cba28ad7b322e025";
assert.match(baseline, /^[a-f0-9]{40}$/, "基準必須是完整提交 SHA");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (name) => readFileSync(path.join(root, name));
const original = (name) => execFileSync("git", ["show", `${baseline}:${name}`], {cwd: root, maxBuffer: 8 * 1024 * 1024});
const manifest = JSON.parse(read("docs/asset-manifest.json"));
for (const entry of manifest.files) {
  const bytes = original(entry.path.replaceAll("\\", "/"));
  assert.equal(bytes.length, entry.bytes, entry.path);
  assert.equal(hash(bytes), entry.sha256, entry.path);
}
const archived = [...read("_legacy_docs/MANIFEST.md").toString("utf8")
  .matchAll(/\| `([^`]+)` \| (\d+) \| `([a-f0-9]{64})` \|/g)];
assert.ok(archived.length > 0);
for (const [, name, size, sha] of archived) {
  const bytes = original(name);
  assert.equal(bytes.length, Number(size), name);
  assert.equal(hash(bytes), sha, name);
}
const protectedPaths = ["Game", "content", "_legacy_docs", "tools", "docs", "Brief.md", "Verify.md",
  "Plans.md", "Plans.v1.md", "Playtest.md", "Credits.md", "index.html", "package.json", "package-lock.json",
  "tsconfig.json", "vite.config.ts", "Tests/content.test.ts", "Tests/core.test.ts", "Tests/maps.test.ts", "Tests/storage.test.ts"];
const tracked = execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", ...protectedPaths], {cwd: root, encoding:"utf8"})
  .trim().split("\n").filter(Boolean);
let lineEndingConversions = 0;
for (const name of tracked) {
  const source = original(name), working = read(name);
  if (source.equals(working)) continue;
  assert.ok(!source.includes(0) && !/\.(png|woff2)$/.test(name), `二進位檔不可改變：${name}`);
  assert.equal(working.toString("utf8").replaceAll("\r\n", "\n"), source.toString("utf8").replaceAll("\r\n", "\n"), `TI 不改動 ${name}`);
  lineEndingConversions++;
}
console.log(`基準 ${baseline}`);
console.log(`Git 原始素材 ${manifest.files.length} 項的大小與 SHA256 和清單一致。`);
console.log(`Git 封存清單列出的 ${archived.length} 份原稿，大小與 SHA256 一致。`);
console.log(`組員負責的 ${tracked.length} 個基準檔案內容一致；其中 ${lineEndingConversions} 份僅有 Git 的 Windows 換行轉換。`);
console.log("本核對不重新驗證色數、對比或繁體缺字；那些數值仍屬既有 MW 紀錄。");
