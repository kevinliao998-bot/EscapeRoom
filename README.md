# 黃燈之後 · 四層完整主線

原創俯視像素密室逃脫，從第零層一路向下至 B3，包含原五題與 EP01–EP09，共十四個主要解謎節點及告別結局。純前端，使用 Phaser **3.90.0**、TypeScript、Vite。**本次交件入口是 `Campaign/`**；原三場景短版與 B1 獨立試玩入口仍保留。TI／小雪的整合提交集中在 `HUAM`，透過 [PR #13](https://github.com/kevinliao998-bot/EscapeRoom/pull/13) 整合至 main；合併狀態以該 PR 的 GitHub 記錄為準。

舊作封存於 `archive/v1-legacy`／`v1-legacy-final`，原稿保留於 `_legacy_docs/`。遊玩不需帳號、後端或付費服務。

## 目前整合結果

**四層修正版已完成定向複驗（2026-11-06）**：整合 Li 的 [PR #15](https://github.com/kevinliao998-bot/EscapeRoom/pull/15) `829b865`，TI 提交為 `6b26cf3`。完整 **85 項測試、三份型別檢查、原版／整合建置及素材核對通過**；修正前入口的 2 通過／9 失敗反例仍保留。Windows Chrome 已實際核對三種維修門文案、無效→合法匯入、較早 B2 與通關檔套用及重載，[Issue #16](https://github.com/kevinliao998-bot/EscapeRoom/issues/16)／[#17](https://github.com/kevinliao998-bot/EscapeRoom/issues/17) 已附證據結案。使用者肯定新錯誤訊息會自動朗讀，耳機音量舒適。詳見 [修正版複驗](Tests/evidence/2026-11-06-campaign-retest/review.md)。

**最後確認**：使用者回報「Liao 已經檢查好了，B3 也通關了」，並明確授權合併 main。Liao 的檢查來源記為使用者轉述，沒有偽造 GitHub Approve；B3 通關另作補充，不覆寫第一次盲測。版本、交件與回報界線見 [最後交件紀錄](Tests/evidence/2026-11-06-main-release/review.md)。

四層初驗（2026-11-05）：從新局以鍵盤完成原五題與 EP01–EP09，到告別結局；Redmi K80 的旋轉、續接、面板、兩份下載及自行匯回回報正常，基礎朗讀抽查可讀。新玩家 P02 約 45 分鐘到 B3，當次未通關；沒有把這次盲測改寫為成功。本次修正只重驗相關流程，未再做新玩家盲測、手機結局或僅靠讀屏全程通關。舊失敗與原始真人紀錄保留於 [初驗報告](Tests/evidence/2026-11-05-campaign/review.md)。以下短版歷史不作四層版的真人驗收結果。

2026-11-05 最後複驗：產品基準 `main-v2@202f66c`，**29 項測試全部通過，TypeScript／正式建置通過，Issue #10 的面板關閉返回修正已驗證**。正式版從新局以鍵盤操作到甲，重載重看並重選乙；設定重繪保留欄位，兩種實際下載均核對成功。Windows Narrator 的卡槽、紀錄櫃、路線及雙結局分段實聽由使用者肯定回報。完整證據與限制見 [最後複驗與交件紀錄](Tests/evidence/2026-11-05-final-retest/review.md)。這是工具輔助操作與真人實聽，未宣稱視障受試者獨立通關或所有讀屏模式均通過。

同日真人紀錄：Redmi K80／Android／Chrome 的旋轉、重整與重選、大字與面板、兩種下載回報正常；手機耳機試聽及三聲重播清楚、音量舒適。匿名 P01 約 20 分鐘自行達結局乙，4 張提示卡用於電池與路線。這些為使用者先前實測，沒有在焦點修改後重做手機或第二次新玩家盲測，結果限本次設備與一位玩家，見 [原始真人紀錄](Tests/evidence/2026-11-05-final-acceptance/human-results.json)。

使用者已回報 Liao 檢查並同意合併，並授權依序整合 [PR #9](https://github.com/kevinliao998-bot/EscapeRoom/pull/9) 與 [PR #6](https://github.com/kevinliao998-bot/EscapeRoom/pull/6)，保留各人原始提交；實際合併時間與提交以這兩個 PR 的 GitHub 記錄為準。以下為歷次驗收當時的狀態，最新結論以上方最後複驗為準。

2026-11-05，TI 在 `HUAM` 獨立複驗 Li 的修正，對應 `main-v2` 基準 `996a07d`：**24 項測試全部通過，TypeScript 與正式建置通過**。正式版由新遊戲實際到達甲、重載重看，再返回選擇前完成乙；兩種 JSON 實際下載後核對成功，原 INT-07 通過。另確認方向鍵移動、Escape、大字、鍵盤音量調整、三級提示／筆記及 1／3／4 倍舞台尺寸與不足最小視口提示。詳見 [TI 獨立複驗報告](Tests/evidence/2026-11-05-ti-retest/review.md)。這是 Codex 協助的 TI 操作驗收，仍需 Liao 檢查 TI 的 PR；後續真人及完整鍵盤檢查結果以上方擴充驗收為準。

以下保留 Li 修復及串接時的來源紀錄：

2026-11-04，MW 依使用者要求修復 [Issue #7](https://github.com/kevinliao998-bot/EscapeRoom/issues/7)，並在 HUAM 串接原有 TI 測試：**24 通過、0 失敗**（原有 14 項＋TI 7 項＋MW 新回歸 3 項），TypeScript 與正式建置通過。修復已提交 `main-v2`；HUAM 同步相同檔案，保留 TI 的測試與原有歷史。這是 MW 修復及串接驗證，仍需 TI／SC 的獨立審查，PR 保持草稿。

修復前的 TI 檢查基準為 `3e5203f`：20 通過、1 失敗。該原始反例與輸出仍完整保留於 [TI 檢查報告](Tests/evidence/2026-11-04-pr6/review.md)。修復改為匯出目前記憶體進度，另提供本機原檔排查包，避免舊檔或損壞原文取代最新進度。最新證據見 [MW 修復與串接報告](Tests/evidence/2026-11-04-save-recovery/review.md)。

**公開網站尚未更新為這次四層交件版。** 本輪完成 GitHub 整合，不變更部署；以下是本機啟動方式。GitHub 原始碼頁不是遊戲網址。

## 開發與展示

四層劇情原稿見 [擴充故事計畫](docs/Expanded-Story-Plan.md)、[證據文件](docs/Expanded-Story-Evidence.md) 與 [擴充驗收](docs/Expanded-Story-Verify.md)。`Campaign/` 直接使用 `Expansion/proposal.json` 的釘選快照，與 `content/expanded-story-proposal.json` 核對一致。原稿的「提案、未實作」是寫作當時的版本邊界，現在以本 README 及交件紀錄為準。

### 四層交件版

使用 Node.js 24，在倉庫根目錄執行：

```sh
npm ci
node --experimental-strip-types --test Tests/*.test.ts Expansion/b1.test.ts Campaign/*.test.ts
node node_modules/typescript/lib/tsc.js -p Campaign/tsconfig.json
node node_modules/vite/bin/vite.js build --config Campaign/vite.config.ts
node node_modules/vite/bin/vite.js preview --config Campaign/vite.config.ts
```

開啟終端顯示的網址，預設 `http://127.0.0.1:4176/`。四層建置輸出在 `dist-campaign.local/`，公開部署時應使用該目錄的全部內容；四層版不會自動繼承短版通關。上方指令包含 Campaign 的呈現測試；既有 `npm test` 只跑 `Tests/*.test.ts`，`npm run dev`／`npm run build` 仍指向下方的原三場景短版。架構、操作與存檔細節見 [Campaign/README.md](Campaign/README.md)。

### 原三場景短版

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

四層交件版使用獨立存檔鍵 `after-amber-campaign-v1`，保存上一份有效進度，損壞原文另存。地下樓層的設定可匯出目前整合進度、匯出本機原文，以及匯入經驗證的 JSON 副本；匯入前會再次確認。驗證失敗不覆蓋原進度，寫入失敗仍可匯出記憶體最新進度。不同瀏覽器或網址的本機進度分開，移轉請使用遊戲匯出／匯入。跨層回訪保留已開門、文件與鑰匙。

以下是保留的原三場景短版規則：

自動存於瀏覽器本機 `after-amber-v2-save`；保留上一份有效快照。存檔損壞會明示、嘗試上一份。後續保存前會把損壞原文另存於 `after-amber-v2-save-corrupt`，供排查使用。設定中的「匯出存檔」始終保留當前記憶體進度，無須本機寫入成功；「匯出本機原檔（排查用）」另外保存主檔／備援／損壞快照的原始字串，無法讀取時明確提示。下載提示僅表示請求送出，請確認檔案確實已保存。不提供匯入陌生檔案的介面。 兩結局均可在主選單回到最後選擇前。重新開始需確認，與舊版存檔隔離。

設定提供大字、減少動態、音訊字幕、四項音量與靜音。無頻閃、抖鏡、驚嚇；所有聲音線索均有可重看的文字。環境音量控制用於進場的柔和環境提示，不循環播放背景音樂；「訊號標記」為合成音，沒有配音。

## 結構與協作

- `Campaign/`：四層交件入口、跨層機關、存檔、介面與呈現測試。
- `content/expanded-story-proposal.json`：四層劇情、九題與十四份證據原件；執行時使用已核對一致的 `Expansion/proposal.json` 快照。
- `content/story.json`：原三場景短版及整合版第零層的劇情／答案／提示來源。
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
# 四層完整集合：本次驗證為 85 通過、0 失敗、0 跳過
node --experimental-strip-types --test Tests/*.test.ts Expansion/b1.test.ts Campaign/*.test.ts

# 只跑根目錄測試集合，不包含全部四層呈現測試
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

`Test.md` 是此專案對應課程 `TESTS.md` 的既有檔名。最新四層結果見其中 2026-11-06 兩節及本 README 的交件紀錄；短版雙結局、早期失敗與四層初驗均保留作歷史對照，未測範圍照實記錄。

## 素材檢查

```sh
python3 -m pip install -r tools/requirements.txt
python3 tools/draw_art.py
python3 tools/check_art.py
```

檢查實際貼圖用色、8 組正文對比、繁體缺字與來源雜湊。字型與授權見 Credits.md。15–20 分鐘是設計目標；本次一位新玩家回報約 20 分鐘，不以單一樣本或自動測試時間推估所有玩家。
