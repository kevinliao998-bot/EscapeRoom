import { createHash } from "node:crypto";

// Git 的文字快照以 LF 儲存；Windows checkout 可轉為 CRLF。
// 只還原這種換行轉換，不忽略空格、文字或 JSON 值的變更。
export function gitTextBlobSha1(raw: Uint8Array): string {
  const canonical = Buffer.from(Buffer.from(raw).toString("utf8").replaceAll("\r\n", "\n"));
  return createHash("sha1").update(`blob ${canonical.length}\0`).update(canonical).digest("hex");
}
