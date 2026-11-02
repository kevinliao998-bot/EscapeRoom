# 素材與授權

舊版 Credits 完整保留於 `_legacy_docs/Game__Credits.md`，新版不載入任何舊圖像或程式。

| 素材 | 作者與來源 | 授權／署名 |
| --- | --- | --- |
| 3 張車站地面、8 張設備／物件、4 件物品圖示、16 幀林澄 | 專案團隊／Codex 輔助，以 `tools/draw_art.py` 原創繪製；逐像素命令 `tools/art-source.json` | 本次原創圖像採 CC0-1.0；無外部圖片。角色表為 64×96，4×4 幀 |
| 波形／滴水／紙張／金屬的合成提示 | 原創 Web Audio 程式 `Game/src/audio.ts` | 隨本專案程式；無採樣、無外部音檔、無人聲克隆。是合成提示，不宣稱寫實錄音 |
| Fusion Pixel Font 12px zh_hant，2026.10.25 | TakWolf 與上游作者；https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.10.25 | SIL OFL 1.1，保留 `Game/public/fonts/LICENSE-OFL` 及完整 LICENSES 子目錄；上游工具另有 MIT |
| Phaser 3.90.0 | Phaser Studio／貢獻者；https://github.com/phaserjs/phaser/tree/v3.90.0 | MIT，隨 npm 發行之 LICENSE；建置包附 THIRD-PARTY-NOTICES.md |
| 劇情與設計 | 團隊提供《黃燈之後》及 2026-11-03 最終確認規格 | 團隊共同權利尚須全體作者確認；這不是商用權利法律認證 |

所有實際檔案、大小、SHA256、作者及來源見 `docs/asset-manifest.json`。圖像不透明實際用色由檢查器計算；18 色為允許色板。透明度只允許 0／255。字體的抗鋸齒與 HTML 介面合成另行對待，不假稱整個瀏覽器截圖只有 18 色。

沒有使用、描摹或擷取參考遊戲的角色、圖示、地圖、UI、字型或畫面；使用者參考截圖未被讀入繪製工具。未使用來源不明的外部素材。本次沒有安裝 Aseprite，以可重建的像素命令及 PNG 作為編輯來源；不假稱提供了 .aseprite 原稿。
