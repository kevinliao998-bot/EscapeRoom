# MW／Li：Issue #16／#17 修復與交接

日期：2026-11-05。基準為 PR #15 的 `8fb2223d56e1ef714921c2b9af3051ed4532116b`；先 fetch 確認產品分支未移動。TI 最新紀錄位於 `HUAM@fc000b4`，本輪沒有把 TI 分支整支合併或改寫其失敗證據。

## 修正範圍

- [#16](https://github.com/kevinliao998-bot/EscapeRoom/issues/16)：序章維修門透過宿主讀取整合狀態。首次維持未知；已排水及開門顯示積水已排除、通路保持；身分核對後改為保全目標；離站後顯示證據保全及外部受理，明說尚未完成官方認定。劇情原件不改，也不將歷史文件改寫成今晚日誌。
- [#17](https://github.com/kevinliao998-bot/EscapeRoom/issues/17)：主選單提供可見的 `role=status`、`aria-live=polite` 訊息。開始重選、合法驗證、套用及換場清除舊暫時訊息；取消確認清除待匯入副本。讀取錯誤有明確回報；以選檔序號忽略晚到的舊結果。真正的存檔寫入警告保留，不以清畫面掩蓋失敗。
- 僅改整合呈現與測試／交付；原版、B1 核心、存檔 schema／驗證、解題前置、劇情 JSON、素材與封存均未改。不包含九房視覺設計提案。

## 自動回歸

`ui.test.ts` 執行實際 `main.ts`、`prologue.ts` 的渲染及事件流程，使用真實 model／restore／panels；只替代 DOM 容器、Phaser 和音訊。測試不直接呼叫私有操作、也不把 HTML 檢查冒充真實瀏覽器或讀屏實聽。共用測試進度移至 `test-progress.ts`，均由合法動作取得，避免重複載入測試產生虛增通過數。

11 項包含首次／排水／已核對／通關回訪；主選單拒絕且不覆寫；無效後合法重選及取消；通關後匯回 B2；檔案讀取失敗與同檔重選；保留寫入失敗警告；非同步舊檔晚完成；通關匯回與重載。

```sh
# 以修正前的實際入口／序章重現：2 通過、9 失敗
CAMPAIGN_UI_BASELINE_REF=8fb2223d56e1ef714921c2b9af3051ed4532116b node --experimental-strip-types --test Campaign/ui.test.ts
# 修正後，本支 66 通過、0 失敗、0 跳過
node --experimental-strip-types --test Tests/*.test.ts Expansion/b1.test.ts Campaign/*.test.ts
node node_modules/typescript/lib/tsc.js -p Campaign/tsconfig.json
node node_modules/typescript/lib/tsc.js --noEmit
node node_modules/vite/bin/vite.js build --config Campaign/vite.config.ts
node node_modules/vite/bin/vite.js build
node Tests/check-source-integrity.mjs 20261ffc44a76f0975647ffb2f3f0f769351081a
```

原始失敗見 `issues-16-17-before.txt`；完整通過見 `issues-16-17-tests.txt`。日誌中僅將本機絕對路徑正規化成 `<repo>`，不刪除失敗斷言或實際輸出。基準重放只固定入口與序章來源，其餘純規則及素材與基準相同；不宣稱這是完整舊版瀏覽器重玩。

Node v24.19.0、TypeScript 5.9.3、Vite 7.3.7；兩份型別與正式建置均通過。修正版 bundle 為 `index-BbeGnrc8.js`，CSS 仍為 `index-BxKvLjFa.css`。來源色板 16 色均在原 18 色內，8 組宣告正文配色 ≥4.5:1；加入新文案及測試後 818 個漢字無缺字。字型工具使用本機 Python 3.12.14 與既有 `.tools/pixel-check`；系統 Python 3.9 無法載入該處的 Brotli 3.12 擴充，改用相容既有環境，沒有改遊戲依賴。

原版 69 個受保護檔案、23 項素材、12 份封存原稿核對一致。未把這項核對當成全螢幕像素對比或真人可讀性驗收。

## 正式建置定向驗證

本輪 macOS／內建瀏覽器，獨立測試網址 `http://127.0.0.1:4178/`。序章從新局實際完成原五題並看到首次門文案，再進 B1 的主選單操作檔案。沒有注入 localStorage 或直接呼叫遊戲內部方法。

後段回訪使用 TI 在 `HUAM@fc000b4` 已提交的實際下載檔，透過遊戲按鈕、選檔與確認套用；不是聲稱本輪再次全程解完 B1–B3。76 筆 UI／狀態觀察保留於 `issues-16-17-browser.json`。

|情境|實際結果／證據|
|---|---|
|首次開門|保留「仍有積水」「尚不足以回答妹妹的去向」，未提前揭露。`issues-16-17-first.png`。|
|無效匯入|主選單顯示拒絕說明，狀態區為 polite；確認頁不出現。`issues-16-17-menu.png`。未做讀屏實聽，宣告支援仍需 TI 複檢。|
|接著合法匯入|實際選 TI 通關檔，確認頁不再殘留無效檔錯誤。`issues-16-17-import.png`。|
|通關匯回後重載|顯示告別結局；重新載入後仍是告別結局，再從 UI 實際匯出。`issues-16-17-reload.png`。|
|通關回訪 L0|由 B3 通道回月台再調查門，顯示已排水／放行、保全與受理，沒有舊的去向不明目標。`issues-16-17-door.png`。|
|匯回較早 B2|確認後為 B2 介紹，無上一局「證據已保全」或匯入錯誤；重載續接監控室，鑰匙與證據包均未取得。`issues-16-17-earlier.png`。|
|B2 回訪 L0|維修門顯示排水／放行完成，但保留身分尚未解明，不提前顯示受理。`issues-16-17-drained.png`。|
|Console|最後 error／warn 讀取為空。|

兩份匯回、重載、再匯出的實際磁碟檔均通過 restore，**位元組及 SHA256 與 TI 原檔相同**：

- 通關：3,122 B，`e196a7fe13a721adac902643fa805c524f7ba3d37e605675daec681660c4fe43`；floor=end、14 文件、backup/exited=true。
- 較早 B2：2,890 B，`cbf52ee0e49257141b96182ea2fddd0a67965e0e9e90e8924e7fb1fcb2d956eb`；floor=B2、3 文件、backup/exited=false。

個人下載檔及模型產生的輔助 JSON 留在本機測試區，不另加入此修正提交。部分序章自動走近超過單次工具等待時間，之後可見面板並正常繼續；不把工具等待當成機關死局。

## 修正版包體

修正版重新封裝，CRC 與清單內逐檔 SHA256 驗證通過，全部執行檔與正式建置逐位元組一致。解壓至獨立目錄，以內附 play.mjs 的 4179 埠啟動，看到新局入口、單一 canvas，console 無 error／warn；記錄於 issues-16-17-package.json。這是包體入口冒煙，不冒充第二次完整通關。ZIP 雜湊放在 PR 與本機交接清單，避免把 ZIP 自身雜湊寫進包內造成循環。

## 交回 TI／小雪

請以 PR #15 的**更新後 head**重新跑你的完整測試集合，複驗三種維修門文案、無效→合法匯入、較早 B2 匯回，以及通關檔匯回後重載。新主選單狀態提示的讀屏宣告、原本待補的耳機舒適度仍交 TI 獨立確認。

本支 66 與 HUAM 先前 74 項測試的檔案集合不同，不能直接拿數字當退步或代替 TI 結果。未關閉 #16／#17、未代替成員 Approve、未合併 main 或部署；待小雪核對後再結案。
