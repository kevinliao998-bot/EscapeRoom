const {test}=require('node:test');
const assert=require('node:assert/strict');
const I=require('../interaction-model.js');
const Core=require('../core.js');
require('../content.js');
const C=globalThis.YellowContent;
const fresh=()=>Core.dispatch(Core.createState(),{type:'start'}).state;

test('探索：尚未開放的出口不提供互動光點',()=>{
 const s=fresh();
 assert.equal(I.describe('corridor',s).some(x=>x.id==='stairs'),false);
 s.flags.trusted=true;
 assert.equal(I.describe('corridor',s).some(x=>x.id==='stairs'),true);
 assert.equal(I.describe('platform',s).some(x=>x.id==='exit'),false);
 s.flags.route=true;
 assert.equal(I.describe('platform',s).some(x=>x.id==='exit'),true);
});
test('探索：收走的物品不留下可拾取範圍',()=>{
 const s=fresh();s.flags.trusted=true;
 assert.equal(I.describe('stairs',s).filter(x=>x.kind==='collect').length,2);
 s.flags.pry=true;s.flags.badge=true;
 assert.equal(I.describe('stairs',s).filter(x=>x.kind==='collect').length,0);
});
test('探索：每個有效範圍皆有名稱且位於 2D 畫面內',()=>{
 const s=fresh();Object.keys(s.flags).forEach(k=>s.flags[k]=true);
 let count=0;
 for(const room of Core.ROOMS)for(const h of I.describe(room,s)){
  count++;assert.ok(h.label.length>0);
  for(const n of ['x','y','w','h'])assert.ok(Number.isFinite(h[n]),n);
  assert.ok(h.x>=0&&h.x<=100&&h.y>=0&&h.y<=100);
  assert.ok(h.w>0&&h.h>0);
 }
 assert.ok(count>=12);
});
test('拖放：只提示已攜帶且符合前提的機關位置',()=>{
 const s=fresh();s.room='office';s.inventory=['pry','badge'];
 assert.equal(I.targetFor('panel'),'panel');
 assert.equal(I.canDrop(s,'pry','panel'),true);
 assert.equal(I.canDrop(s,'badge','panel'),false);
 assert.equal(I.canDrop(s,'pry','clock'),false);
 s.room='platform';s.flags.archive=true;s.inventory=['film','badge','battery'];
 assert.equal(I.canDrop(s,'badge','map'),false);
 s.flags.filmMounted=true;
 assert.equal(I.canDrop(s,'badge','map'),true);
 s.inventory=[];
 assert.equal(I.canDrop(s,'battery','map'),false);
});
test('調查：水漬與站牌只記錄目前能看見的內容',()=>{
 const s=fresh();
 assert.ok(!I.observation('puddle',s,C).text.includes('維修靴'));
 assert.ok(I.observation('sign',s,C).text.includes('北澤 →'));
 s.loop=3;
 assert.ok(I.observation('puddle',s,C).text.includes('鞋印'));
 assert.ok(I.observation('sign',s,C).text.includes('北澤 ←'));
});
test('手帳：固定線索去重、限制三筆，不能夾入尚未取得的紀錄',()=>{
 assert.deepEqual(I.cleanPins(['message','message','facts','sticker','clock','sign'],['message','sticker','clock','sign']),['message','sticker','clock']);
 assert.deepEqual(I.cleanPins(null,['message']),[]);
});
test('材質：紙張、機械、水面有可分辨的音效事件',()=>{
 assert.equal(I.cueFor('sticker'),'paper');
 assert.equal(I.cueFor('panel'),'metal');
 assert.equal(I.cueFor('puddle'),'water');
 assert.equal(I.cueFor('not-a-clue'),null);
});
