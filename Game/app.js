(function(){
  'use strict';
  const Core=globalThis.YellowCore,C=globalThis.YellowContent,Audio=globalThis.YellowAudio;
  const $=id=>document.getElementById(id), esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SAVE='yellow-light-save-v1',PREF='yellow-light-preferences-v1';
  let state=Core.createState(),saved=null,screen='title',sequence=[],lastFocus=null,toastTimer=null,storageWarned=false;
  const prefs={large:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,master:.35,ambient:.3,effects:.6};
  try{const v=JSON.parse(localStorage.getItem(PREF)||'null');if(v&&typeof v==='object')for(const k of Object.keys(prefs))if(typeof v[k]===typeof prefs[k]&&(typeof v[k]==='boolean'||Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1))prefs[k]=v[k];}catch{}
  try{const raw=localStorage.getItem(SAVE);if(raw){saved=Core.restore(raw);if(!saved)$('save-notice').textContent='原存檔無法驗證，可以安全開始新的探索。';}}catch{$('save-notice').textContent='此瀏覽器暫時無法儲存，仍可開始遊玩。';storageWarned=true;}
  function preference(){document.documentElement.classList.toggle('large-text',prefs.large);document.body.classList.toggle('reduce-motion',prefs.reduced);Audio.configure(prefs);try{localStorage.setItem(PREF,JSON.stringify(prefs));}catch{}}
  function time(n){return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;}
  function toast(text,error=false){if(!text)return;$('toast').textContent=text;$('toast').classList.toggle('error',error);$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5400);}
  function persist(){
    if(!state.started)return;
    try{localStorage.setItem(SAVE,Core.serialize(state));saved=Core.restore(Core.serialize(state));$('save-state').textContent='進度已儲存';}
    catch{$('save-state').textContent='未能儲存';if(!storageWarned){storageWarned=true;toast('此瀏覽器暫時無法儲存。遊戲仍可繼續，但刷新後可能失去進度。',true);}}
  }
  function run(type,data={},options={}){
    const r=Core.dispatch(state,{type,...data});state=r.state;
    if(r.ok){persist();if(options.render!==false)render();}
    if(options.toast!==false&&r.message)toast(r.message,!r.ok);
    if(options.audio!==false)Audio.play(r.event);
    return r;
  }
  function showModal(title,body,tag='調查紀錄'){
    if(!$('modal').open)lastFocus=document.activeElement;
    $('modal-title').textContent=title;$('modal-tag').textContent=tag;$('modal-body').innerHTML=body;
    if(!$('modal').open)$('modal').showModal();
    $('modal-close').focus();
  }
  function closeModal(){$('modal').close();if(lastFocus&&document.contains(lastFocus))lastFocus.focus();else $('notebook-button').focus();}
  $('modal-close').addEventListener('click',closeModal);
  $('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  $('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
  function noteData(id){if(id.startsWith('memory')){const v=C.snapshots[Number(id.slice(6))];return{title:v.title,tag:'走廊快照',text:`時鐘：${v.clock}\n站牌：${v.sign}\n水漬：${v.trace}\n\n${v.change}`};}return C.notes[id];}
  function openNote(id,back=false){const n=noteData(id);if(!n)return;showModal(n.title,`<div class="prose">${esc(n.text)}</div>${back?'<div class="modal-actions"><button data-modal="notebook">返回筆記清單</button></div>':''}`,n.tag);}
  function notebook(){
    const notes=state.started?state.notes:(saved?saved.notes:[]);
    showModal('調查筆記',notes.length?`<p class="quiet">只收錄已取得的紀錄。點選標題可重新核對。</p><div class="note-list">${notes.map(id=>{const n=noteData(id);return `<button class="note-row" data-note="${id}"><span>${esc(n.title)}</span><small>${esc(n.tag)} ↗</small></button>`;}).join('')}</div>`:'<p class="prose">開始探索後，線索與紀錄會留在這裡。</p>','EVIDENCE / 調查檔案');
  }
  function compare(index=state.loop){
    if(!state.started){toast('開始調查後，就可以比較走廊的紀錄。');return;}
    const snap=C.snapshots[index],view={...state,loop:index};
    showModal('紀錄對照',`<div class="memory-tabs">${C.snapshots.slice(0,state.loop+1).map((m,i)=>`<button data-memory="${i}" aria-pressed="${i===index}">${esc(m.title)}</button>`).join('')}</div><div class="memory-art">${YellowScenes.draw('corridor',view)}</div><div class="memory-details"><div><span>時鐘</span><strong>${esc(snap.clock)}</strong></div><div><span>站牌</span><strong>${esc(snap.sign)}</strong></div><div><span>實體痕跡</span><strong>${esc(snap.trace)}</strong></div></div><p class="prose">${esc(snap.change)}</p>`,'OBSERVATION / 可以重查的痕跡');
  }
  function tracePanel(){
    showModal('哪一項能證明通道真實存在？',`<p class="prose">維修貼紙提醒：「記錄不一致時，以留下實體痕跡的那次為準。」</p><div class="choice-grid"><button data-trace="clock">相信顯示 01:17 的時鐘</button><button data-trace="sign">跟著反轉後的站名牌</button><button data-trace="physical">沿水漬裡的維修靴鞋印前進</button></div><p class="puzzle-feedback" id="panel-feedback" role="status"></p><div class="modal-actions"><button data-modal="compare">回看走廊紀錄</button></div>`,'推理 / 實體痕跡');
  }
  function panelBox(){
    if(state.selected){const r=run('use',{item:state.selected,target:'panel'});if(!r.ok)return;}
    const f=state.flags;
    showModal('備用電源檢修盒',`<p class="prose">${f.boxOpen?'盒蓋已打開。備用電路沒有受損，控制台正等待供電。':'盒蓋卡住，邊緣留有可供撬開的縫隙。需要一片薄而結實的維修工具。'}</p><div class="modal-actions">${!f.boxOpen&&state.inventory.includes('pry')?'<button class="primary" data-operation="pry">使用撬片</button>':''}${f.boxOpen?`<button class="primary" data-operation="power">${f.power?'備用電源已接通':'接通備用電源'}</button>`:''}</div>`,'機關 / 電力');
  }
  const toneNames={long:'長音',short:'短音',double:'雙短音'},toneShapes={long:'━',short:'▪',double:'▪ ▪'};
  function soundPanel(message=''){
    if(!state.flags.power){toast('控制台還沒有供電。先檢查備用電源。',true);return;}
    showModal('音序校準',`<p class="prose">${state.flags.broadcast?'音序已吻合。控制台的訊息與事故檔案可重新查閱。':'維修刻痕與三段測試波形互相對應。將波形依序加入，再核對音序。全程可不開啟聲音。'}</p><div class="tone-options">${['long','short','double'].map(k=>`<button data-tone="${k}"><span class="tone-symbol">${toneShapes[k]}</span>${toneNames[k]}<small>加入音序／試聽</small></button>`).join('')}</div><div class="sequence-tray" aria-label="目前音序">${sequence.length?sequence.map((k,i)=>`<button data-remove-tone="${i}" aria-label="移除第 ${i+1} 段${toneNames[k]}">${i+1}. ${toneNames[k]} ×</button>`).join(''):'<span class="sequence-empty">依線索選入三段波形</span>'}</div><p class="puzzle-feedback" id="panel-feedback" role="status">${esc(message)}</p><div class="modal-actions"><button class="primary" data-operation="check-sound">核對音序</button><button data-operation="clear-sound">清空音序</button><button data-note="soundGuide">查看維修刻痕</button>${state.flags.broadcast?'<button data-note="broadcast">重看求救訊息</button>':''}</div>`,'機關 / 長短波形');
  }
  function archivePanel(message=''){
    showModal('比對事故紀錄',`<p class="prose">事故報告、維修簿與名冊，是否在描述同一個事件？選出能互相印證的兩項結論。</p><div class="modal-actions">${['report','book','roster'].map(id=>`<button data-observe="${id}">${C.notes[id].title}</button>`).join('')}</div><form id="archive-form"><label class="control-label" for="accident-time">共同的事故分鐘</label><select id="accident-time" name="time"><option value="">請選擇時間</option value="01:07">01:07</option><option value="01:17">01:17</option><option value="01:27">01:27</option></select><label class="control-label" for="deleted-line">被刪除的支線</label><select id="deleted-line" name="line"><option value="">請選擇支線</option value="A1">A1 北澤線</option><option value="M0">M0 維修支線</option><option value="Y3">Y3 黃線</option></select><p class="puzzle-feedback" id="panel-feedback" role="status">${esc(message)}</p><div class="modal-actions"><button class="primary" type="submit">確認比對結論</button></div></form>`,'推理 / 交叉比對');
  }
  const nodes=[['entry','入口',12,75],['junction','分岔',40,50],['maintenance','維修',66,50],['exit','出口',86,25],['echo','迴聲',25,25],['north','北澤',83,77]];
  function mapPanel(message=''){
    if(state.selected){const r=run('use',{item:state.selected,target:'map'});if(!r.ok)return;}
    const f=state.flags;
    const assembly=[['filmMounted','路線片'],['overlayFixed','名牌固定'],['batteryInstalled','電池']];
    showModal('月台路線校正',`<div class="route-assembly">${assembly.map(([k,n])=>`<span class="assembly-bit ${f[k]?'ready':''}">${f[k]?'已就位':'尚缺'} · ${n}</span>`).join('')}</div><p class="quiet">廣播：「下一站，北澤。請跟隨黃線。」<br>維修簿卻說：只追蹤仍供電的相鄰節點。</p><div class="map-orientation">定位標記 ▲　${f.filmMounted?`透明片缺口 ${['↑','→','↓','←'][state.rotation/90]}（${state.rotation}°）`:'尚未放上透明片'}</div><div class="route-board"><svg viewBox="0 0 600 330" aria-hidden="true"><path d="M72 248L240 165L396 165L516 83" stroke="${f.batteryInstalled?'#cbb18b':'#525359'}" stroke-width="5" fill="none"/><path d="M240 165L150 83M396 165L498 254" stroke="#4a4c52" stroke-width="4" fill="none"/><g opacity=".25">${[80,160,240,320,400,480,560].map(x=>`<path d="M${x} 0V330" stroke="#77777d"/>`).join('')}</g>${f.filmMounted?`<g transform="rotate(${state.rotation} 300 165)" opacity=".5"><path d="M72 248L240 165L396 165L516 83" stroke="#ddc7a6" stroke-width="16" fill="none"/><path d="M290 12H310L300 26Z" fill="#ddc7a6"/></g>`:''}</svg>${nodes.map(([id,name,x,y])=>{const lit=f.batteryInstalled&&Core.PATH.includes(id);return `<button class="route-node ${lit?'lit':''} ${state.route.includes(id)?'path':''}" style="--x:${x}%;--y:${y}%" data-route="${id}" aria-label="${name}，${lit?'有電':'未供電'}${state.route.includes(id)?'，已連線':''}" ${id==='entry'?'disabled':''}>${name}</button>`;}).join('')}</div><p class="puzzle-feedback" id="panel-feedback" role="status">${esc(message|| (f.route?'維修路線已接通。維修門現在可以開啟。':'由入口開始，點選下一個相鄰的供電節點。'))}</p><div class="modal-actions">${state.inventory.filter(i=>['film','badge','battery'].includes(i)).map(i=>`<button data-map-item="${i}">使用${C.items[i].name}</button>`).join('')}${f.filmMounted&&!f.overlayFixed&&!f.route?'<button data-operation="rotate">旋轉路線片 90°</button>':''}${f.overlayFixed&&!f.route?'<button data-operation="unfix">鬆開名牌</button>':''}${!f.route?'<button data-operation="reset-route">重新連線</button>':'<button class="primary" data-operation="final-choice">前往維修門</button>'}<button data-note="mapGuide">查閱維修規則</button></div>`,'機關 / 相鄰節點');
  }
  function finalChoice(){
    if(!state.flags.route){toast('維修門仍鎖著。先校正月台路線圖。',true);return;}
    showModal('你要相信什麼？',`<p class="prose">廣播再次響起：「我就是林沐。留下來。」\n\n你已確認，系統會拼接乘客留下的聲音；名冊能證明她曾經到過這裡，卻不能證明聲音來自現在。\n\n維修簿的離站程序就在手邊。沒有倒數，你可以重新查看證據後再決定。</p><div class="choice-grid"><button data-ending="leave">依維修簿關閉記憶迴路，帶著證據離開</button><button data-ending="stay">回應廣播中的林沐，留下尋找原始記憶</button></div><div class="modal-actions"><button data-modal="notebook">重新核對調查筆記</button></div>`,'最後處置 / 由你決定');
  }
  function settings(){
    showModal('遊玩設定',`<label class="check-row"><input id="setting-large" type="checkbox" ${prefs.large?'checked':''}>放大介面文字</label><label class="check-row"><input id="setting-reduced" type="checkbox" ${prefs.reduced?'checked':''}>減少轉場與動態效果</label><p class="quiet">字幕與文字替代線索始終可用。聲音是補充，不影響解題。</p>${[['master','主音量'],['ambient','環境音'],['effects','機關音效']].map(([k,n])=>`<label class="control-label" for="volume-${k}">${n}</label><input type="range" id="volume-${k}" data-volume="${k}" min="0" max="100" value="${Math.round(prefs[k]*100)}">`).join('')}<div class="modal-actions"><button data-operation="audio-toggle">${Audio.isEnabled()?'關閉聲音':'開啟聲音'}</button></div>`,'ACCESSIBILITY / 舒適地探索');
  }
  function confirmNew(){showModal('重新開始調查？','<p class="prose">這會取代目前在此瀏覽器的進度，清空已取得的物品、線索與遊玩計時。聲音、字級等設定會保留。</p><div class="modal-actions"><button class="primary" data-operation="confirm-new">確定重新開始</button><button data-operation="cancel">保留進度</button></div>','新的調查');}
  function enterNew(){state=Core.createState();screen='game';run('start',{}, {toast:false});if($('modal').open)closeModal();openNote('message');}
  function goMenu(){persist();screen='title';if($('modal').open)closeModal();render();$('start-button').focus();}
  function resume(){if(!saved){toast('還沒有可繼續的存檔。');return;}state=Core.restore(Core.serialize(saved));screen=state.ending?'ending':'game';render();if(screen==='game')focusScene();}
  function currentPuzzle(){const f=state.flags;return !f.trusted?'trace':!f.power?'power':!f.broadcast?'sound':!f.archive?'archive':'map';}
  function actionButton(label,action,data='',arrow='↗'){return `<button class="action-button" data-action="${action}" ${data}>${label}<span aria-hidden="true">${arrow}</span></button>`;}
  function hotspots(){
    const list={corridor:[['飲水機貼紙','sticker',21,64],['時鐘','clock',46,24],['站名牌','sign',75,25],['地面水漬','puddle',52,82],['安全梯間','stairs',83,58]],stairs:[['撬片','pry',80,63],['維修員名牌','badge',81,76]],office:[['檢修盒','panel',19,52],['備用電源','power',25,69],['維修刻痕','soundGuide',73,45],['廣播控制台','sound',49,57]],archive:[['事故報告','report',31,70],['維修簿','book',50,70],['失聯名冊','roster',66,70]],platform:[['路線圖','map',25,55],['維修門','exit',80,58]]}[state.room];
    $('hotspots').innerHTML=list.filter(([_,id])=>!(id==='pry'&&state.flags.pry||id==='badge'&&state.flags.badge)).map(([label,id,x,y])=>`<button class="hotspot" style="--x:${x}%;--y:${y}%" data-hotspot="${id}">${label}</button>`).join('');
  }
  function renderGame(){
    const room=C.rooms[state.room],f=state.flags;
    $('room-code').textContent=`${room.code} / ${room.label}`;$('room-name').textContent=room.name;$('scene-description').textContent=room.description;
    $('loop-label').textContent=state.room==='corridor'?C.snapshots[state.loop].title:'第零層';$('timer').textContent=time(state.elapsed);
    $('scene-art').innerHTML=YellowScenes.draw(state.room,state);hotspots();
    $('compare-button').hidden=state.loop===0;
    $('inventory-items').innerHTML=state.inventory.length?state.inventory.map(id=>`<button class="item" data-item="${id}" aria-pressed="${state.selected===id}" aria-label="選取${C.items[id].name}"><span aria-hidden="true">${C.items[id].symbol}</span>${C.items[id].name}</button>`).join(''):'<span class="inventory-empty">尚未取得物品</span>';
    $('selected-description').textContent=state.selected?C.items[state.selected].description:'點選物品，再點場景中合適的位置。';
    let objective='',description='',actions='';
    if(state.room==='corridor'){
      objective=f.trusted?'沿著留下的痕跡。':'找到可信的方向。';description=f.trusted?'鞋印帶你找到安全梯間。先收集維修工具，再進入站務室。':'時鐘、站名、地面，哪一項是實際接觸留下的痕跡？每次繞行的紀錄都能重看。';
      actions=actionButton('檢查維修貼紙','note','data-id="sticker"')+actionButton(state.loop<3?'沿走廊繼續前進':'重看繞行紀錄',state.loop<3?'advance':'compare')+actionButton('判讀通行線索','trace');
      if(f.trusted)actions+=actionButton('進入安全梯間','nav','data-room="stairs"')+actionButton('進入站務室','nav','data-room="office"');
    }else if(state.room==='stairs'){
      objective='帶上維修工具。';description='工具箱裡有一片撬片和一枚金屬名牌。它們都能幫助你操作接下來的設備。';
      if(!f.pry)actions+=actionButton('取得撬片','collect','data-item="pry"');if(!f.badge)actions+=actionButton('取得維修員名牌','collect','data-item="badge"');actions+=actionButton('返回迴圈走廊','nav','data-room="corridor"','←');
    }else if(state.room==='office'){
      objective=f.broadcast?'聲音從哪裡來？':f.power?'讓波形彼此吻合。':'先恢復備用電源。';description=f.broadcast?'求救訊息裡有重複的剪接標記。前往檔案室，核對記錄中的人與時間。':f.power?'看維修刻痕，依長短排列三段測試音。聲音關閉也能完成。':'檢修盒卡住了。從背包選取合適工具，再點檢修盒。';
      actions=actionButton('檢查備用電源','panel')+actionButton('查看音序刻痕','note','data-id="soundGuide"')+actionButton('操作廣播控制台','sound');if(f.broadcast)actions+=actionButton('進入檔案室','nav','data-room="archive"');actions+=actionButton('返回迴圈走廊','nav','data-room="corridor"','←');
    }else if(state.room==='archive'){
      objective=f.archive?'把紀錄帶到月台。':'讓三份紀錄說同一件事。';description=f.archive?'你已確認事故分鐘與 M0 支線。帶著透明路線片和電池，找出維修出口。':'報告、維修簿與名冊，各自留下一部分事實。它們能證明什麼，又不能證明什麼？';
      actions=['report','book','roster'].map(id=>actionButton(C.notes[id].title,'note',`data-id="${id}"`)).join('')+actionButton('比對事故紀錄','archive');if(f.archive)actions+=actionButton('前往月台走廊','nav','data-room="platform"');actions+=actionButton('返回站務室','nav','data-room="office"','←');
    }else{
      objective=f.route?'最後一次，由你決定。':'跟著仍亮著的路。';description=f.route?'門已開啟。熟悉的聲音再次出現，但你也帶著足夠的證據。沒有倒數，先想清楚再選。':'路線片需要定位與固定，電池可以恢復指示燈。廣播報出的站名與供電方向不一致。';
      actions=actionButton('查看維修規則','note','data-id="mapGuide"')+actionButton('操作月台路線圖','map')+actionButton('開啟維修門','exit')+actionButton('返回檔案室','nav','data-room="archive"','←');
    }
    $('objective').textContent=objective;$('objective-description').textContent=description;$('room-actions').innerHTML=actions;
    $('stage-count').textContent=`${room.code} / 05`;
    const puzzle=currentPuzzle(),level=state.hints[puzzle]||0;$('hint-level').textContent=level?`${level} / 3`:'';$('hint-text').textContent=level?C.hints[puzzle][level-1]:'';
  }
  function render(){
    if(screen==='game'&&state.ending)screen='ending';
    $('title-screen').hidden=screen!=='title';$('game-screen').hidden=screen!=='game';$('ending-screen').hidden=screen!=='ending';
    $('continue-button').hidden=!saved;$('start-button').firstChild.textContent=saved?'重新開始調查 ':'進入第零層 ';
    $('note-count').textContent=(state.started?state.notes:saved?.notes||[]).length;
    if(screen==='game')renderGame();
    if(screen==='ending'){
      const e=C.endings[state.ending];$('ending-label').textContent=e.label;$('ending-title').textContent=e.title;$('ending-copy').textContent=e.text;$('ending-quote').textContent=e.quote;$('ending-time').textContent='調查時間 '+time(state.elapsed);$('ending-notes').textContent=state.notes.length+' 份調查紀錄';
    }
  }
  function observe(id){const r=run('observe',{id},{toast:false});if(r.ok)openNote(id);}
  function focusScene(){const heading=$('room-name');heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'instant'});}
  function navigate(room){const r=run('navigate',{room},{toast:false});if(r.ok){if($('modal').open)closeModal();focusScene();}else toast(r.message,true);}
  function hotspot(id){
    if(['sticker','clock','sign','puddle','soundGuide','report','book','roster','mapGuide'].includes(id))observe(id);
    else if(id==='stairs')navigate('stairs');else if(id==='pry'||id==='badge')run('collect',{item:id});
    else if(id==='panel')panelBox();else if(id==='power'){if(!state.flags.boxOpen)panelBox();else run('power');}
    else if(id==='sound')soundPanel();else if(id==='map')mapPanel();else if(id==='exit')finalChoice();
  }
  $('app').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.hotspot)return hotspot(b.dataset.hotspot);
    if(b.classList.contains('item')){run('select',{item:state.selected===b.dataset.item?null:b.dataset.item},{toast:false});return;}
    const a=b.dataset.action;
    if(a==='nav')navigate(b.dataset.room);else if(a==='advance')run('advance');else if(a==='compare')compare();else if(a==='trace')tracePanel();else if(a==='collect')run('collect',{item:b.dataset.item});else if(a==='note')observe(b.dataset.id);else if(a==='panel')panelBox();else if(a==='sound')soundPanel();else if(a==='archive')archivePanel();else if(a==='map')mapPanel();else if(a==='exit')finalChoice();
  });
  $('modal-body').addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.note){if(state.started&&['report','book','roster'].includes(b.dataset.note))run('observe',{id:b.dataset.note},{toast:false});openNote(b.dataset.note,true);return;}
    if(b.dataset.observe){observe(b.dataset.observe);return;}
    if(b.dataset.memory){compare(Number(b.dataset.memory));return;}
    if(b.dataset.modal==='notebook'){notebook();return;}if(b.dataset.modal==='compare'){compare();return;}
    if(b.dataset.trace){const r=run('trace',{answer:b.dataset.trace},{toast:false});if(r.ok){closeModal();toast(r.message);}else $('panel-feedback').textContent=r.message;return;}
    if(b.dataset.tone){if(sequence.length>=3){$('panel-feedback').textContent='已有三段波形。先移除一段，或清空再試。';return;}sequence.push(b.dataset.tone);Audio.play(b.dataset.tone);soundPanel();return;}
    if(Object.hasOwn(b.dataset,'removeTone')){sequence.splice(Number(b.dataset.removeTone),1);soundPanel();return;}
    if(b.dataset.mapItem){const r=run('use',{item:b.dataset.mapItem,target:'map'},{toast:false});mapPanel(r.message);return;}
    if(b.dataset.route){const r=run('route',{node:b.dataset.route},{toast:false});mapPanel(r.message);return;}
    if(b.dataset.ending){const r=run('finish',{ending:b.dataset.ending},{toast:false});if(r.ok)closeModal();return;}
    switch(b.dataset.operation){
      case 'pry':run('use',{item:'pry',target:'panel'});panelBox();break;
      case 'power':run('power');closeModal();break;
      case 'check-sound':{const r=run('sound',{sequence},{toast:false});if(r.ok){closeModal();openNote('broadcast');}else $('panel-feedback').textContent=r.message;break;}
      case 'clear-sound':sequence=[];soundPanel();break;
      case 'rotate':{const r=run('rotate',{}, {toast:false});mapPanel(r.message);break;}
      case 'unfix':{const r=run('unfix',{}, {toast:false});mapPanel(r.message);break;}
      case 'reset-route':{const r=run('resetRoute',{}, {toast:false});mapPanel(r.message);break;}
      case 'final-choice':finalChoice();break;
      case 'confirm-new':enterNew();break;
      case 'cancel':closeModal();break;
      case 'audio-toggle':await toggleAudio();settings();break;
    }
  });
  $('modal-body').addEventListener('submit',e=>{
    if(e.target.id!=='archive-form')return;e.preventDefault();const data=new FormData(e.target),r=run('archive',{time:data.get('time'),line:data.get('line')},{toast:false});
    if(r.ok){closeModal();openNote('facts');toast(r.message);}else $('panel-feedback').textContent=r.message;
  });
  $('modal-body').addEventListener('input',e=>{const el=e.target;if(el.dataset.volume){prefs[el.dataset.volume]=Number(el.value)/100;preference();}else if(el.id==='setting-large'){prefs.large=el.checked;preference();}else if(el.id==='setting-reduced'){prefs.reduced=el.checked;preference();}});
  async function toggleAudio(){const on=await Audio.setEnabled(!Audio.isEnabled());$('audio-button').textContent=on?'聲音：開':'聲音：關';$('audio-button').setAttribute('aria-pressed',String(on));if(!on)toast('聲音已關閉。文字與圖形線索仍然完整。');}
  $('start-button').addEventListener('click',()=>saved?confirmNew():enterNew());$('continue-button').addEventListener('click',resume);
  $('brand').addEventListener('click',e=>{e.preventDefault();goMenu();});$('menu-button').addEventListener('click',goMenu);
  $('notebook-button').addEventListener('click',notebook);$('ending-notebook').addEventListener('click',notebook);
  $('ending-menu').addEventListener('click',goMenu);$('settings-button').addEventListener('click',settings);$('audio-button').addEventListener('click',toggleAudio);
  $('compare-button').addEventListener('click',()=>compare());$('hint-button').addEventListener('click',()=>run('hint',{puzzle:currentPuzzle()},{toast:false}));
  setInterval(()=>{if(screen==='game'&&!document.hidden&&!state.ending){const r=Core.dispatch(state,{type:'tick',seconds:1});state=r.state;$('timer').textContent=time(state.elapsed);if(state.elapsed%15===0)persist();}},1000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});window.addEventListener('pagehide',persist);
  preference();$('title-art').innerHTML=YellowScenes.draw('corridor',{...Core.createState(),loop:3});render();
})();
