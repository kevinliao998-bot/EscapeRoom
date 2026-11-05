# MW 存檔救援修復與 HUAM 串接驗證

日期：2026-11-04（Asia/Taipei）。使用者要求修復截圖中的失敗測試並優化。此輪由 MW 的 Codex 協助修復及串接測試，不是 TI／SC 的真人獨立核准。

## 原因與修正

Issue #7 的反例已在 HUAM `a618c5aa7ffb8def45507caac1f2bb098690c44d` 重現：20 通過、1 失敗。舊 `exportSave` 優先讀主存檔，配額滿時會下載舊進度。

`exportSave` 現在只序列化當前記憶體進度，與 localStorage 讀寫是否成功分離。另設 `exportRecovery`，只讀取三個固定遊戲 key、將原始字串包進排查 JSON；不覆寫主檔或損壞快照。無原檔或讀取被拒絕時明確回報，不下載偽造的遊戲存檔。設定區分兩種用途，並保留儲存失敗警告；下載提示只表示請求已送出，不假稱檔案一定保存成功。

## 可核對的結果

| 檢查 | 證據與結果 |
| --- | --- |
| 修復前 HUAM 全套 | [before-tests.txt](before-tests.txt)：20 通過、1 失敗，INT-07 失敗 |
| MW 修復及回歸 | [mw-tests.txt](mw-tests.txt)：17 通過，包括新增 3 項測試 |
| HUAM 串接 | [huam-tests.txt](huam-tests.txt)：24 通過、0 失敗；TI 原有 7 項測試完整保留 |
| 正式建置 | [huam-build.txt](huam-build.txt)：TypeScript 與 Vite 7.3.7 通過 |
| 受保護資料 | [protected-files.json](protected-files.json)：與原基準 `3e5203f` 比對，封存 13 份、劇情 1 份、公開素材 23 份逐位元一致 |
| 實際瀏覽器下載 | [browser-download-check.json](browser-download-check.json)：點擊兩個下載按鈕，讀取實際檔案並驗證 `restore`、門禁卡、檢查點與雙結局紀錄；[介面截圖](export-ui.png) |

重現指令：`npm test`（`node --experimental-strip-types --test Tests/*.test.ts`）、`npm run build`。Node v24.19.0，鎖定套件未變。新增文字使字形檢查範圍由 570 增至 583 個繁體漢字，無缺字；素材仍 14 色，8 組正文配色均 ≥4.5:1。只更新清單的字形計數，素材本身未改。

## 證據界線與交接

配額與儲存拒絕由記憶體 Storage 替身重現，沒有聲稱耗盡真實瀏覽器配額。瀏覽器本輪從既有月台進度驗證下載與回到遊戲，沒有重做 TI 獨立全流程、實體手機、螢幕閱讀器、音效實聽或新玩家盲測，也沒有注入通關旗標。

`Tests/evidence/2026-11-04-pr6/` 及 TI 的 INT-07 原始內容不變，其 20／1 結果是修復前證據。`Tests/check-source-integrity.mjs` 固定比較原 MW 基準，用於重現 TI 當時沒有修改組員原檔；本次 MW 正當修復後不把此歷史核對器冒充現行零差異檢查。

PR #6 與 #9 保持草稿，留待指定組員審查；本次不合併至 main、不改部署、不動封存分支或標籤。
