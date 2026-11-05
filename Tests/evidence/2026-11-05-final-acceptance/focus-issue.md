# [鍵盤驗收] 關閉調查面板後焦點掉回頁面，下一個 Tab 從背包重新開始

負責範圍：Li 的介面／鍵盤焦點處理。基準：HUAM `7056631024fc7f710aaf0a40873a851a3d285377`（產品程式同 main-v2 `996a07d`）。

## 重現

1. 從新局使用 Tab 與 Enter 選取「靠近並調查紀錄櫃／維修簿夾層」，等角色到達並開啟面板。
2. 面板目前聚焦在 SECTION，role=dialog、aria-label=調查面板。
3. 按 Escape 關閉面板。
4. 讀取目前焦點為 BODY，data-action=null。
5. 再按 Tab，焦點到「門禁卡，在背包」（data-action=item:card）。

預期：關閉面板後回到先前觸發調查的按鈕（data-action=spot:cabinet），讓鍵盤與螢幕閱讀器使用者可沿原位置繼續。

實際：焦點掉回 BODY；需要從四格背包、工具列一路重按 Tab 才能回到場景物件。牆腳檢修槽、清潔推車及紀錄櫃已觀察到相同行為。

依據：`docs/Puzzle-Spec.md` 防死局契約第 6 點要求面板關閉後焦點與角色控制可恢復。本輪證據為 `focus-return.json` 及 `focus-return.jpg`。角色可繼續移動與以 Tab 重找物件，因此尚未將其描述為無法通關的死局。

建議驗收：Escape 與「關閉面板」按鈕都能將焦點回復至對應觸發按鈕；若觸發物件因切場消失，移至有明確名稱、可操作的合理位置。修復後由 TI 重新驗證 Tab／Shift+Tab 與實際螢幕閱讀器，不僅檢查 DOM 是否有 tabindex。

TI 不在本輪直接修改 Game/；交 Li 修復。
