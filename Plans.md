# MW 分工與實作計畫

- 劇本與內容 SC：main/brief.md 已提供故事；尚未附具體 content 與 assets。後續可替換 Game/content.js 的暫行文本／答案及原創向量場景。
- 網頁與機關 MW（yy）：實作 Game/、MW 的 Verify.md、Test.md、存檔、背包、計時、房間與兩個結局；原始 AI 草稿見 Plans.v1.md。
- 測試與整合 TI：獨立檢查內容是否符合故事、真人盲玩、整合測試與 PR 審查。MW 不代替 TI 宣告核准。

## 本版技術決策

採用可直接開啟的靜態檔案與一般 script 標籤，不用 fetch、ES modules、外部套件或 CDN。核心狀態、文案、場景、聲音及畫面分離；Node 只用於測試與選用本機預覽伺服器。畫面全部繁體中文。

具體答案屬 MW 為可玩性補齊的暫行規格，集中在 content.js；不改寫原始 brief.md。所有鎖門與成功條件由核心驗證，不只依賴畫面隱藏按鈕。
