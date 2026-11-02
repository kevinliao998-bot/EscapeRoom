const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const act = (s, type, data = {}) => core.dispatch(s, { type, ...data });
function progress(until = 'route') {
  let s = act(core.createState(), 'start').state;
  const run = (type, data) => { const r = act(s, type, data); assert.equal(r.ok, true, r.message); s = r.state; };
  for (let i = 0; i < 3; i++) run('advance');
  run('trace', { answer: 'physical' });
  run('navigate', { room: 'stairs' });
  run('collect', { item: 'pry' }); run('collect', { item: 'badge' });
  run('navigate', { room: 'corridor' }); run('navigate', { room: 'office' });
  if (until === 'office') return s;
  run('use', { item: 'pry', target: 'panel' }); run('power');
  run('sound', { sequence: ['long', 'short', 'double'] });
  run('navigate', { room: 'archive' });
  if (until === 'archive') return s;
  run('archive', { time: '01:17', line: 'M0' });
  run('navigate', { room: 'platform' });
  if (until === 'platform') return s;
  run('use', { item: 'film', target: 'map' });
  for (let i = 0; i < 3; i++) run('rotate');
  run('use', { item: 'badge', target: 'map' });
  run('use', { item: 'battery', target: 'map' });
  if (until === 'routeReady') return s;
  for (const node of ['junction', 'maintenance', 'exit']) run('route', { node });
  return s;
}

test('MW01：開始遊戲具有明確狀態', () => {
  const s = act(core.createState(), 'start').state;
  assert.equal(s.started, true); assert.equal(s.room, 'corridor');
});
test('MW02：三次繞行紀錄與上限', () => {
  let s = act(core.createState(), 'start').state;
  for (let i = 0; i < 8; i++) s = act(s, 'advance').state;
  assert.equal(s.loop, 3); assert.ok(s.notes.includes('memory3'));
});
test('MW03：不能跳過門鎖與走廊推論', () => {
  const s = act(core.createState(), 'start').state;
  for (const room of ['stairs', 'office', 'archive', 'platform']) assert.equal(act(s, 'navigate', { room }).ok, false);
  assert.equal(act(s, 'trace', { answer: 'physical' }).ok, false);
});
test('MW02：錯誤判讀不給通行，沒有進度損失', () => {
  let s = act(core.createState(), 'start').state;
  for (let i=0; i<3; i++) s = act(s, 'advance').state;
  const r = act(s, 'trace', { answer: 'clock' });
  assert.equal(r.ok, false); assert.equal(r.state.loop, 3); assert.equal(r.state.flags.trusted, false);
});
test('MW03：錯誤房間不能取得道具', () => {
  const s = act(core.createState(), 'start').state;
  assert.equal(act(s, 'collect', { item: 'pry' }).ok, false);
});
test('MW03：道具不能重複領取', () => {
  let s = progress('office'); s = act(s, 'navigate', { room: 'corridor' }).state;
  s = act(s, 'navigate', { room: 'stairs' }).state;
  s = act(s, 'collect', { item: 'badge' }).state;
  assert.equal(s.inventory.filter(x => x === 'badge').length, 1);
});
test('MW04：供電需要先開檢修盒', () => {
  const s = progress('office'); assert.equal(act(s, 'power').ok, false);
  assert.equal(act(s, 'sound', { sequence: ['long','short','double'] }).ok, false);
});
test('MW04：錯用道具不消耗物品', () => {
  const s = progress('office'); const r = act(s, 'use', { item:'badge', target:'panel' });
  assert.equal(r.ok,false); assert.deepEqual(r.state.inventory,s.inventory);
});
test('MW05：錯誤音序可重試並保留電力', () => {
  let s = progress('office'); s = act(s,'use',{item:'pry',target:'panel'}).state; s=act(s,'power').state;
  let r=act(s,'sound',{sequence:['short','long','double']}); assert.equal(r.ok,false); assert.equal(r.state.flags.power,true);
  r=act(r.state,'sound',{sequence:['long','short','double']}); assert.equal(r.ok,true); assert.equal(r.state.flags.broadcast,true);
});
test('MW06：交叉比對的兩個條件皆需正確', () => {
  const s=progress('archive');
  assert.equal(act(s,'archive',{time:'01:07',line:'M0'}).ok,false);
  assert.equal(act(s,'archive',{time:'01:17',line:'A1'}).ok,false);
  assert.equal(act(s,'archive',{time:'01:17',line:'M0'}).ok,true);
});
test('MW06：反覆比對不重複給路線片或電池', () => {
  let s=progress('archive'); for(let i=0;i<4;i++) s=act(s,'archive',{time:'01:17',line:'M0'}).state;
  assert.equal(s.inventory.filter(x=>x==='film').length,1); assert.equal(s.inventory.filter(x=>x==='battery').length,1);
});
test('MW07：未裝配不能走路線', () => { const s=progress('platform'); assert.equal(act(s,'route',{node:'junction'}).ok,false); });
test('MW07：錯誤角度能鬆開名牌再調整', () => {
  let s=progress('platform'); s=act(s,'use',{item:'film',target:'map'}).state;
  s=act(s,'use',{item:'badge',target:'map'}).state; s=act(s,'use',{item:'battery',target:'map'}).state;
  assert.equal(act(s,'route',{node:'junction'}).ok,false);
  assert.equal(act(s,'rotate').ok,false);
  s=act(s,'unfix').state; assert.ok(s.inventory.includes('badge'));
  for(let i=0;i<3;i++) s=act(s,'rotate').state;
  s=act(s,'use',{item:'badge',target:'map'}).state;
  assert.equal(act(s,'route',{node:'junction'}).ok,true);
});
test('MW07：不能跳到出口或未供電支線', () => {
  let s=progress('routeReady'); s=act(s,'resetRoute').state;
  assert.equal(act(s,'route',{node:'exit'}).ok,false);
  assert.equal(act(s,'route',{node:'echo'}).ok,false);
});
test('MW08：不能提前選結局', () => { const s=progress('platform'); assert.equal(act(s,'finish',{ending:'leave'}).ok,false); });
for(const ending of ['leave','stay']) test(`MW08：完整流程可到達 ${ending} 結局`,()=>{
  const s=progress(); const r=act(s,'finish',{ending}); assert.equal(r.ok,true); assert.equal(r.state.ending,ending);
  assert.equal(act(r.state,'navigate',{room:'archive'}).ok,false);
});
test('MW09：有效存檔包含物品、房間及進度',()=>{
  const s=progress('platform'); assert.deepEqual(core.restore(core.serialize(s)),s);
});
test('MW09：損壞資料、舊版與不明來源不能載入',()=>{
  assert.equal(core.restore('{'),null); assert.equal(core.restore('{}'),null);
  const s=progress('office'); s.version=99; assert.equal(core.restore(JSON.stringify(s)),null);
  s.version=1; s.source='other'; assert.equal(core.restore(JSON.stringify(s)),null);
});
test('MW09：矛盾的通關存檔與非法房間被拒絕',()=>{
  let s=act(core.createState(),'start').state; s.ending='leave'; assert.equal(core.restore(JSON.stringify(s)),null);
  s=progress('office'); s.room='root'; assert.equal(core.restore(JSON.stringify(s)),null);
});
test('MW09：重複物品、負時間、型別錯誤被拒絕',()=>{
  let s=progress('office'); s.inventory.push('badge'); assert.equal(core.restore(JSON.stringify(s)),null);
  s=progress('office'); s.elapsed=-1; assert.equal(core.restore(JSON.stringify(s)),null);
  s=progress('office'); s.flags.power='yes'; assert.equal(core.restore(JSON.stringify(s)),null);
});
test('MW09：輸出存檔不帶入原型污染或額外欄位',()=>{
  const s=progress('office'); const raw=core.serialize(s).replace('"version":1','"__proto__":{"polluted":true},"extra":123,"version":1');
  const restored=core.restore(raw); assert.ok(restored); assert.equal(Object.hasOwn(restored,'extra'),false); assert.equal({}.polluted,undefined);
});
test('MW10：計時只接受正確秒數；重新開始清空狀態',()=>{
  const s=progress('platform'); let r=act(s,'tick',{seconds:10}); assert.equal(r.state.elapsed,10);
  assert.equal(act(s,'tick',{seconds:-1}).ok,false);
  r=act(r.state,'reset'); assert.equal(r.state.elapsed,0); assert.deepEqual(r.state.inventory,[]); assert.equal(r.state.room,'corridor');
});
test('MW12：提示有上限且不自動解題',()=>{
  let s=progress('office'); for(let i=0;i<10;i++) s=act(s,'hint',{puzzle:'sound'}).state;
  assert.equal(s.hints.sound,3); assert.equal(s.flags.broadcast,false);
});
test('MW04：核心不修改呼叫者狀態，拒絕不明動作',()=>{
  const s=progress('office'); const snapshot=structuredClone(s); act(s,'use',{item:'pry',target:'panel'});
  assert.deepEqual(s,snapshot); assert.equal(act(s,'unknown').ok,false);
});
