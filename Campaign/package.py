"""封裝已建置的純前端包體，不包含使用者存檔或 node_modules。"""
from pathlib import Path
import argparse,json,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);args=parser.parse_args()
dist=root/'dist-campaign.local'
assert (dist/'index.html').exists(),'先執行 Campaign 正式建置'
files={p.relative_to(dist).as_posix():p.read_bytes() for p in dist.rglob('*') if p.is_file()}
for name in ['play.mjs','Credits.md','CHANGELOG.md','Continuity.md','Verify.md','flow.mmd','asset-manifest.json','REVIEW.md','test-results.txt','build-results.txt','original-build.txt','source-integrity.txt','visual-results.txt','browser-check.json','package-smoke.json','b2-splice.png','b3-exit.png','b3-scene.png','farewell.png','end-overlay-before.png']:
 files[name]=(root/'Campaign'/name).read_bytes()
for p in sorted((root/'Campaign').glob('issues-16-17-*')):
 if p.is_file():files[p.name]=p.read_bytes()
files['README.md']='''# 黃燈之後 · 四層整合候選版

解壓到獨立資料夾，在該資料夾執行 `node play.mjs`（Node 18+，不需 npm 安裝），開啟 http://127.0.0.1:4176/ 。也可用 `python3 -m http.server 4176 --bind 127.0.0.1`。若該埠已占用，先關閉舊伺服器或改埠。勿直接雙擊 HTML 以 file 協定執行。

操作：WASD／方向鍵行走，E 調查，點擊自動走近；Tab／Shift+Tab、Enter、Escape。地下房間可用上一室、下一室與樓層通道。沒有倒數，錯誤可重試。設定含大字、減少動態、字幕與分項音量。首次請從第零層開始。

整合進度只在此瀏覽器與網址的 localStorage；換埠或換瀏覽器不會自動帶入。地下設定可匯出／匯入 JSON 副本；序章可匯出並自動續讀。不要把個人存檔加入團隊 GitHub。原版及 B1 試玩存檔鍵分開。

原始碼與重跑指令：https://github.com/kevinliao998-bot/EscapeRoom/tree/mw/multifloor-campaign/Campaign
基準 main@20261ff，B1@4b00c65，劇情 HUAM@46f8951。此包體是 MW 提交 TI／小雪複驗的候選版，尚非真人盲測或商用認證；詳見來源與更新日誌。

本包包含 Issue #16／#17 定向修復；最新測試與瀏覽器證據見 issues-16-17-review.md、issues-16-17-tests.txt 及 issues-16-17-browser.json。初版 55 項結果保留作歷史對照，修復後本分支為 66 項通過。
'''.encode()
manifest=[{'path':p,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for p,b in sorted(files.items())]
files['PACKAGE-CONTENTS.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as z:
 for p,b in sorted(files.items()):z.writestr(p,b)
with zipfile.ZipFile(args.output) as z:
 assert z.testzip() is None
 for row in manifest:assert hashlib.sha256(z.read(row['path'])).hexdigest()==row['sha256']
print(json.dumps({'path':str(args.output),'files':len(files),'bytes':args.output.stat().st_size,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()},ensure_ascii=False))
