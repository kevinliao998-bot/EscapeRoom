const { test } = require('node:test');
const assert = require('node:assert/strict');
const story = require('../story.json');
const puzzles = require('../puzzles.json');
const clues = require('../clues.json');
const hints = require('../hints.json');
const answers = require('../answers.json');
const logic = require('../logic.json');

const ids = (rows) => rows.map((row) => row.id);

test('故事基本設定符合完整劇本與五個遊戲區域', () => {
  assert.equal(story.title, '黃燈之後');
  assert.deepEqual(story.metadata.rooms.map((room) => room.id), [
    'corridor', 'stairs', 'office', 'archive', 'platform'
  ]);
  assert.deepEqual(story.metadata.endings.map((ending) => ending.id), ['leave', 'stay']);
  assert.ok(story.metadata.playtimeMinutes.min >= 25);
  assert.ok(story.metadata.playtimeMinutes.max <= 40);
});

test('四組謎題使用唯一識別碼，且線索與答案皆存在', () => {
  const puzzleIds = ids(puzzles);
  assert.equal(new Set(puzzleIds).size, puzzleIds.length);
  assert.deepEqual(puzzleIds, ['corridor-trace', 'office-signal', 'archive-records', 'platform-route']);
  const clueIds = new Set(ids(clues));
  const answerIds = new Set(ids(answers));
  for (const puzzle of puzzles) {
    assert.ok(puzzle.clueIds.length > 0, puzzle.id);
    for (const clueId of puzzle.clueIds) assert.ok(clueIds.has(clueId), clueId);
    assert.ok(answerIds.has(puzzle.answerId), puzzle.answerId);
  }
});

test('每組謎題均有依序排列的三階提示', () => {
  assert.deepEqual(hints.map((entry) => entry.puzzleId), ids(puzzles));
  for (const entry of hints) {
    assert.deepEqual(entry.tiers.map((hint) => hint.level), [1, 2, 3], entry.puzzleId);
    assert.ok(entry.tiers.every((hint) => hint.text.trim().length > 0), entry.puzzleId);
  }
});

test('每個答案都能由至少一項可重看的線索支持', () => {
  const clueIds = new Set(ids(clues));
  for (const answer of answers) {
    assert.ok(answer.accepted.length > 0, answer.id);
    assert.ok(answer.evidenceIds.length > 0, answer.id);
    for (const clueId of answer.evidenceIds) assert.ok(clueIds.has(clueId), clueId);
  }
});

test('故事流程依序連接區域，並呈現兩個不同且有依據的結局', () => {
  assert.deepEqual(logic.roomOrder, ['corridor', 'stairs', 'office', 'archive', 'platform']);
  assert.deepEqual(logic.endings.map((ending) => ending.id), ['leave', 'stay']);
  for (const ending of logic.endings) {
    assert.ok(ending.requiredEvidence.length > 0, ending.id);
    assert.ok(ending.consequence.trim().length > 0, ending.id);
  }
  assert.match(logic.endings.find((ending) => ending.id === 'stay').consequence, /不能證明|無法證明/);
});

test('音序與檔案答案一致，且音訊均有非音訊線索', () => {
  const sound = answers.find((answer) => answer.id === 'signal-order');
  assert.deepEqual(sound.accepted, [['long', 'short', 'double-short']]);
  assert.equal(clues.find((clue) => clue.id === 'signal-mark').accessibleAlternative, true);
  const archive = answers.find((answer) => answer.id === 'archive-crosscheck');
  assert.deepEqual(archive.accepted, [{ time: '01:17', route: 'M0' }]);
});
