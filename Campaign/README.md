# 《黃燈之後》四層連續主線 · MW 交付

本輪使用者授權製作 B2、B3，整併原版與 B1，交給 TI／小雪複驗。本入口包含原三場景作為第零層序章，接上九個地下房間、EP01–EP09 及最新 SC／TI 告別結局。原版五題仍在；合計十四個主要解謎節點。沒有另外宣稱通關時間，難度與體驗需新玩家盲測。

## 版本與邊界

- 原版基準 `main@20261ffc44a76f0975647ffb2f3f0f769351081a`；B1 基準 `mw/b1-maintenance-slice@4b00c65608c4b72812ca057a4e8c6c70c987301d`。
- 劇情資料直接引用 `Expansion/proposal.json`，逐位元組等同 `HUAM@46f8951` 的擴充提案，Git blob `6fec278b1f1276ef9748f1be97d06980a9e3ccff`，包含 SC@ce00c8d 告別結局和 TI 因果原件 D01–D14。
- 原版 `Game/`、原始故事、封存、設定與獨立 B1 入口不改。所有新增程式／文件都在 `Campaign/`，不把舊分支整支覆蓋到 main。
- 整合版第零層的維修門接 B1；舊雙結局仍在原入口。整合版採最新單一告別結局，未假裝舊版結局曾包含後段真相。
- PR 交 TI 審查，沒有代替任何成員核准或合併。README 的 MW 觀察不等於 TI 獨立驗收。

## 啟動與建置

在倉庫根目錄，Node 24，先按需要執行 `npm ci`，沒有新增 npm 依賴。

```sh
node node_modules/vite/bin/vite.js --config Campaign/vite.config.ts
node node_modules/typescript/lib/tsc.js -p Campaign/tsconfig.json
node node_modules/vite/bin/vite.js build --config Campaign/vite.config.ts
node node_modules/vite/bin/vite.js preview --config Campaign/vite.config.ts
```

整合版使用 `http://127.0.0.1:4176/`，建置在 `dist-campaign.local/`；原版 4173 與 B1 4174 可分別啟動。不能直接雙擊 `index.html` 以 file 協定代替 HTTP。交付包解壓後在包體目錄執行 `node play.mjs`（Node 18+），或使用靜態 HTTP 主機；不需要伺服器端資料庫。

## 操作與存檔

- 480×270 內部分辨率，16px 地塊、16×24 角色及四向四幀，沿用同一原版像素素材、色板、Fusion 字體和面板。
- WASD／方向鍵行走，E 調查；點物件自動走近。地下房間的「上一室／下一室」及具名樓層通道提供等效導航。
- 所有機關都可用具名按鈕完成，無須拖曳、聽力、計時或精準小點擊；Tab／Shift+Tab、Enter／空白可操作，Escape 返回或關閉。
- 筆記只保留已讀原件及已完成比對，三級提示不扣資源。主、環境、音效、訊號音量分開；字幕、大字、減少動態、靜音沿用原版設定形式。
- 整合存檔鍵是 `after-amber-campaign-v1`，備援及損壞原文分開。完全不寫原版 `after-amber-v2-save` 或 B1 `amber-expansion-b1-v1`。原版舊進度不會被自動認作新主線已完成。
- 地下樓層設定面板提供 JSON 匯出／匯入，匯入先驗證再顯示確認；不會用未驗證檔覆蓋進度。序章設定可匯出，重新載入可自動續接。存儲失敗仍可匯出記憶體最新進度。
- 跨層返回保留已開門、原件與鑰匙；每個房間重新入場時角色位於安全起點，不保存地下角色的逐像素座標。

## 架構

| 模組 | 職責 |
| --- | --- |
| `model.ts` | 四層前置、B2／B3 規則與揭露、存檔驗證；B1 委派原模組，序章委派原核心 |
| `prologue.ts` | 以 main@20261ff 介面為來源的序章適配器；加入新存檔主機、D01 與下樓交接；原檔不改 |
| `world.ts`、`world-data.ts` | 原版貼圖與新增像素幾何、腳底深度排序、行走和具名互動點 |
| `panels.ts`、`style.css` | 共用像素面板、機關、文件、提示與小屏捲動 |
| `main.ts`、`storage.ts` | 單一入口、場景生命週期、焦點、設定、整合存讀檔及 JSON 副本 |
| `campaign.test.ts`、`audit.py` | 跨層規則與復原、來源色板／對比／字形檢查 |
| `ui.test.ts`、`test-progress.ts` | 真實入口／序章呈現與匯入事件回歸；透過合法動作建立測試進度，不新增遊戲依賴 |

序章核心與 B1 核心直接 import，沒有複製兩份規則。序章視圖適配器保留來源註記，後續修改原版視圖時要同步檢查此適配器，避免維護分歧。

## 重跑驗證

```sh
node --experimental-strip-types --test Tests/*.test.ts Expansion/b1.test.ts Campaign/*.test.ts
node node_modules/typescript/lib/tsc.js --noEmit
node node_modules/typescript/lib/tsc.js -p Campaign/tsconfig.json
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js build --config Campaign/vite.config.ts
node Tests/check-source-integrity.mjs 20261ffc44a76f0975647ffb2f3f0f769351081a
python3 Campaign/audit.py
```

色板／字形腳本另外需要 FontTools 與 Brotli；本機使用既有 `.tools/pixel-check`，例如 `PYTHONPATH=../.tools/pixel-check python3 Campaign/audit.py`。其他環境可在獨立虛擬環境安裝這兩個套件，不影響遊戲執行。

流程與驗收對照：[Verify.md](Verify.md)；敘事接續：[Continuity.md](Continuity.md)；更新：[CHANGELOG.md](CHANGELOG.md)；來源：[Credits.md](Credits.md)；實測結果與限制：[REVIEW.md](REVIEW.md)。

## TI／小雪下一步

2026-11-05 已補 Issue #16／#17：維修門文案依排水／放行／身分／離站狀態呈現；主選單拒絕無效匯入時顯示狀態提示，合法重選與套用清除舊錯誤及上一局暫時訊息。**本分支 66 項測試通過**（原 55＋新增呈現 11），正式頁亦實際匯回 TI 的兩份下載檔並重載、匯出核對。詳細版本、限制與重跑：[修正複驗報告](issues-16-17-review.md)。原始失敗及原先 55 項紀錄仍保留；這不是替 TI 結案。

請以 PR 的最終 head 獨立複檢：新局通關、每層退出重載、錯誤順序復原、匯出與實際匯入、全鍵盤、真人讀屏、實體手機、耳機音量，以及第一次不知道答案的盲測。特別記錄玩家能否找到門、能否從線索支持答案，以及身分／排程／共用帳號是否被混淆。未驗證的項目保持待驗，不能沿用原版的 TI 結案直接通過新樓層。
