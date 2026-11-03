const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../manifest.json');
const effects = require('../audio/effects.js');

test('圖像和音效清單均有項目且素材狀態標記清楚', () => {
  assert.ok(manifest.graphics.length > 0);
  assert.ok(manifest.audio.length > 0);
  for (const asset of [...manifest.graphics, ...manifest.audio]) {
    assert.ok(asset.id && asset.path, '每項素材都需有識別碼及路徑');
    assert.ok(['planned', 'in-review', 'approved'].includes(asset.status), asset.id);
    assert.ok(asset.source && asset.license, asset.id);
    const assetPath = asset.path.split('#')[0];
    assert.ok(fs.existsSync(path.join(__dirname, '..', assetPath)), assetPath);
  }
});

test('圖像使用指定的極簡色彩規格、繁中替代文字及有效 SVG 文件', () => {
  assert.equal(manifest.designTokens.background, '#0c0e11');
  assert.equal(manifest.designTokens.surface, '#15171b');
  assert.equal(manifest.designTokens.ink, '#f1eee8');
  assert.equal(manifest.designTokens.accent, '#cbb18b');
  for (const asset of manifest.graphics) {
    assert.ok(asset.altText && asset.altText.trim().length > 0, asset.id);
    assert.equal(asset.language, 'zh-Hant');
    assert.ok(asset.noFlashing);
    const svg = fs.readFileSync(path.join(__dirname, '..', asset.path), 'utf8');
    assert.match(svg, /<svg[\s>]/, asset.id);
    assert.match(svg, /<title/, asset.id);
    assert.match(svg, /<desc/, asset.id);
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, asset.id);
  }
});

test('音效原始碼有明確音量上限，且播放須由互動明確呼叫', () => {
  assert.equal(effects.defaultEnabled, false);
  assert.ok(effects.maxGain <= 0.04);
  assert.equal(typeof effects.play, 'function');
  assert.ok(effects.cues.some((cue) => cue.id === 'paper'));
  assert.ok(effects.cues.some((cue) => cue.id === 'metal'));
  for (const asset of manifest.audio) {
    assert.ok(asset.visualAlternative && asset.visualAlternative.trim().length > 0, asset.id);
    assert.equal(asset.defaultEnabled, false);
    assert.equal(asset.jumpScare, false);
    assert.ok(asset.licenseStatus, asset.id);
  }
});

test('素材路徑唯一，未核准素材不得標示為完成', () => {
  const paths = [...manifest.graphics, ...manifest.audio].map((asset) => asset.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const asset of [...manifest.graphics, ...manifest.audio]) {
    if (asset.status !== 'approved') assert.notEqual(asset.completionClaim, true, asset.id);
  }
});
