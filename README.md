# 黃燈之後 · v2

原創俯視像素解謎密室逃脫，純前端；Phaser **3.90.0**、TypeScript、Vite。遊戲基準為 PR #6 的 `main-v2`，TI 的獨立測試與文件在 `ti/pr6-integration-review`。舊作封存於 `archive/v1-legacy`／`v1-legacy-final`，保護文件原稿完整保留於 `_legacy_docs/`。

## 目前整合結果

2026-11-04，TI／小雪（`HuamHuam-Lin`）以 Codex 協助獨立檢查 PR #6，基準提交 `3e5203f9a4f72960e81164b7b42de4055e01ea3c`。原有 14 項測試通過；加上 7 項整合測試後為 **20 通過、1 失敗**，TypeScript 與正式建置通過。**目前不建議合併交件。**

失敗項目是「儲存配額滿後匯出仍必須保留最新進度」：寫入失敗時，匯出函式可能拿到先前成功儲存的舊資料，已建立 [Issue #7](https://github.com/kevinliao998-bot/EscapeRoom/issues/7)。重現方式、責任分工與待驗收事項見 [TI 檢查報告](Tests/evidence/2026-11-04-pr6/review.md)；原始結果見 [整合測試輸出](Tests/evidence/2026-11-04-pr6/integration-tests.txt)。機關由 MW 修復，TI 保留失敗測試待重跑。

正式試玩網址：**待團隊提供並驗證**。以下本機預覽網址不是公開展示連結，GitHub 原始碼頁也不是遊戲網址；本輪未變更部署設定。

## 開發與展示

原始碼開發需要 Node.js 22.18+ 或 24（測試使用原生 TypeScript 去型別功能）。

```sh
npm ci
npm test
npm run build
npm run dev
```

開啟終端印出的網址，預設 http://127.0.0.1:4173/ 。`npm run preview` 展示 dist 建置；部署時把 **dist 全部內容** 放到任何靜態網站根目錄或子目錄。沒有後端、帳號、遙測或付費服務。請透過 HTTP 遊玩，瀏覽器直接開 file:// 可能阻擋 ES 模組。

若使用已建置交付包，無需安裝 Node；可執行 `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`，再以瀏覽器開啟上述網址。

內部 480×270，30×16 格地圖；顯示僅用 1、2、3、4…整數倍率。低於 480×270 顯示方向提示。四方向移動：方向鍵／WASD；靠近設備 E 調查；點可行走地面自動尋路，點物件先走近再調查。面板提供按鈕與鍵盤等效操作。左側四件道具，右上筆記與三級提示，右下設定。無失敗倒數。

## 存檔與輔助

自動存於瀏覽器本機 `after-amber-v2-save`；保留上一份有效快照。存檔損壞會明示、嘗試上一份。後續保存前會把損壞原文另存於 `after-amber-v2-save-corrupt`，供排查使用。設定中可匯出 JSON；不提供匯入陌生檔案的介面。**已知限制：寫入失敗後的匯出可能只有舊進度，尚不能視為可靠的最新進度救援。** 兩結局均可在主選單回到最後選擇前。重新開始需確認，與舊版存檔隔離。

設定提供大字、減少動態、音訊字幕、四項音量與靜音。無頻閃、抖鏡、驚嚇；所有聲音線索均有可重看的文字。環境音量控制用於進場的柔和環境提示，不循環播放背景音樂；「訊號標記」為合成音，沒有配音。

## 結構與協作

- `content/story.json`：最終劇情／答案／提示唯一來源。
- `Game/src/`：純邏輯、地圖、存檔、Phaser 視圖、可及 HTML 面板、音效。
- `Game/public/`：原創 PNG、字型與完整授權。
- `Tests/`：反例、有限抽象狀態及地圖可達性測試。
- `tools/`：原創像素源稿與檢查器；`docs/`：美術／謎題規格、流程圖、素材雜湊。
- `Verify.md` 驗收規則；`Test.md`／`Playtest.md` 記錄證據及未完成驗收。

MW 負責本次機制與網頁；SC 核對文案及素材權利；TI 需獨立審查，未通過前不合併 main。成員各自使用帳號提交，不能由代理替組員偽造 commit。

| 角色 | 交付與檢查 |
| --- | --- |
| SC／小安 | 劇情、線索、提示、答案與素材來源；檢查 TI 的 PR |
| MW／小星 | `Game/`、畫面、機關、存檔、自己的機關測試與修復 |
| TI／小雪 | `AGENTS.md`、本 README、`Test.md` 整合段、`Tests/integration.test.ts`、測試證據及問題交接 |

完整規則見 [AGENTS.md](AGENTS.md)。本輪沒有把 `yy` 或 `story-and-content` 的舊版道具／答案再混入 v2。

## 重跑 TI 的測試

```sh
# 全部測試；目前會以失敗狀態結束，原因是 INT-07
npm test

# 只跑 TI 整合測試
node --experimental-strip-types --test Tests/integration.test.ts

# 單獨重現匯出問題
node --experimental-strip-types --test --test-name-pattern=INT-07 Tests/integration.test.ts

# 檢查型別與正式建置
npm run build

# 唯讀核對基準檔案、素材與封存清單
node Tests/check-source-integrity.mjs
```

`Test.md` 是此專案對應課程 `TESTS.md` 的既有檔名。驗收對照與結果見其中「TI 整合測試」段。瀏覽器本輪只確認開場、三場景中第一個場景的繪製與設定選項，未完成獨立通關；兩結局的本輪通過證據來自邏輯／存讀檔整合測試。實體觸控、完整純鍵盤、螢幕閱讀器、音量實聽及新玩家盲測仍待團隊驗收。

## 素材檢查

```sh
python3 -m pip install -r tools/requirements.txt
python3 tools/draw_art.py
python3 tools/check_art.py
```

檢查實際貼圖用色、8 組正文對比、繁體缺字與來源雜湊。字型與授權見 Credits.md。15–20 分鐘只是目標，尚待新玩家盲測，不以自動測試時間推估玩家時間。
