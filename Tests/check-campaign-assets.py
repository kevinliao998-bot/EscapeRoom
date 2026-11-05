"""TI 唯讀複驗；核對 MW 的素材清單，不覆寫原清單。"""
from pathlib import Path
import hashlib
import json
import re
import sys
from fontTools.ttLib import TTFont

sys.stdout.reconfigure(encoding='utf-8')

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'Campaign/asset-manifest.json').read_text(encoding='utf-8'))
palette = {c.upper() for c in json.loads((root / 'Game/public/art/palette.json').read_text(encoding='utf-8'))}
colors = set()
for name in ['world.ts', 'style.css']:
    text = (root / 'Campaign' / name).read_text(encoding='utf-8')
    colors.update('#' + c.upper() for c in re.findall(r'(?:#|0x)([0-9a-fA-F]{6})\b', text))
assert colors <= palette
assert colors == set(manifest['palette'])
def luminance(color):
    values = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    return sum(v * w for v, w in zip(linear, [.2126, .7152, .0722]))
for pair in manifest['contrast']:
    low, high = sorted([luminance(pair['text']), luminance(pair['background'])])
    ratio = (high + .05) / (low + .05)
    assert ratio >= 4.5
    assert abs(ratio - pair['ratio']) < 1e-9
font = TTFont(root / 'Game/public/fonts/fusion-pixel-12px-monospaced-zh_hant.otf.woff2')
text = ''.join(p.read_text(encoding='utf-8') for p in (root / 'Campaign').glob('*.ts'))
text += (root / 'Expansion/proposal.json').read_text(encoding='utf-8')
han = {ord(c) for c in text if '\u3400' <= c <= '\u9fff'}
assert not han - set(font.getBestCmap())
newline_conversions = 0
for asset in manifest['assets']:
    path = (root / asset['path']).resolve()
    assert path.is_relative_to(root / 'Game/public')
    raw = path.read_bytes()
    if len(raw) != asset['bytes'] and (path.suffix.lower() in {'.md', '.txt', '.json', '.svg'} or path.name in {'LICENSE-MIT', 'LICENSE-OFL'}):
        raw = raw.decode('utf-8').replace('\r\n', '\n').encode('utf-8')
        newline_conversions += 1
    assert len(raw) == asset['bytes'], (asset['path'], len(raw), asset['bytes'])
    assert hashlib.sha256(raw).hexdigest() == asset['sha256'], asset['path']
print(json.dumps({'sourceColors': len(colors), 'contrastPairs': len(manifest['contrast']),
                  'hanGlyphs': len(han), 'hashedAssets': len(manifest['assets']),
                  'textNewlineConversions': newline_conversions,
                  'scope': '來源宣告、字形覆蓋及素材雜湊；非所有瀏覽器像素或真人可讀性驗收。'}, ensure_ascii=False))
