import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gitTextBlobSha1 } from "./git-text.ts";
import { fresh, act, restore, sourceDoc } from "../Campaign/model.ts";
import { load, save, exportCurrent, KEY, PREVIOUS, CORRUPT } from "../Campaign/storage.ts";

test("TI-MF-01｜釘選文字快照接受 LF／CRLF，但拒絕劇情字句及空格變更", () => {
  const raw = readFileSync(new URL("../Expansion/proposal.json", import.meta.url));
  const lf = raw.toString("utf8").replaceAll("\r\n", "\n");
  const pinned = "6fec278b1f1276ef9748f1be97d06980a9e3ccff";
  assert.equal(gitTextBlobSha1(Buffer.from(lf)), pinned);
  assert.equal(gitTextBlobSha1(Buffer.from(lf.replaceAll("\n", "\r\n"))), pinned);
  assert.notEqual(gitTextBlobSha1(Buffer.from(lf.replace("林沐", "其他人"))), pinned);
  assert.notEqual(gitTextBlobSha1(Buffer.from(lf.replace('"title":', '"title" :'))), pinned);
});

test("TI-MF-02｜實際使用的十四份文件及九題與 HUAM 劇情原稿一致", () => {
  const original = JSON.parse(readFileSync(new URL("../content/expanded-story-proposal.json", import.meta.url), "utf8"));
  const runtime = JSON.parse(readFileSync(new URL("../Expansion/proposal.json", import.meta.url), "utf8"));
  assert.deepEqual(runtime, original);
  for (const document of original.documents) assert.deepEqual(sourceDoc(document.id), document);
});

test("TI-MF-03｜新局不能將後段文件、身分或離站旗標當成合法存檔匯入", () => {
  for (const mutate of [
    (s: ReturnType<typeof fresh>) => { s.read = ["D14"]; },
    (s: ReturnType<typeof fresh>) => { s.b3.verified = true; },
    (s: ReturnType<typeof fresh>) => { s.b3.backup = true; },
    (s: ReturnType<typeof fresh>) => { s.b3.exited = true; s.floor = "end"; },
  ]) {
    const s = fresh(); mutate(s);
    assert.equal(restore(JSON.stringify(s)), null);
  }
  assert.ok(restore(exportCurrent(fresh())));
});

test("TI-MF-04｜三層未開通前的誤操作不消耗道具，也不寫入後段原件", () => {
  const initial = fresh();
  for (const floor of ["B1", "B2", "B3", "end"] as const) {
    const result = act(initial, { type: "travel", floor });
    assert.deepEqual(result.state, initial);
    assert.ok(result.message);
  }
  for (const id of ["D03", "D05", "D06", "D08", "D10", "D14"]) {
    assert.deepEqual(act(initial, { type: "read", id }).state, initial);
  }
});

test("TI-MF-05｜主檔損壞時讀回整合備援，原文另存且不寫舊版存檔", () => {
  const old = fresh(), latest = act(old, { type: "read", id: "D01" }).state;
  const values = new Map<string, string>();
  const writes: string[] = [];
  const store = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); writes.push(k); } };
  assert.equal(save(old, store), "");
  assert.equal(save(latest, store), "");
  assert.equal(values.get(PREVIOUS), JSON.stringify(old));
  values.set(KEY, "{broken");
  const recovered = load(store);
  assert.deepEqual(recovered.state, old);
  assert.equal(values.get(CORRUPT), "{broken");
  assert.match(recovered.warning, /上一份/);
  assert.ok(writes.every(k => k.startsWith(KEY)));
});
