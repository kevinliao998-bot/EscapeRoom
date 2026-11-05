"""盲測結束後才使用；提供桌機實際下載檔，供手機匯入／結局畫面複驗。"""
from pathlib import Path
import hashlib
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
dist = root / 'dist-campaign.local'
assert (dist / 'index.html').is_file(), '先完成四層正式建置'
out = dist / 'qa-import'
out.mkdir(exist_ok=True)
files = []
for name in ['b2-download.json', 'end-download.json']:
    raw = (root / 'Tests/evidence/2026-11-05-campaign' / name).read_bytes()
    (out / name).write_bytes(raw)
    files.append({'name': name, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
(out / 'index.html').write_text('''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>四層版手機驗收下載</title><style>body{font:20px/1.7 sans-serif;max-width:36em;margin:2em auto;padding:0 1em}a{display:block;padding:1em;margin:1em 0;border:2px solid #333}strong{color:#802020}</style><h1>四層版手機驗收下載</h1><p><strong>首次盲測結束後才使用。</strong>這些是 TI 桌機真正下載的進度檔，僅用於裝置複驗，匯入後不計作玩家自行通關。</p><p>請先在遊戲設定匯出手機目前進度，保留這次盲測；再下載下列檔案，回遊戲設定匯入。</p><a href="end-download.json" download="TI-end-test.json">下載通關畫面測試檔（TI-end-test.json）</a><a href="b2-download.json" download="TI-b2-test.json">下載 B2 複驗檔（TI-b2-test.json）</a><a href="../index.html">回到四層遊戲</a></html>''', encoding='utf-8')
print(json.dumps({'scope': '只供區域網路手機複驗；不納入正式網站與盲測通關', 'files': files}, ensure_ascii=False))
