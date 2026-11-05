# 最後複驗與交件紀錄

日期：2026-11-05（Asia/Taipei）。產品基準為 Li 的 `main-v2@202f66c67bfaab5f4540252a20df4b5f3572c4d3`。HUAM 先以 `d9c5291` 合併該修正，保留原 TI 提交與失敗證據。**本輪確認 Issue #10 的關閉返回已修復，29 項測試與正式建置通過，實際鍵盤流程已達雙結局；主要場景與雙結局的 Narrator 分段實聽已有使用者肯定回報。**未將其擴張為全裝置、所有讀屏模式或視障受試者獨立通關。

## 自動檢查

- Node v24.22.1；29 項通過、0 失敗、0 跳過，見 `tests.txt`。包含原 TI 7 項及 Li 新增的 5 項焦點回歸。
- TypeScript 與 Vite 正式建置通過，見 `build.txt`。
- 本輪終端無 npm.cmd，因此直接執行 package.json 對應的 Node、TypeScript 與 Vite 指令；實際指令記於 `environment.json`，未將未執行的 npm 指令寫為成功。
- 對新版產品基準核對：69 個組員檔案內容相同，23 項素材與清單列出的 12 份封存原稿雜湊一致，見 `source-integrity.txt`。此核對不重驗素材配色或字形；沒有由 TI 修改 Game/ 或 content/。

## 瀏覽器與焦點觀察

正式 dist 以本機 Chrome 測試；新測試來源不寫入或偽造通關狀態。正式起點以遊戲的「確認開始新的調查」建立。準備期間的輸入及失敗請求亦保留在 `keyboard-trace.json`，不將鍵盤請求筆數當有效操作或貢獻數。

已觀察：

- 卡槽、推車在面板重繪後可關閉並返回原物件；卡槽之後 Tab 到推車，推車之後 Tab 到盡頭門。
- 進入站務室及月台後，焦點落在有名稱的「返回」物件。
- 檢修盒可用關閉按鈕回原物件，E 再調查實際鄰近物件後，以 Escape 仍回檢修盒。
- 紀錄櫃完成壓痕、兩條比對及領取路線片後，關閉按鈕返回 `spot:cabinet`，下一次 Tab 接 `spot:powerBox`。見 `cabinet-panel.txt`、`cabinet-focus-return.jpg`。
- 路線面板一般焦點循環：從面板 Shift+Tab 到「清除本次路線」，再 Tab 回「關閉面板」。已透過鍵盤裝配電池、路線片，並完成入口→分岔→檢修→出口，見 `route-panel.txt`。
- 從新局取得卡、撬片、供電、波形、紀錄比對、路線片與電池、月台兩設備及供電路線，到達甲；瀏覽器實際重載後可重看甲，返回最後選擇前可到乙。見 `ending-a.txt/.jpg`、`ending-b.txt/.jpg`。遊戲內動作使用鍵盤；本輪重載用瀏覽器 reload API、Chrome 重啟屬測試設定，不稱為完全連續、無中斷的一次真人鍵盤盲玩。
- 大字核取方塊切換、總音量右／左方向鍵調整後，重繪仍保留相同 data-setting 欄位；最後還原原值。設定關閉返回「設定與輔助」。
- 兩種檔案實際下載後另存 `downloaded-progress.json`、`downloaded-recovery.json`。`check-downloads.mjs` 使用正式 restore 核對成功：目前進度可恢復、lastEnding=B、seenEndings=[A,B]、門已開與檢查點存在，原檔包 SAVE 與進度一致。下載通知等待曾超時，但下載資料夾中確實有本輪新檔；不把工具未收到事件寫為下載失敗。

紀錄櫃真人重聽後的首次 Shift+Tab 曾觀察到 BODY，下一次 Tab 到背包；當時未取得按鍵前的焦點，不能據此確定是哪一步改變定位。後續以月台面板分開保存朗讀前／後的焦點：使用者只按 Insert+R、Ctrl，再回報「能」，工具讀到焦點仍為 SECTION，下一次 Tab 到關閉面板，關閉後亦回路線圖，沒有重現該情況。證據為 `route-before-reading.json`、`route-after-reading.json`。孤立觀察照實保留，不把它偽報為已確認且修復的新 bug，也不將此小樣本擴張為所有讀屏情境均通過。

## 真人實聽與審查來源

使用 Windows Narrator，由使用者聽聲音回報，Codex 不聲稱自己聽見。已取得選單有聲、卡槽三項肯定回覆、紀錄櫃標題與報告／維修簿可讀、路線供電節點與開門文字可讀、甲／乙標題與結局文字／選項可讀的回報；原話見 `human-retest.json`，最後回報朗讀程式「已停止」。這是工具輔助鍵盤操作與真人分段實聽，不是視障受試者獨立通關，亦未取得錄音；沒有逐句轉錄或宣稱每個控制項均經真人逐一核對。

使用者同輪回報「Liao 已檢查並同意合併」。GitHub 在開始時沒有 PR #9 審查紀錄，故來源記為使用者轉述；不冒充 Liao 在 GitHub 發 Approve。

實體 Redmi K80、手機耳機與一位新玩家的資料沿用同日 `2026-11-05-final-acceptance/human-results.json`，不寫成本次焦點修改後又重做一輪的結果。當時回報：手機四組補查正常，試聽及三聲重播正常、音量舒適；P01 約 20 分鐘自行到乙，4 張提示卡用於電池與路線。

## 中斷與恢復

實體 Escape 曾觸發電腦操作工具停止，使用者明確回覆「繼續」後才恢復。其後 Chrome 連線中斷且應用已關閉，重新啟動時顯示「Chrome 未正確關閉」提示；使用正常存檔續玩，不注入進度。角色走近時間較長時的等待超時經後續畫面確認已抵達，未列為機關失敗。

## 交件與合併核對

本輪複驗已完成；接續先 [PR #9](https://github.com/kevinliao998-bot/EscapeRoom/pull/9)（HUAM→main-v2），再 [PR #6](https://github.com/kevinliao998-bot/EscapeRoom/pull/6)（main-v2→main），使用保留各人原始提交的合併方式。使用者已授權驗證後直接合併。本文隨 HUAM 提交，實際合併時間、合併提交與最終 main 以兩個 PR 的 merged 記錄及 main 分支為準，不預先編造尚未產生的合併 SHA。

教師可從 main 的 README 啟動遊戲、執行測試，並從 HUAM／PR #9 的原始提交追查 TI 的測試、問題回報、修正複驗與真人回報。公開遊玩網站仍未部署，本輪不改部署設定；原始碼專案連結不能冒充公開遊戲網址。
