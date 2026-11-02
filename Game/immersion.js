/* 情境 UI 控制器：物件調查、Pointer Events 拖放、手帳與環境動態。 */
(function(root){
 'use strict';
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const svg=body=>`<svg viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;
 const icons={
  pry:svg('<path d="M10 34L34 10L40 12L16 38L8 39Z" fill="#96999f" stroke="#e1dace"/><path d="M15 33L35 13" stroke="#54565b" stroke-width="2"/>'),
  badge:svg('<rect x="9" y="12" width="30" height="26" rx="3" fill="#b4a17f" stroke="#e3d3b7"/><path d="M19 12V7H29V12" stroke="#d5c5a9" stroke-width="3"/><circle cx="18" cy="24" r="4" fill="#655a49"/><path d="M25 21H33M25 27H33M14 33H33" stroke="#665b4a"/>'),
  film:svg('<path d="M10 7H38V41H10Z" fill="#ccc0a233" stroke="#ded3be"/><path d="M21 7L24 12L27 7M14 34L21 23L29 27L35 17" stroke="#cbb18b" stroke-width="2"/><circle cx="21" cy="23" r="2" fill="#ead9b6"/>'),
  battery:svg('<rect x="14" y="9" width="21" height="32" rx="3" fill="#898d95" stroke="#d1d1cf"/><path d="M20 9V5H29V9" stroke="#d5c5a9" stroke-width="3"/><path d="M15 16H34V25H15Z" fill="#b9a37e"/><path d="M22 19H28M25 16V22M22 33H28" stroke="#37393c"/>')
 };
 const magnify='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="M14 14L20 20"/></svg>';
 const hand='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12V7Q7 4 9 6V11V4Q11 2 12 5V11V5Q14 3 15 6V12V8Q18 6 18 10V16Q16 21 11 20L6 15Q2 11 5 11Z"/></svg>';
 function create({model:M,content:C,getState,getScreen,onSelect,onUse,onCancel,toast}){
  const $=id=>document.getElementById(id),scene=$('scene'),hotspots=$('hotspots'),inspection=$('scene-inspection'),ghost=$('item-cursor'),inventory=$('inventory-items');
  let entryFocus=null,pointer={x:-100,y:-100,type:'mouse'},raf=0,drag=null,suppressUntil=0,pins=[];
  try{pins=JSON.parse(localStorage.getItem('yellow-light-journal-v1')||'[]');}catch{}
  function itemIcon(id){return icons[id]||'';}
  function renderHotspots(s){
   hotspots.innerHTML=M.describe(s.room,s).map(h=>`<button class="hotspot scene-object kind-${h.kind} material-${h.material}" style="--x:${h.x}%;--y:${h.y}%;--w:${h.w}%;--h:${h.h}%;--tilt:${h.tilt}deg" data-hotspot="${h.id}" ${M.targetFor(h.id)?`data-drop-target="${h.id}"`:''} aria-label="${esc(h.label)}"><span class="object-aura" aria-hidden="true"></span><span class="object-mark" aria-hidden="true">${h.kind==='inspect'?magnify:h.kind==='collect'?hand:'<span class="interaction-dot"></span>'}</span></button>`).join('');
  }
  function ghostPosition(){
   const s=getState(),show=s.selected&&getScreen()==='game'&&!$('modal').open&&inspection.hidden&&pointer.type==='mouse'&&pointer.x>=0;
   ghost.hidden=!show&&!drag?.active;
   if(!ghost.hidden){ghost.innerHTML=itemIcon(s.selected);ghost.style.transform=`translate(${pointer.x+16}px,${pointer.y+13}px)`;}
  }
  function highlight(){
   raf=0;const s=getState();
   for(const b of hotspots.querySelectorAll('[data-hotspot]')){
    const r=b.getBoundingClientRect(),dx=Math.max(r.left-pointer.x,0,pointer.x-r.right),dy=Math.max(r.top-pointer.y,0,pointer.y-r.bottom);
    b.classList.toggle('is-near',pointer.type==='mouse'&&Math.hypot(dx,dy)<40);
    b.classList.toggle('drop-ready',!!s.selected&&M.canDrop(s,s.selected,b.dataset.hotspot));
   }
   ghostPosition();
  }
  function sync(s,previous=null){
   scene.classList.toggle('is-carrying',!!s.selected);
   for(const b of inventory.querySelectorAll('[data-item]')){
    b.setAttribute('aria-pressed',String(b.dataset.item===s.selected));
    if(previous&&s.inventory.includes(b.dataset.item)&&!previous.includes(b.dataset.item))b.classList.add('item-acquired');
   }
   $('selected-description').textContent=s.selected?`${C.items[s.selected].name}已選取。可拖到合適物件，或直接點擊目標。`:'選取物品後，可拖到場景中使用。';
   highlight();
  }
  document.addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY,type:e.pointerType};if(!raf)raf=requestAnimationFrame(highlight);},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer.x=-100;pointer.y=-100;ghostPosition();}});
  function detailArt(id,s){
   const frame=C.snapshots[s.loop];
   if(id==='sign')return `<div class="station-plaque"><span>第零層 / 月台方向</span><strong>${esc(frame.sign)}</strong><i aria-hidden="true"></i></div>`;
   if(id==='clock'){
    const [h,m]=frame.clock.split(':').map(Number);
    return `<div class="inspection-clock"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="76" fill="#272a30" stroke="#bdb6a8" stroke-width="3"/><circle cx="90" cy="90" r="66" fill="#cbc7bc"/>${Array.from({length:12},(_,i)=>`<path d="M90 30V36" stroke="#626169" transform="rotate(${i*30} 90 90)"/>`).join('')}<path d="M90 90V53" stroke="#31343a" stroke-width="5" stroke-linecap="round" transform="rotate(${h*30+m/2} 90 90)"/><path d="M90 90V37" stroke="#31343a" stroke-width="3" stroke-linecap="round" transform="rotate(${m*6} 90 90)"/><circle cx="90" cy="90" r="4" fill="#806e54"/></svg><strong>${esc(frame.clock)}</strong></div>`;
   }
   if(id==='puddle')return `<div class="inspection-water" aria-hidden="true"><span class="water-ring ring-one"></span><span class="water-ring ring-two"></span>${s.loop===3?'<i class="shoe-print print-one"></i><i class="shoe-print print-two"></i>':''}</div>`;
   return '';
  }
  function inspect(id,n,s){
   const h=M.describe(s.room,s).find(x=>x.id===id);if(!h)return;
   entryFocus=document.activeElement;inspection.hidden=false;hotspots.inert=true;scene.classList.add('is-inspecting');scene.style.setProperty('--focus-point',`${h.x}% ${h.y}%`);
   const material=h.material==='paper'?'paper':h.material==='water'?'water':'metal';
   $('inspection-content').innerHTML=`<article class="inspection-surface inspect-${material}"><button id="inspection-close" class="inspection-close" aria-label="結束調查，回到場景">×</button>${material==='paper'?'<span class="paper-tape" aria-hidden="true"></span>':''}<p class="inspection-overline">${material==='paper'?'第零層 · 現場紀錄':'近距離觀察'}</p>${detailArt(id,s)}<h2 id="inspection-title">${esc(id==='sticker'?'維修備註':n.title)}</h2><div class="inspection-writing">${esc(n.text)}</div><p class="inspection-saved"><span aria-hidden="true">⌁</span> 已抄錄至調查手帳</p></article>`;
   $('inspection-close').addEventListener('click',e=>{e.stopPropagation();closeInspection();});$('inspection-close').focus({preventScroll:true});ghost.hidden=true;
  }
  function closeInspection(refocus=true){
   if(inspection.hidden)return;inspection.hidden=true;hotspots.inert=false;scene.classList.remove('is-inspecting');$('inspection-content').replaceChildren();
   if(refocus){if(entryFocus&&document.contains(entryFocus))entryFocus.focus({preventScroll:true});else $('room-name').focus({preventScroll:true});}
  }
  inspection.addEventListener('click',e=>{if(e.target===inspection)closeInspection();});
  document.addEventListener('keydown',e=>{
   if(e.key!=='Escape'||$('modal').open)return;
   if(!inspection.hidden){e.preventDefault();closeInspection();}else if(getState().selected){e.preventDefault();onCancel();}
  });
  function endDrag(){if(drag){try{if(inventory.hasPointerCapture(drag.pointer))inventory.releasePointerCapture(drag.pointer);}catch{}}drag=null;document.body.classList.remove('dragging-item');for(const b of hotspots.querySelectorAll('.drop-over'))b.classList.remove('drop-over');ghostPosition();}
  inventory.addEventListener('pointerdown',e=>{
   const b=e.target.closest('.item');if(!b||e.button!==0)return;
   drag={item:b.dataset.item,x:e.clientX,y:e.clientY,pointer:e.pointerId,active:false};
  });
  document.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.pointer)return;
   pointer={x:e.clientX,y:e.clientY,type:e.pointerType};
   if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){drag.active=true;inventory.setPointerCapture(e.pointerId);onSelect(drag.item);document.body.classList.add('dragging-item');}
   if(!drag.active)return;e.preventDefault();ghost.hidden=false;ghost.innerHTML=itemIcon(drag.item);ghost.style.transform=`translate(${e.clientX+16}px,${e.clientY+13}px)`;
   const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-target]');
   for(const b of hotspots.querySelectorAll('[data-drop-target]'))b.classList.toggle('drop-over',b===over&&M.canDrop(getState(),drag.item,b.dataset.dropTarget));
  });
  document.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.pointer)return;
   const d=drag,active=d.active,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop-target]');
   if(active){suppressUntil=performance.now()+350;e.preventDefault();endDrag();if(target)onUse(d.item,target.dataset.dropTarget);else toast('物品仍保留在背包。可拖到合適的設備，或按 Escape 收回。');}else endDrag();
  });
  inventory.addEventListener('pointercancel',endDrag);inventory.addEventListener('lostpointercapture',()=>{if(drag)endDrag();});
  $('app').addEventListener('click',e=>{if(e.detail>0&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  function journal(ids,active,noteData){
   pins=M.cleanPins(pins,ids);const n=active?noteData(active):null,index=ids.indexOf(active);
   return `<div class="journal-book"><div class="journal-binding" aria-hidden="true"></div><nav class="journal-index" aria-label="手帳分頁"><p>林澄 / 調查手帳</p>${ids.map((id,i)=>`<button data-journal-note="${id}" aria-current="${id===active?'page':'false'}"><small>${String(i+1).padStart(2,'0')}</small><span>${esc(noteData(id).title)}</span>${pins.includes(id)?'<i aria-label="已固定">⌁</i>':''}</button>`).join('')}</nav><article class="journal-sheet"><p class="journal-date">第零層 / 現場筆記 ${index>=0?String(index+1).padStart(2,'0'):''}</p><h3 tabindex="-1">${esc(n?n.title:'還沒翻開的第一頁')}</h3><p class="journal-transcript">${esc(n?n.text:'開始探索後，找到的線索會留在這裡。把需要比較的紀錄固定到下方對照頁。')}</p>${n?`<button class="journal-pin" data-pin-note="${active}" aria-pressed="${pins.includes(active)}">${pins.includes(active)?'從對照頁取下':'固定到線索對照頁'}</button>`:''}<p class="journal-margin">記下看見的。<br>再決定相信什麼。</p></article></div><section class="clue-desk" aria-label="線索對照頁"><div class="clue-desk-heading"><h3>線索對照頁</h3><span>${pins.length} / 3</span></div>${pins.length?`<div class="pinned-clues">${pins.map(id=>{const v=noteData(id);return `<article class="pinned-clue"><span class="clue-pin" aria-hidden="true"></span><h4>${esc(v.title)}</h4><p>${esc(v.text)}</p><button data-journal-note="${id}">重讀原紀錄</button></article>`;}).join('')}</div>`:'<p class="journal-empty">選一筆已取得的紀錄，釘在這裡，讓關鍵線索並排。</p>'}</section>`;
  }
  function togglePin(id,ids){
   pins=M.cleanPins(pins,ids);if(pins.includes(id))pins=pins.filter(x=>x!==id);else if(ids.includes(id)&&pins.length<3)pins.push(id);else{return '對照頁最多固定三筆。先取下一筆，再放入新的線索。';}
   try{localStorage.setItem('yellow-light-journal-v1',JSON.stringify(pins));}catch{toast('對照頁暫時只能保留在本次遊玩中。');}
   root.YellowAudio.play('paper');
  }
  function reset(){pins=[];try{localStorage.removeItem('yellow-light-journal-v1');}catch{}closeInspection(false);endDrag();}
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(document.hidden){endDrag();ghost.hidden=true;}});
  return {renderHotspots,sync,inspect,closeInspection,itemIcon,journal,togglePin,reset,hideCursor:()=>{ghost.hidden=true;},inspectionOpen:()=>!inspection.hidden};
 }
 root.YellowImmersion={create};
})(globalThis);
