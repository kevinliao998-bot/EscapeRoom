(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YellowCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FLAG_KEYS = ['trusted','pry','badge','boxOpen','power','broadcast','archive','filmMounted','overlayFixed','batteryInstalled','route'];
  const ROOMS = ['corridor','stairs','office','archive','platform'];
  const NOTES = ['message','sticker','clock','sign','puddle','memory0','memory1','memory2','memory3','trace','soundGuide','broadcast','report','book','roster','facts','mapGuide'];
  const PUZZLES = ['trace','power','sound','archive','map'];
  const PATH = ['entry','junction','maintenance','exit'];
  const clone = value => JSON.parse(JSON.stringify(value));
  function createState() {
    return { version: 1, source: 'yellow-main-full-v1', started: false, room: 'corridor', loop: 0,
      flags: Object.fromEntries(FLAG_KEYS.map(k => [k,false])), inventory: [], selected: null,
      notes: [], rotation: 90, route: ['entry'], ending: null, elapsed: 0, hints: {} };
  }
  function addNote(s, id) { if (!s.notes.includes(id)) s.notes.push(id); }
  function itemsFor(f) {
    return [f.pry && 'pry', f.badge && !f.overlayFixed && 'badge', f.archive && !f.filmMounted && 'film', f.archive && !f.batteryInstalled && 'battery'].filter(Boolean);
  }
  function canEnter(s, room) {
    const f=s.flags;
    const links={corridor:['stairs','office'],stairs:['corridor'],office:['corridor','archive'],archive:['office','platform'],platform:['archive']};
    if (!links[s.room].includes(room)) return false;
    return room==='corridor' || (room==='stairs' || room==='office' ? f.trusted : room==='archive' ? f.broadcast : f.archive);
  }
  function dispatch(state, action) {
    const original=clone(state), s=clone(state), f=s.flags;
    const fail=message=>({state:original,ok:false,message,event:'error'});
    const done=(message='',event='click')=>{
      s.inventory=itemsFor(s.flags);
      if(!s.inventory.includes(s.selected)) s.selected=null;
      return {state:s,ok:true,message,event};
    };
    if (!action || typeof action.type!=='string') return fail('無法辨識這項操作。');
    const a=action;
    if (a.type==='reset') { const fresh=createState();fresh.started=true;fresh.notes=['message','memory0'];return {state:fresh,ok:true,message:'新的探索已開始。',event:'start'}; }
    if (a.type==='start') { s.started=true;addNote(s,'message');addNote(s,'memory0');return done('先看看飲水機旁的維修貼紙。','start'); }
    if(!s.started || s.ending) return fail('請先開始探索，或回主選單重新開始。');
    switch(a.type) {
      case 'navigate':
        if(!ROOMS.includes(a.room) || !canEnter(s,a.room)) return fail('這條通道還沒有開放。先回頭核對留下的線索。');
        s.room=a.room; s.selected=null; return done('','room');
      case 'observe': {
        const allowed={corridor:['sticker','clock','sign','puddle'],stairs:['trace'],office:['soundGuide'],archive:['report','book','roster'],platform:['mapGuide']};
        if(!allowed[s.room].includes(a.id)) return fail('目前的房間沒有這份紀錄。');
        addNote(s,a.id); return done('已加入調查筆記。','paper');
      }
      case 'advance':
        if(s.room!=='corridor') return fail('請先回到迴圈走廊。');
        if(s.loop>=3) return done('三次繞行的差異已記錄。現在試著判斷可信的線索。');
        s.loop++;addNote(s,'memory'+s.loop);return done('又是同一台飲水機。但有一項細節變了。','room');
      case 'trace':
        if(s.room!=='corridor'||s.loop<3) return fail('先留下三次繞行的紀錄，再比較能被核對的實體痕跡。');
        if(a.answer!=='physical') return fail('時鐘與站名都能被系統改寫。哪一項線索留下了實體接觸的痕跡？');
        f.trusted=true;addNote(s,'trace');return done('鞋印通往飲水機後方的安全梯間。通道已開放。','success');
      case 'collect':
        if(s.room!=='stairs'||!f.trusted||!['pry','badge'].includes(a.item))return fail('這裡找不到這件物品。');
        if(f[a.item])return done('這件物品已在背包或機關上。');
        f[a.item]=true;return done(a.item==='pry'?'取得撬片。':'取得維修員名牌。','paper');
      case 'select':
        if(a.item!==null&&!s.inventory.includes(a.item))return fail('背包裡沒有這件物品。');
        s.selected=a.item;return done();
      case 'use':
        if(!s.inventory.includes(a.item))return fail('背包裡沒有這件物品，或它已安裝在機關上。');
        if(a.item==='pry'&&a.target==='panel'&&s.room==='office'){
          f.boxOpen=true;s.selected=null;return done('檢修盒已打開。可以啟動備用電源。','metal');
        }
        if(a.target==='map'&&s.room==='platform'&&f.archive){
          if(a.item==='film'){f.filmMounted=true;return done('路線片已放上地圖。缺口要對準上方的維修定位標記。','paper');}
          if(a.item==='badge'&&f.filmMounted){f.overlayFixed=true;return done('名牌扣住路線片。需要重調時，可以先鬆開固定。','metal');}
          if(a.item==='battery'){f.batteryInstalled=true;return done('指示燈已亮起。廣播的站名和亮起的節點並不相同。','success');}
        }
        return fail('這件物品不適合用在這裡。物品已保留。');
      case 'power':
        if(s.room!=='office'||!f.boxOpen)return fail('檢修盒還鎖著。試著使用撬片。');
        f.power=true;addNote(s,'soundGuide');return done('備用電源接通。控制台開始顯示三段測試波形。','power');
      case 'sound':
        if(s.room!=='office'||!f.power)return fail('控制台尚未供電。');
        if(!Array.isArray(a.sequence)||a.sequence.join('|')!=='long|short|double')return fail('音序尚未吻合。檢查貼紙的長音、短音與雙短音刻痕。');
        f.broadcast=true;addNote(s,'broadcast');return done('控制台解鎖。三聲提示音，與訊息剪接處完全相同。','success');
      case 'archive':
        if(s.room!=='archive'||!f.broadcast)return fail('尚未開放事故檔案。');
        if(a.time!=='01:17'||a.line!=='M0')return fail('兩項紀錄還沒有互相吻合。比對數字時間、文字時間與刮除的支線編號。');
        if(f.archive)return done('比對結論已保存，路線片與電池不會重複發放。');
        f.archive=true;['report','book','roster','facts'].forEach(x=>addNote(s,x));
        return done('確認事故時間與 M0 維修支線。取得透明路線片與電池，月台通道已開放。','success');
      case 'rotate':
        if(s.room!=='platform'||!f.filmMounted)return fail('先放上透明路線片。');
        if(f.overlayFixed)return fail('名牌正固定著路線片。先鬆開，再調整角度。');
        if(f.route)return fail('路線已校正，不必再轉動。');
        s.rotation=(s.rotation+90)%360;s.route=['entry'];return done('路線片已轉動。','metal');
      case 'unfix':
        if(s.room!=='platform'||!f.overlayFixed||f.route)return fail('目前不需要鬆開固定。');
        f.overlayFixed=false;s.route=['entry'];return done('名牌已收回背包，可以重新調整路線片。','metal');
      case 'route':
        if(s.room!=='platform'||!f.filmMounted||!f.overlayFixed||!f.batteryInstalled)return fail('先放上路線片、固定名牌，並裝入電池。');
        if(s.rotation!==0)return fail('透明片缺口沒有對準上方的定位標記。先鬆開名牌調整。');
        if(f.route)return done('路線已校正，維修門可以開啟。');
        if(a.node!==PATH[s.route.length])return fail('這不是目前路線相鄰的供電節點。可沿亮燈重新判讀，已完成的線索仍保留。');
        s.route.push(a.node);
        if(s.route.length===PATH.length){f.route=true;addNote(s,'mapGuide');return done('維修路線已接通。門後傳來一個熟悉的聲音。','success');}
        return done('供電節點已接上。','metal');
      case 'resetRoute':
        if(s.room!=='platform'||f.route)return fail('目前不需要重設路線。');
        s.route=['entry'];return done('僅清除本次連線，已安裝的物品仍保留。');
      case 'finish':
        if(s.room!=='platform'||!f.route||!['leave','stay'].includes(a.ending))return fail('先校正路線，才能決定最後的處置。');
        s.ending=a.ending;s.selected=null;return done('','ending');
      case 'tick':
        if(!Number.isInteger(a.seconds)||a.seconds<0||a.seconds>60)return fail('計時資料無效。');
        s.elapsed=Math.min(s.elapsed+a.seconds,31536000);return done();
      case 'hint':
        if(!PUZZLES.includes(a.puzzle))return fail('沒有這個謎題的提示。');
        s.hints[a.puzzle]=Math.min((s.hints[a.puzzle]||0)+1,3);return done('提示已開啟，不會代替你操作機關。');
      default:return fail('無法辨識這項操作。');
    }
  }
  function restore(text) {
    try {
      if(typeof text!=='string'||text.length>50000)return null;
      const v=JSON.parse(text);if(!v||typeof v!=='object'||Array.isArray(v))return null;
      if(v.version!==1||v.source!=='yellow-main-full-v1'||typeof v.started!=='boolean'||!ROOMS.includes(v.room))return null;
      if(!Number.isInteger(v.loop)||v.loop<0||v.loop>3||![0,90,180,270].includes(v.rotation))return null;
      if(!Number.isInteger(v.elapsed)||v.elapsed<0||v.elapsed>31536000)return null;
      if(!v.flags||!FLAG_KEYS.every(k=>typeof v.flags[k]==='boolean'))return null;
      const f=v.flags;
      if((f.trusted&&v.loop!==3)||((f.pry||f.badge)&&!f.trusted)||(f.boxOpen&&!f.pry)||(f.power&&!f.boxOpen)||(f.broadcast&&!f.power)||(f.archive&&!f.broadcast))return null;
      if((f.filmMounted||f.batteryInstalled)&&!f.archive)return null;
      if(f.overlayFixed&&(!f.filmMounted||!f.badge))return null;
      const expected=itemsFor(f);
      if(!Array.isArray(v.inventory)||v.inventory.length!==expected.length||new Set(v.inventory).size!==v.inventory.length||!expected.every(x=>v.inventory.includes(x)))return null;
      if(v.selected!==null&&!expected.includes(v.selected))return null;
      if(!Array.isArray(v.route)||v.route.length<1||v.route.length>4||!v.route.every((x,i)=>x===PATH[i]))return null;
      if(v.route.length>1&&(!f.filmMounted||!f.overlayFixed||!f.batteryInstalled||v.rotation!==0))return null;
      if(f.route!==(v.route.length===4))return null;
      if(v.ending!==null&&(!['leave','stay'].includes(v.ending)||!f.route||v.room!=='platform'))return null;
      if((['stairs','office'].includes(v.room)&&!f.trusted)||(v.room==='archive'&&!f.broadcast)||(v.room==='platform'&&!f.archive))return null;
      if(!Array.isArray(v.notes)||v.notes.length>NOTES.length||new Set(v.notes).size!==v.notes.length||!v.notes.every(x=>NOTES.includes(x)))return null;
      if(!v.hints||typeof v.hints!=='object'||Array.isArray(v.hints)||!Object.keys(v.hints).every(k=>PUZZLES.includes(k)&&Number.isInteger(v.hints[k])&&v.hints[k]>=0&&v.hints[k]<=3))return null;
      const s=createState();
      ['started','room','loop','selected','rotation','ending','elapsed'].forEach(k=>s[k]=v[k]);
      FLAG_KEYS.forEach(k=>s.flags[k]=f[k]);s.inventory=[...v.inventory];s.route=[...v.route];s.notes=[...v.notes];
      PUZZLES.forEach(k=>{if(Object.hasOwn(v.hints,k))s.hints[k]=v.hints[k];});return s;
    }catch{return null;}
  }
  function serialize(state) { return JSON.stringify(state); }
  return { createState, dispatch, serialize, restore, PATH, ROOMS };
});
