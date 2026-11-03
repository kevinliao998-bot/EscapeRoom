const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../manifest.json');

test('圖像和音效清單均有項目且素材狀態標記清楚', () => {
  assert.ok(manifest.graphics.length > 0);
  assert.ok(manifest.audio.length > 0);
  for (const asset of [...manifest.graphics, ...manifest.audio]) {
    assert.ok(asset.id && asset.path, '每項素材都需有識別碼及路徑');
    assert.ok(['planned', 'in-review', 'approved'].includes(asset.status), asset.id);
    assert.ok(asset.source && asset.license, asset.id);
  }
});

test('圖像使用指定的極簡色彩規格並具繁體中文替代文字', () => {
  assert.equal(manifest.designTokens.background, '#0c0e11');
  assert.equal(manifest.designTokens.surface, '#15171b');
  assert.equal(manifest.designTokens.ink, '#f1eee8');
  assert.equal(manifest.designTokens.accent, '#cbb18b');
  for (const asset of manifest.graphics) {
    assert.ok(asset.altText && asset.altText.trim().length > 0, asset.id);
    assert.equal(asset.language, 'zh-Hant');
    assert.ok(asset.noFlashing);
  }
});

test('音效有字幕或視覺替代、預設靜音且不含突發驚嚇', () => {
  for (const asset of manifest.audio) {
    assert.ok(asset.visualAlternative && asset.visualAlternative.trim().length > 0, asset.id);
    assert.equal(asset.defaultEnabled, false);
    assert.equal(asset.jumpScare, false);
    assert.ok(asset.licenseStatus, asset.id);
  }
});

test('素材路徑唯一，未核准素材不得標示為已完成', () => {
  const paths = [...manifest.graphics, ...manifest.audio].map((asset) => asset.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const asset of [...manifest.graphics, ...manifest.audio]) {
    if (asset.status !== 'approved') assert.notEqual(asset.completionClaim, true, asset.id);
  }
});
