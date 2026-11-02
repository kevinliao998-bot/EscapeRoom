"""檢查原創貼圖、正文對比、繁體字形及來源雜湊。使用 Pillow、fonttools、brotli。"""
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
import json,hashlib,re
r=Path(__file__).resolve().parents[1];art=r/'Game/public/art';palette=json.loads((art/'palette.json').read_text());allowed={tuple(bytes.fromhex(c[1:])) for c in palette};colors=set()
for p in art.glob('*.png'):
 im=Image.open(p).convert('RGBA');px=set(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata());assert all(a in (0,255) for _,_,_,a in px),p
 used={(rr,g,b) for rr,g,b,a in px if a};assert used<=allowed,(p,used-allowed);colors|=used
assert len(colors)<=32
assert Image.open(art/'lin-cheng.png').size==(64,96)
def luminance(h):
 v=[int(h[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
pairs=[('#E4E1D6','#14191F'),('#E4E1D6','#2B3640'),('#9BB6AA','#2B3640'),('#14191F','#D8C9A0'),('#E4E1D6','#3F5B57'),('#F2A33A','#14191F'),('#14191F','#6E8F86'),('#263F3E','#D8C9A0')]
ratios=[]
for a,b in pairs:
 l1,l2=sorted([luminance(a),luminance(b)]);q=(l2+.05)/(l1+.05);assert q>=4.5,(a,b,q);ratios.append({'text':a,'background':b,'ratio':q})
f=TTFont(r/'Game/public/fonts/fusion-pixel-12px-monospaced-zh_hant.otf.woff2');chars=set(f.getBestCmap());text=''.join(p.read_text() for p in [r/'content/story.json',*list((r/'Game/src').glob('*.ts'))]);han={ord(c) for c in text if '\u3400'<=c<='\u9fff'};missing=han-chars;assert not missing, ''.join(chr(c) for c in missing)
files=[]
for p in sorted((r/'Game/public').rglob('*')):
 if p.is_file():files.append({'path':str(p.relative_to(r)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':'自製像素繪製器 tools/draw_art.py' if '/art/' in str(p) else 'Phaser 3.90.0 / Fusion Pixel 2026.10.25' if p.name=='THIRD-PARTY-NOTICES.md' else 'TakWolf/fusion-pixel-font 2026.10.25','author':'專案團隊／Codex 輔助繪製' if '/art/' in str(p) else 'Phaser Studio Inc.；TakWolf 與上游貢獻者' if p.name=='THIRD-PARTY-NOTICES.md' else 'TakWolf 與上游貢獻者','license':'CC0-1.0' if '/art/' in str(p) else 'MIT' if p.name=='LICENSE-MIT' else 'MIT + SIL-OFL-1.1' if p.name=='THIRD-PARTY-NOTICES.md' else 'SIL-OFL-1.1（詳附完整上游授權）'})
(r/'docs/asset-manifest.json').write_text(json.dumps({'paletteColors':len(colors),'fontHanChecked':len(han),'contrast':ratios,'files':files},ensure_ascii=False,indent=2)+'\n')
print(f'素材實際色數 {len(colors)}；正文配色 {len(pairs)} 組均 ≥4.5；繁體字形 {len(han)} 個無缺字；素材 {len(files)} 項有雜湊。')
