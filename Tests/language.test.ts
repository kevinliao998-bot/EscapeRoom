import { test } from "node:test";
import assert from "node:assert/strict";
import { localizeMarkup } from "../Game/src/i18n.ts";

test("預設繁體中文介面維持原文", () => {
  const markup = "<h2>設定與輔助</h2><button>進入第零層</button>";
  assert.equal(localizeMarkup(markup, "zh-Hant"), markup);
});

test("英文模式會翻譯選單、設定與互動文字", () => {
  const markup =
    '<h1>黃燈<br><span>之後</span></h1><h2>設定與輔助</h2><button>進入第零層</button>';
  assert.equal(
    localizeMarkup(markup, "en"),
    '<h1>After the Yellow<br><span>Light</span></h1><h2>Settings & Accessibility</h2><button>Enter Level Zero</button>',
  );
});

test("英文模式會翻譯故事提示與主要線索", () => {
  const markup =
    "<p>有些東西改了，也有東西一直沒變。</p><p>波形的長度與段數也能用眼睛比較。</p>";
  assert.equal(
    localizeMarkup(markup, "en"),
    "<p>Some things changed. Others stayed the same.</p><p>You can compare waveform length and number of marks by sight.</p>",
  );
});
