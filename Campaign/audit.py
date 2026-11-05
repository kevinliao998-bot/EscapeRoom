"""只讀來源檢查，輸出到 Campaign/asset-manifest.json；不改原版素材清單。"""
from pathlib import Path
import json,re,hashlib
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
palette={c.upper() for c in json.loads((root/'Game/public/art/palette.json').read_text())}
colors=set()
for name in ['world.ts','style.css']:
 text=(root/'Campaign'/name).read_text()
 colors|={'#'+v.upper() for v in re.findall(r'(?:#|0x)([0-9a-fA-F]{6})\b',text)}
assert colors<=palette,colors-palette
assert len(colors)<=32
def luminance(h):
 v=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]
 return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
pairs=[('#E4E1D6','#14191F'),('#E4E1D6','#202B32'),('#E4E1D6','#2B3640'),('#9BB6AA','#2B3640'),('#14191F','#D8C9A0'),('#263F3E','#D8C9A0'),('#E4E1D6','#263F3E'),('#F4F1E7','#45545F')]
contrast=[]
for a,b in pairs:
 l,h=sorted([luminance(a),luminance(b)]);ratio=(h+.05)/(l+.05)
 assert ratio>=4.5,(a,b,ratio)
 contrast.append({'text':a,'background':b,'ratio':ratio})
font=TTFont(root/'Game/public/fonts/fusion-pixel-12px-monospaced-zh_hant.otf.woff2')
text=''.join(p.read_text() for p in (root/'Campaign').glob('*.ts'))+(root/'Expansion/proposal.json').read_text()
han={ord(c) for c in text if '\u3400'<=c<='\u9fff'}
assert not han-set(font.getBestCmap()),''.join(chr(c) for c in han-set(font.getBestCmap()))
assets=[]
for p in sorted((root/'Game/public').rglob('*')):
 if not p.is_file():continue
 assets.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':'原版已附素材；作者及授權見 Credits.md 與原版 docs/asset-manifest.json'})
report={'palette':sorted(colors),'contrast':contrast,'hanGlyphsChecked':len(han),'assets':assets,'originalGeometry':'Campaign/world.ts；專案團隊／Codex 輔助原創幾何，CC0-1.0','sourceScope':'來源色號與宣告配色檢查，不把文字反鋸齒畫面聲稱為純索引色'}
(root/'Campaign/asset-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'Campaign 來源 {len(colors)} 色均在原 18 色內；{len(pairs)} 組文字配色 ≥4.5:1；{len(han)} 個漢字無缺字；{len(assets)} 項素材有雜湊。')
