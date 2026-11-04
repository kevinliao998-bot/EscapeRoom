# 黃燈之後 · v2

原創俯視像素解謎密室逃脫，純前端；Phaser **3.90.0**、TypeScript、Vite。遊戲基準為 PR #6 的 `main-v2`，TI／小雪的測試與文件集中在使用者指定的 `HUAM` 分支。舊作封存於 `archive/v1-legacy`／`v1-legacy-final`，保護文件原稿完整保留於 `_legacy_docs/`。

## 目前整合結果

最終版擴充驗收**整體尚未通過**：純鍵盤可達雙結局並操作設定／匯出，但「關閉面板後焦點未返回觸發按鈕」未通過，見 [Issue #10](https://github.com/kevinliao998-bot/EscapeRoom/issues/10)，待 Li 修復。使用者以 Redmi K80／Android／Chrome 回報旋轉、重整與重選、大字與面板、兩種下載正常；手機耳機試聽及三聲重播清楚、音量舒適。匿名新玩家 P01 約 20 分鐘自行達結局乙，4 張提示卡用於電池與路線。Windows Narrator 已實聽核對部分設定與筆記文字，僅靠朗讀的完整通關仍未驗收。詳見 [最終版五項擴充驗收](Tests/evidence/2026-11-05-final-acceptance/review.md)，結果限本次設備與一位玩家，不能將自動測試通過視為五項全部通過。

2026-11-05，TI 在 `HUAM` 獨立複驗 Li 的修正，對應 `main-v2` 基準 `996a07d`：**24 項測試全部通過，TypeScript 與正式建置通過**。正式版由新遊戲實際到達甲、重載重看，再返回選擇前完成乙；兩種 JSON 實際下載後核對成功，原 INT-07 通過。另確認方向鍵移動、Escape、大字、鍵盤音量調整、三級提示／筆記及 1／3／4 倍舞台尺寸與不足最小視口提示。詳見 [TI 獨立複驗報告](Tests/evidence/2026-11-05-ti-retest/review.md)。這是 Codex 協助的 TI 操作驗收，仍需 Liao 檢查 TI 的 PR；後續真人及完整鍵盤檢查結果以上方擴充驗收為準。

以下保留 Li 修復及串接時的來源紀錄：

2026-11-04，MW 依使用者要求修復 [Issue #7](https://github.com/kevinliao998-bot/EscapeRoom/issues/7)，並在 HUAM 串接原有 TI 測試：**24 通過、0 失敗**（原有 14 項＋TI 7 項＋MW 新回歸 3 項），TypeScript 與正式建置通過。修復已提交 `main-v2`；HUAM 同步相同檔案，保留 TI 的測試與原有歷史。這是 MW 修復及串接驗證，仍需 TI／SC 的獨立審查，PR 保持草稿。

修復前的 TI 檢查基準為 `3e5203f`：20 通過、1 失敗。該原始反例與輸出仍完整保留於 [TI 檢查報告](Tests/evidence/2026-11-04-pr6/review.md)。修復改為匯出目前記憶體進度，另提供本機原檔排查包，避免舊檔或損壞原文取代最新進度。最新證據見 [MW 修復與串接報告](Tests/evidence/2026-11-04-save-recovery/review.md)。

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

自動存於瀏覽器本機 `after-amber-v2-save`；保留上一份有效快照。存檔損壞會明示、嘗試上一份。後續保存前會把損壞原文另存於 `after-amber-v2-save-corrupt`，供排查使用。設定中的「匯出存檔」始終保留當前記憶體進度，無須本機寫入成功；「匯出本機原檔（排查用）」另外保存主檔／備援／損壞快照的原始字串，無法讀取時明確提示。下載提示僅表示請求送出，請確認檔案確實已保存。不提供匯入陌生檔案的介面。 兩結局均可在主選單回到最後選擇前。重新開始需確認，與舊版存檔隔離。

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
| SC／Liao | 劇情、線索、提示、答案與素材來源；檢查 TI 的 PR |
| MW／Li | `Game/`、畫面、機關、存檔、自己的機關測試與修復 |
| TI／小雪 | `AGENTS.md`、本 README、`Test.md` 整合段、`Tests/integration.test.ts`、測試證據及問題交接 |

完整規則見 [AGENTS.md](AGENTS.md)。本輪沒有把 `yy` 或 `story-and-content` 的舊版道具／答案再混入 v2。

## 重跑 TI 的測試

```sh
# 全部測試；本輪修復後為 24 通過、0 失敗
npm test

# 只跑 TI 整合測試
node --experimental-strip-types --test Tests/integration.test.ts

# 單獨重跑原 INT-07 回歸案例（修復後應通過）
node --experimental-strip-types --test --test-name-pattern=INT-07 Tests/integration.test.ts

# 檢查型別與正式建置
npm run build

# 唯讀核對目前 Li 修復後的基準、素材及封存檔案（需 Git checkout）
node Tests/check-source-integrity.mjs
```

`Test.md` 是此專案對應課程 `TESTS.md` 的既有檔名。驗收對照與結果見「TI 獨立複驗 · 2026-11-05」段；2026-11-04 的失敗輸出保留作歷史對照。本輪已完成上述桌面實際雙結局與下載核對，其他未完成項目照實保留。

## 素材檢查

```sh
python3 -m pip install -r tools/requirements.txt
python3 tools/draw_art.py
python3 tools/check_art.py
```

檢查實際貼圖用色、8 組正文對比、繁體缺字與來源雜湊。字型與授權見 Credits.md。15–20 分鐘是設計目標；本次一位新玩家回報約 20 分鐘，不以單一樣本或自動測試時間推估所有玩家。
