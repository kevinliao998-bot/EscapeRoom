# 四層交件與 main 整合紀錄

日期：2026-11-06（Asia/Taipei）。本輪使用者回報「Liao 已經檢查好了，B3 也通關了」，明確要求完成收尾並合併 main。原話及未提供的條件見 human-confirmation.json。

## 交件內容與版本

- PR #13：HUAM 的四層整合、劇情補完、TI 測試與證據；本輪開始時為 `6b26cf3f4ef9bc7f44a4587f5658b58a5954e2d7`。
- Li 已驗證產品：PR #15 `829b865f4d2094ea304cb18c52b0d8703c0501a9`，完整歷史已包含在 HUAM；不需再次整支覆蓋。
- 合併前 main：`20261ffc44a76f0975647ffb2f3f0f769351081a`，是 HUAM 的祖先；Li 修正版亦是 HUAM 的祖先。
- 本輪最後完善只改 README、AGENTS、Test.md 與本交件紀錄，沒有修改遊戲、故事、答案、素材或存檔規則。README 明示四層入口是 Campaign，完整測試需包含 Campaign/*.test.ts；保留短版入口及歷史紀錄。

## 已確認的驗證

交件遊戲與 HUAM `6b26cf3` 的已測產品一致。[獨立複驗報告](../2026-11-06-campaign-retest/review.md) 包含 85 通過／0 失敗／0 跳過、三份型別檢查、兩份正式建置、素材核對、舊入口 9 項失敗反例，以及三種回訪文案、無效→合法匯入、較早 B2 與通關進度匯回後重載的實際操作。Issue #16／#17 已完成獨立複驗並結案。

本輪核對 PR #13 可合併，GitHub head 的 commit statuses 為空、check runs 為 0，沒有將「未設定 GitHub 檢查」寫成 GitHub CI 通過。驗收依據是已提交的本機指令輸出與瀏覽器證據；最後文件整理另檢查 JSON、相對連結及產品未變動，不無理由重做整套遊戲測試。

## Liao 檢查與 B3 通關

Liao 已檢查由使用者直接回報；查詢時 PR #13 的 GitHub reviews 仍為空。這兩者分開記錄，不冒充任何成員 Approve。本輪合併依使用者這次明確授權進行。

使用者也回報 B3 已通關，但未說玩家是否為 P02、是否獨立盲測、花費時間或使用提示，因此只保存已提供的事實。第一次 P02 約 45 分鐘到 B3 未通關的紀錄保留；不改成當時已成功。基礎讀屏抽查與這次通關回報也不等同僅靠讀屏獨立全程通關。

## 合併與交付

透過 [PR #13](https://github.com/kevinliao998-bot/EscapeRoom/pull/13) 使用 merge commit 合併 main，保留 HuamHuam-Lin、Li 原始提交歷史，避免 squash 消掉組員個別紀錄。合併時釘住最後文件提交的 head SHA；若 head 有變動，先停止重核。實際合併時間與 merge SHA 以 GitHub PR 記錄為準。

合併後另核對 main 的整棵 Git tree 與最後 HUAM 交件內容一致、原始提交為 main 祖先。保留 HUAM 與其他分支，不手動關閉他人 PR 或改動權限。公開網站本輪未更新；從 main 啟動四層版請依 README 的 Campaign 指令，不能用舊短版公開網址冒稱新交件版。
