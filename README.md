# 黃燈之後 · v2

原創俯視像素解謎密室逃脫，純前端；Phaser **3.90.0**、TypeScript、Vite。此分支為 `main-v2`，舊作封存於 `archive/v1-legacy`／`v1-legacy-final`，保護文件原稿完整保留於 `_legacy_docs/`。

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

自動存於瀏覽器本機 `after-amber-v2-save`；保留上一份有效快照。存檔損壞會明示、嘗試上一份，不刪原檔。設定中可匯出 JSON；不提供匯入陌生檔案的介面。兩結局均可在主選單回到最後選擇前。重新開始需確認，與舊版存檔隔離。

設定提供大字、減少動態、音訊字幕、四項音量與靜音。無頻閃、抖鏡、驚嚇；所有聲音線索均有可重看的文字。環境音量控制用於進場的柔和環境提示，不循環播放背景音樂；「訊號標記」為合成音，沒有配音。

## 結構與協作

- `content/story.json`：最終劇情／答案／提示唯一來源。
- `Game/src/`：純邏輯、地圖、存檔、Phaser 視圖、可及 HTML 面板、音效。
- `Game/public/`：原創 PNG、字型與完整授權。
- `Tests/`：反例、有限抽象狀態及地圖可達性測試。
- `tools/`：原創像素源稿與檢查器；`docs/`：美術／謎題規格、流程圖、素材雜湊。
- `Verify.md` 驗收規則；`Test.md`／`Playtest.md` 記錄證據及未完成驗收。

MW 負責本次機制與網頁；SC 核對文案及素材權利；TI 需獨立審查，未通過前不合併 main。成員各自使用帳號提交，不能由代理替組員偽造 commit。

## 素材檢查

```sh
python3 -m pip install -r tools/requirements.txt
python3 tools/draw_art.py
python3 tools/check_art.py
```

檢查實際貼圖用色、8 組正文對比、繁體缺字與來源雜湊。字型與授權見 Credits.md。15–20 分鐘只是目標，尚待新玩家盲測，不以自動測試時間推估玩家時間。
