# Issue #10：MW 面板焦點返回修復

日期：2026-11-05（Asia/Taipei）。產品基準 main-v2 `996a07d68aa996ca93f879e6cba28ad7b322e025`；TI 參考 HUAM `c0cbe68118c0470f2da5977d02edb46ed59b39f8`。本輪由 MW／Li 的 Codex 協助修復與回歸，不代表 TI 複驗或實際讀屏已通過。

## 已確認原因與修正

原 render 會以 innerHTML 替換整個介面。關閉時既沒有保留來源，也沒有聚焦重建後的控制項，因此焦點落回 BODY。本輪在修復前的正式版重現：主選單設定 Enter 開啟、Escape 關閉，焦點為 BODY，見 [before-focus.json](before-focus.json)。TI 原本的卡槽、推車與紀錄櫃證據仍保留。

新增 UiFocus，記錄 data-action／data-setting 的語意位置，不持有已移除的舊節點。調查物件由實際抵達的 Spot 指定返回來源，涵蓋非同步走近及 E 調查。面板重繪保留來源與內部操作位置；關閉後找回新的來源控制項。切場或來源消失／隱藏／禁用時，退回新場景的返回按鈕或設定。Escape 與關閉按鈕走同一 render 還原處理。

面板可及名稱改以內容標題命名，例如「紀錄櫃 · 交叉比對」，保留原有 Tab／Shift+Tab 循環與可見焦點樣式。沒有新增劇情、答案、素材、套件或儲存格式。

環境：Node v24.19.0；Phaser 3.90.0、TypeScript 5.9.3、Vite 7.3.7（套件鎖定檔不變）。瀏覽器為本機 IAB Chromium，未記錄完整版本號。

## 驗證結果與界線

| 檢查 | 結果／證據 |
| --- | --- |
| MW 自動化 | 22 通過、0 失敗，原有 17 項＋焦點回歸 5 項；[mw-tests.txt](mw-tests.txt) |
| 本機 HUAM 串接 | 29 通過、0 失敗，原 TI 7 項未改；[huam-tests.txt](huam-tests.txt) |
| 本機 HUAM 正式建置 | TypeScript／Vite 通過；[huam-build.txt](huam-build.txt) |
| 正式版實際焦點 | [browser-focus-check.json](browser-focus-check.json)：18 筆具體觀察均符合預期，包含前置定位；不是 18 項獨立自動測試 |
| 焦點畫面 | [cabinet-focus-return.png](cabinet-focus-return.png)：關閉紀錄櫃後的可見焦點 |
| 保留資料 | [protected-files.json](protected-files.json)：封存 13 份、劇情、23 份公開素材、core.ts／storage.ts 與基準逐位元一致 |

自動焦點測試使用最小 DOM 介面替身，確認重繪後選對新控制項及呼叫 focus；不能代替真實 DOM／Tab 順序。瀏覽器回歸另實際操作設定、紀錄櫃、卡槽、推車、E 調查、兩次切場及面板內循環。觸發控制項以語意 locator 定位後送 Enter，後續 Escape／Tab／Shift+Tab／E 從當下焦點送出；沒有使用 evaluate 改焦點或注入進度。也補查滑鼠點設定及關閉，焦點回設定。

本輪沿用正常讀檔到既有月台進度，沒有重新從新局純鍵盤通關，也沒有啟動／實聽 VoiceOver 或 Narrator。隊員既有手機、新玩家、音量及部分讀屏結果仍屬她原始紀錄，不改列成本輪驗收。

## 給 TI 的複驗步驟

1. 將焦點修復後的 main-v2 更新合併至自己的 HUAM，保留本來的測試與證據；執行 npm test（預期 29 項）、npm run build。
2. 若執行來源核對器，傳入本次 main-v2 的完整 SHA：`node Tests/check-source-integrity.mjs "$(git rev-parse origin/main-v2)"`。預設舊基準 996a07d 是修復前產品，不能拿它要求合法修復零差異。
3. 瀏覽器重新載入新的 dist，紀錄櫃／卡槽／推車分別以 Tab、Enter 開啟。Escape 關閉，確認原物件被讀出且焦點可見；下一個 Tab 應接續該物件之後，而非回背包。再用關閉按鈕 Enter 重做。
4. 開啟後操作線索使面板重繪，再關閉；確認仍回原物件。焦點停其他物件但按 E 調查最近物件，確認回最近的實際調查物件。
5. 切換場景後，確認焦點位於有名稱的返回／設定按鈕；方向鍵、E 可繼續控制角色。面板內 Tab／Shift+Tab 循環、大字及捲動位置仍需確認。
6. 用實際 Narrator 核對面板標題、關閉後物件名稱與接續 Tab，並完成原先未驗收的讀屏流程。由 TI 判定 Issue #10 是否可結案，MW 不代勾驗收。

修正提交 main-v2；遠端 HUAM 的驗收結論由隊員更新。PR 保持草稿，不合併至 main，不修改部署、權限或封存標籤。
